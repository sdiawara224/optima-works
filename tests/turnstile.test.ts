import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { verifyContactChallenge } from '../src/lib/turnstile';
const env = { TURNSTILE_SECRET_KEY: 'test-only', NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-site-key' };

test('Turnstile désactivé ou configuration partielle explicites, sans appel réseau', async () => {
  const stub = mock.method(global, 'fetch', async () => {
    throw new Error('Unexpected call');
  });
  try {
    assert.equal(await verifyContactChallenge('', 'example.com', {}), 'disabled');
    assert.equal(
      await verifyContactChallenge('', 'example.com', { TURNSTILE_SECRET_KEY: 'test-only' }),
      'misconfigured',
    );
    assert.equal(
      await verifyContactChallenge('', 'example.com', { NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'key' }),
      'misconfigured',
    );
    assert.equal(await verifyContactChallenge('', 'example.com', env), 'rejected');
    assert.equal(stub.mock.callCount(), 0);
  } finally {
    stub.mock.restore();
  }
});
test('Turnstile contrôle succès strict, action et nom d’hôte côté serveur', async () => {
  for (const [result, expected] of [
    [{ success: true, action: 'contact', hostname: 'example.com' }, 'verified'],
    [{ success: true, action: 'other', hostname: 'example.com' }, 'rejected'],
    [{ success: true, action: 'contact', hostname: 'evil.example' }, 'rejected'],
    [{ success: 'true', action: 'contact', hostname: 'example.com' }, 'rejected'],
    [{ success: false }, 'rejected'],
  ] as const) {
    const stub = mock.method(global, 'fetch', async (url: unknown, options?: RequestInit) => {
      assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
      assert.deepEqual(JSON.parse(options!.body as string), {
        secret: 'test-only',
        response: 'token',
      });
      return Response.json(result);
    });
    try {
      assert.equal(await verifyContactChallenge('token', 'example.com', env), expected);
    } finally {
      stub.mock.restore();
    }
  }
});
test('Turnstile refuse par défaut en cas de panne, timeout ou réponse invalide', async () => {
  for (const handler of [
    async () => new Response('{}', { status: 503 }),
    async () => {
      throw new Error('private network detail');
    },
    async () => new Response('invalid-json'),
  ]) {
    const stub = mock.method(global, 'fetch', handler);
    try {
      assert.equal(await verifyContactChallenge('token', 'example.com', env), 'unavailable');
    } finally {
      stub.mock.restore();
    }
  }
});
