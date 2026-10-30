// Server-side verification. Never trust the widget's client-side callback alone.
export type ChallengeStatus =
  'verified' | 'disabled' | 'rejected' | 'unavailable' | 'misconfigured';

export async function verifyContactChallenge(
  token: string,
  hostname: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<ChallengeStatus> {
  const secret = env.TURNSTILE_SECRET_KEY;
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!secret && !siteKey) return 'disabled';
  if (!secret || !siteKey) return 'misconfigured';
  if (!token) return 'rejected';
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return 'unavailable';
    const result = await response.json();
    return result.success === true && result.action === 'contact' && result.hostname === hostname
      ? 'verified'
      : 'rejected';
  } catch {
    return 'unavailable';
  }
}
