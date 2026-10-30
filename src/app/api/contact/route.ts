import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/contact';
import { getMailConfiguration, sendContactEmail } from '@/lib/mail';
import { createHash } from 'node:crypto';

export const runtime = 'nodejs';
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
    process.env.TRUST_PROXY === 'true'
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
  const config = getMailConfiguration();
  if (!config)
    return fail('L’envoi par e-mail n’est pas encore activé. Aucun message n’a été transmis.', 503);
  try {
    await sendContactEmail(result.data, config);
    return NextResponse.json(
      { message: 'Votre demande a été envoyée.' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    // Never log form data, credentials or the provider response.
    console.error('Échec du fournisseur de messagerie.');
    return fail(
      'Votre message n’a pas pu être envoyé. Réessayez ou utilisez un autre moyen de contact disponible.',
      502,
    );
  }
}
