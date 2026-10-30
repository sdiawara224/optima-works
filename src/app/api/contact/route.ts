import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/contact';
import { getMailConfiguration, sendContactEmail, sendContactAcknowledgement } from '@/lib/mail';
import { createHash, randomUUID } from 'node:crypto';
import { verifyContactChallenge } from '@/lib/turnstile';

export const runtime = 'nodejs';
export const maxDuration = 60;

function audit(requestId: string, event: string, provider?: string) {
  // Only operational metadata. No IP, message, recipient, token, credentials or SMTP response.
  console.info(JSON.stringify({ timestamp: new Date().toISOString(), requestId, event, provider }));
}
const windows = new Map<string, { count: number; expires: number }>();
const MAX_BYTES = 24_000;

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
  if (!request.headers.get('content-type')?.includes('application/json'))
    return fail('Format de demande non accepté.', 415);
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
  if (Number(request.headers.get('content-length')) > MAX_BYTES)
    return fail('Votre demande est trop volumineuse.', 413);
  let raw: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return fail('Demande vide.', 400);
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) {
        await reader.cancel();
        return fail('Votre demande est trop volumineuse.', 413);
      }
      chunks.push(value);
    }
    raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
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
    await sendContactEmail(result.data, config);
  } catch {
    audit(requestId, 'primary_failed', config.provider);
    return fail("Une erreur est survenue lors de l'envoi. Veuillez réessayer.", 502);
  }
  audit(requestId, 'primary_accepted', config.provider);
  let acknowledgement: 'sent' | 'failed' | 'disabled' = 'disabled';
  if (autoReply) {
    try {
      await sendContactAcknowledgement(result.data, config);
      acknowledgement = 'sent';
      audit(requestId, 'acknowledgement_accepted', config.provider);
    } catch {
      // The primary request already succeeded. Never invite the visitor to submit it again.
      acknowledgement = 'failed';
      audit(requestId, 'acknowledgement_failed', config.provider);
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
