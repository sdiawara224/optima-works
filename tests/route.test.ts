import { test, mock } from 'node:test';
import nodemailer from 'nodemailer';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/contact/route';
const valid = {
  name: 'Aïssatou Diallo',
  email: 'test@example.com',
  service: 'Graphisme & Design',
  subject: 'Identité visuelle',
  message: 'Un projet de création de supports de communication.',
  consent: true,
};
let ip = 1;
function request(body: unknown = valid, extra: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      'x-forwarded-for': `192.0.2.${ip++}`,
      ...extra,
    },
    body: JSON.stringify(body),
  });
}
process.env.TRUST_PROXY = 'true';
process.env.EMAIL_PROVIDER = 'resend';
delete process.env.SITE_URL;
test('rejette une origine étrangère', async () => {
  assert.equal((await POST(request(valid, { origin: 'https://evil.example' }))).status, 403);
});
test('valide aussi les champs côté serveur', async () => {
  const response = await POST(request({ ...valid, email: 'invalide' }));
  assert.equal(response.status, 400);
  assert.ok((await response.json()).errors.email);
});
test('bloque le honeypot sans faux succès', async () => {
  assert.equal((await POST(request({ ...valid, website: 'bot' }))).status, 400);
});
test('limite la taille du corps', async () => {
  assert.equal((await POST(request({ ...valid, message: 'a'.repeat(25_000) }))).status, 413);
});
test('signale la messagerie non configurée', async () => {
  delete process.env.RESEND_API_KEY;
  assert.equal((await POST(request())).status, 503);
});
test('ne réussit qu’après confirmation du fournisseur', async () => {
  const original = global.fetch;
  process.env.RESEND_API_KEY = 'test-only';
  process.env.CONTACT_TO = 'test@example.com';
  process.env.CONTACT_FROM = 'test@example.com';
  global.fetch = async () => new Response(JSON.stringify({ id: 'test-delivery' }), { status: 200 });
  try {
    assert.equal((await POST(request())).status, 200);
  } finally {
    global.fetch = original;
  }
});
test('une panne fournisseur ne devient jamais un succès', async () => {
  const original = global.fetch;
  global.fetch = async () => new Response('{}', { status: 503 });
  try {
    assert.equal((await POST(request())).status, 502);
  } finally {
    global.fetch = original;
  }
});
test('un identifiant de confirmation manquant est un échec', async () => {
  const original = global.fetch;
  global.fetch = async () => new Response('{}', { status: 200 });
  try {
    assert.equal((await POST(request())).status, 502);
  } finally {
    global.fetch = original;
  }
});
test('bloque après cinq tentatives sur dix minutes', async () => {
  const fixed = { 'x-forwarded-for': '198.51.100.70' };
  for (let i = 0; i < 5; i++) await POST(request({}, fixed));
  const res = await POST(request({}, fixed));
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('Retry-After'), '600');
});

test('Gmail transmet tous les champs au compte officiel avant de confirmer', async () => {
  process.env.EMAIL_PROVIDER = 'gmail';
  process.env.GMAIL_APP_PASSWORD = 'test-only';
  delete process.env.GMAIL_USER;
  delete process.env.CONTACT_TO;
  let closed = false;
  const stub = mock.method(nodemailer, 'createTransport', (options: unknown) => {
    const config = options as { host: string; secure: boolean };
    assert.equal(config.host, 'smtp.gmail.com');
    assert.equal(config.secure, true);
    return {
      sendMail: async (mail: { to: string; replyTo: string; text: string }) => {
        assert.equal(mail.to, 'optimaworksgn@gmail.com');
        assert.equal(mail.replyTo, valid.email);
        for (const value of [valid.name, valid.email, valid.service, valid.subject, valid.message])
          assert.ok(mail.text.includes(value));
        return { accepted: ['optimaworksgn@gmail.com'], rejected: [], response: '250 2.0.0 OK' };
      },
      close: () => {
        closed = true;
      },
    } as unknown as ReturnType<typeof nodemailer.createTransport>;
  });
  try {
    assert.equal((await POST(request())).status, 200);
    assert.equal(closed, true);
  } finally {
    stub.mock.restore();
  }
});
test('Gmail refusé ne produit aucun faux succès', async () => {
  const stub = mock.method(
    nodemailer,
    'createTransport',
    () =>
      ({
        sendMail: async () => ({
          accepted: [],
          rejected: ['optimaworksgn@gmail.com'],
          response: '550 rejected',
        }),
        close: () => {},
      }) as unknown as ReturnType<typeof nodemailer.createTransport>,
  );
  try {
    assert.equal((await POST(request())).status, 502);
  } finally {
    stub.mock.restore();
  }
});
test('une erreur d’authentification Gmail affiche une erreur sans révéler le secret', async () => {
  const stub = mock.method(
    nodemailer,
    'createTransport',
    () =>
      ({
        sendMail: async () => {
          throw new Error('Private SMTP authentication details');
        },
        close: () => {},
      }) as unknown as ReturnType<typeof nodemailer.createTransport>,
  );
  try {
    const response = await POST(request());
    assert.equal(response.status, 502);
    assert.ok(!(await response.text()).includes('Private SMTP'));
  } finally {
    stub.mock.restore();
  }
});
test('sans mot de passe Gmail la route signale qu’aucun message n’a été envoyé', async () => {
  delete process.env.GMAIL_APP_PASSWORD;
  assert.equal((await POST(request())).status, 503);
});
