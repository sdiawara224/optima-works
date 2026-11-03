import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/contact';
import { getMailConfiguration, sendContactEmail, sendContactAcknowledgement } from '@/lib/mail';
import { createHash, randomUUID } from 'node:crypto';
import { verifyContactChallenge } from '@/lib/turnstile';
import { mailFailureCategory, type MailFailureCategory } from '@/lib/mail-diagnostics';
import { MAX_DESCRIPTION_FILE_BYTES } from '@/lib/contact-file';
import {
  readDescriptionAttachment,
  InvalidDescriptionFile,
  type ContactAttachment,
} from '@/lib/contact-attachment';

export const runtime = 'nodejs';
export const maxDuration = 60;

function audit(requestId: string, event: string, provider?: string, failure?: MailFailureCategory) {
  // Only operational metadata. No IP, message, recipient, token, credentials or SMTP response.
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      event,
      provider,
      ...(failure ? { failure } : {}),
    }),
  );
}
const windows = new Map<string, { count: number; expires: number }>();
const MAX_TEXT_BYTES = 24_000;
// Stay below Vercel’s request limit, including multipart headers/boundaries.
const MAX_MULTIPART_BYTES = MAX_DESCRIPTION_FILE_BYTES + 64_000;

function fail(message: string, status: number, extras = {}) {
  return NextResponse.json(
    { message, ...extras },
    {
      status,
      headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '600' } : {}) },
    },
  );
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const origin = request.headers.get('origin');
  let allowedOrigin = false;
  try {
    const parsedOrigin = new URL(origin || '');
    allowedOrigin = process.env.SITE_URL
      ? parsedOrigin.origin === new URL(process.env.SITE_URL).origin
      : ['https:', 'http:'].includes(parsedOrigin.protocol) &&
        parsedOrigin.host === request.headers.get('host');
  } catch {
    /* Missing or malformed origins are rejected. */
  }
  if (!allowedOrigin) return fail('Cette origine n’est pas autorisée.', 403);
  const contentType = request.headers.get('content-type') || '';
  const mediaType = contentType.split(';')[0].trim().toLowerCase();
  const multipart = mediaType === 'multipart/form-data';
  if (!multipart && mediaType !== 'application/json')
    return fail('Format de demande non accepté.', 415);
  const maxBytes = multipart ? MAX_MULTIPART_BYTES : MAX_TEXT_BYTES;
  // Trust this header only behind a proxy that overwrites it. Without one, use a shared bucket.
  const ip =
    process.env.VERCEL === '1' || process.env.TRUST_PROXY === 'true'
      ? (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'shared')
      : 'shared';
  const key = createHash('sha256').update(ip).digest('hex');
  const now = Date.now();
  for (const [id, item] of windows) if (item.expires <= now) windows.delete(id);
  if (!windows.has(key) && windows.size >= 10_000)
    return fail('Trop de demandes. Réessayez dans quelques minutes.', 429);
  const bucket = windows.get(key) ?? { count: 0, expires: now + 600_000 };
  bucket.count++;
  windows.set(key, bucket);
  if (bucket.count > 5)
    return fail('Trop de tentatives. Merci de patienter 10 minutes avant de réessayer.', 429);
  if (Number(request.headers.get('content-length')) > maxBytes)
    return fail('Votre demande est trop volumineuse.', 413);
  let raw: unknown;
  let attachment: ContactAttachment | undefined;
  try {
    const reader = request.body?.getReader();
    if (!reader) return fail('Demande vide.', 400);
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        return fail('Votre demande est trop volumineuse.', 413);
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks);
    if (multipart) {
      // Parse only after reading through the byte limit (formData() alone is unbounded).
      const form = await new Response(body, {
        headers: { 'Content-Type': contentType },
      }).formData();
      const fields: Record<string, string | boolean> = {};
      let textBytes = 0;
      let descriptionFile: File | undefined;
      const allowed = new Set([
        'name',
        'company',
        'email',
        'phone',
        'service',
        'subject',
        'message',
        'consent',
        'website',
        'turnstileToken',
      ]);
      for (const [name, value] of form) {
        if (name === 'descriptionFile') {
          if (descriptionFile || typeof value === 'string')
            return fail('Joignez un seul fichier de description.', 400);
          descriptionFile = value;
          continue;
        }
        if (!allowed.has(name) || typeof value !== 'string' || Object.hasOwn(fields, name))
          return fail('Les champs du formulaire ne sont pas valides.', 400);
        textBytes += Buffer.byteLength(value, 'utf8');
        if (textBytes > MAX_TEXT_BYTES) return fail('Votre demande est trop volumineuse.', 413);
        fields[name] = value;
      }
      fields.consent = fields.consent === 'true';
      raw = fields;
      // A browser's unselected file input may produce an empty unnamed part.
      if (descriptionFile && (descriptionFile.name || descriptionFile.size))
        attachment = await readDescriptionAttachment(descriptionFile);
    } else {
      raw = JSON.parse(body.toString('utf8'));
    }
  } catch (error) {
    if (error instanceof InvalidDescriptionFile)
      return fail(error.message, 400, { errors: { descriptionFile: error.message } });
    return fail('Votre demande n’a pas pu être lue.', 400);
  }
  const result = contactSchema.safeParse(raw);
  if (!result.success)
    return fail('Vérifiez les champs du formulaire.', 400, {
      errors: Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message])),
    });
  if (result.data.website)
    return fail(
      'La demande n’a pas pu être envoyée. Veuillez réessayer sans préremplissage automatique.',
      400,
    );
  const challenge = await verifyContactChallenge(
    result.data.turnstileToken,
    new URL(origin!).hostname,
  );
  if (challenge === 'misconfigured' || challenge === 'unavailable') {
    audit(requestId, `challenge_${challenge}`);
    return fail('La vérification anti-spam est indisponible. Veuillez réessayer.', 503);
  }
  if (challenge === 'rejected') return fail('Veuillez renouveler la vérification anti-spam.', 400);
  const autoReply = process.env.CONTACT_AUTOREPLY_ENABLED === 'true';
  // Avoid making an unprotected public endpoint into an automatic mail reflector.
  if (autoReply && challenge !== 'verified') {
    audit(requestId, 'autoreply_requires_challenge');
    return fail('Le service de contact est temporairement indisponible.', 503);
  }
  const config = getMailConfiguration();
  if (!config)
    return fail('L’envoi par e-mail n’est pas encore activé. Aucun message n’a été transmis.', 503);
  try {
    await sendContactEmail(result.data, config, attachment);
  } catch (error) {
    audit(requestId, 'primary_failed', config.provider, mailFailureCategory(error));
    return fail("Une erreur est survenue lors de l'envoi. Veuillez réessayer.", 502, { requestId });
  }
  audit(requestId, 'primary_accepted', config.provider);
  let acknowledgement: 'sent' | 'failed' | 'disabled' = 'disabled';
  if (autoReply) {
    try {
      await sendContactAcknowledgement(result.data, config);
      acknowledgement = 'sent';
      audit(requestId, 'acknowledgement_accepted', config.provider);
    } catch (error) {
      // The primary request already succeeded. Never invite the visitor to submit it again.
      acknowledgement = 'failed';
      audit(requestId, 'acknowledgement_failed', config.provider, mailFailureCategory(error));
    }
  }
  return NextResponse.json(
    {
      message: 'Votre message a bien été envoyé. Nous vous répondrons dans les meilleurs délais.',
      acknowledgement,
      requestId,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
