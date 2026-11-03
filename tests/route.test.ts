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

function configureGmail(autoReply = false) {
  process.env.EMAIL_PROVIDER = 'gmail';
  process.env.SMTP_PASSWORD = 'test-only';
  process.env.CONTACT_EMAIL = 'optimaworksgn@gmail.com';
  process.env.CONTACT_AUTOREPLY_ENABLED = String(autoReply);
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

test('Gmail envoie un multipart sûr avec expéditeur fixe et Reply-To visiteur', async () => {
  configureGmail();
  let sent = 0;
  const stub = mock.method(nodemailer, 'createTransport', (options: unknown) => {
    assert.equal((options as { port: number }).port, 465);
    return {
      sendMail: async (mail: {
        from: { name: string; address: string };
        to: string;
        replyTo: string;
        subject: string;
        html: string;
        text: string;
      }) => {
        sent++;
        assert.deepEqual(mail.from, {
          name: 'OptimaWorks Website',
          address: 'optimaworksgn@gmail.com',
        });
        assert.equal(mail.replyTo, valid.email);
        assert.equal(mail.subject, 'Nouvelle demande de contact – OptimaWorks');
        assert.ok(mail.html.includes('&lt;script&gt;'));
        assert.ok(!mail.html.includes('<script>'));
        assert.ok(mail.text.includes('<script>'));
        return { accepted: [mail.to], rejected: [], response: '250 OK' };
      },
      close() {},
    } as unknown as ReturnType<typeof nodemailer.createTransport>;
  });
  try {
    const response = await POST(
      request({ ...valid, message: 'Voici un message <script>alert(1)</script> & test.' }),
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).acknowledgement, 'disabled');
    assert.equal(sent, 1);
  } finally {
    stub.mock.restore();
  }
});

test('l’accusé nécessite un challenge vérifié pour éviter le relais automatique abusif', async () => {
  configureGmail(true);
  const stub = mock.method(nodemailer, 'createTransport');
  try {
    assert.equal((await POST(request())).status, 503);
    assert.equal(stub.mock.callCount(), 0);
  } finally {
    stub.mock.restore();
  }
});

for (const scenario of ['success', 'primary-failure', 'ack-failure'] as const) {
  test(`accusé indépendant : ${scenario}`, async () => {
    configureGmail(true);
    process.env.TURNSTILE_SECRET_KEY = 'test-only';
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key';
    const verification = mock.method(global, 'fetch', async () =>
      Response.json({ success: true, action: 'contact', hostname: 'localhost' }),
    );
    let sends = 0;
    const logs: string[] = [];
    const log = mock.method(console, 'info', (value: string) => {
      logs.push(value);
    });
    const transport = mock.method(
      nodemailer,
      'createTransport',
      () =>
        ({
          sendMail: async (mail: { to: string; replyTo: string; html: string; text: string }) => {
            sends++;
            if (sends === 1) {
              assert.equal(mail.to, 'optimaworksgn@gmail.com');
              if (scenario === 'primary-failure') throw new Error('private SMTP detail');
            } else {
              assert.equal(mail.to, valid.email);
              assert.equal(mail.replyTo, 'optimaworksgn@gmail.com');
              assert.ok(mail.text.includes('Nous avons bien reçu votre message'));
              assert.ok(!mail.text.includes(valid.message));
              assert.ok(!mail.html.includes(valid.message));
              if (scenario === 'ack-failure') throw new Error('private SMTP detail');
            }
            return { accepted: [mail.to], rejected: [], response: '250 OK' };
          },
          close() {},
        }) as unknown as ReturnType<typeof nodemailer.createTransport>,
    );
    try {
      const response = await POST(request({ ...valid, turnstileToken: 'test-token' }));
      assert.equal(response.status, scenario === 'primary-failure' ? 502 : 200);
      const body = await response.json();
      assert.equal(sends, scenario === 'primary-failure' ? 1 : 2);
      if (scenario !== 'primary-failure')
        assert.equal(body.acknowledgement, scenario === 'success' ? 'sent' : 'failed');
      assert.ok(!JSON.stringify(body).includes('private SMTP'));
      for (const value of [
        valid.email,
        valid.message,
        valid.name,
        'test-token',
        'test-only',
        'private SMTP',
      ])
        assert.ok(!logs.join('').includes(value));
      for (const line of logs) {
        const item = JSON.parse(line);
        assert.ok(!Number.isNaN(Date.parse(item.timestamp)));
        assert.ok(item.requestId);
        assert.deepEqual(
          Object.keys(item).sort(),
          item.event.endsWith('_failed')
            ? ['event', 'failure', 'provider', 'requestId', 'timestamp']
            : ['event', 'provider', 'requestId', 'timestamp'],
        );
      }
    } finally {
      transport.mock.restore();
      verification.mock.restore();
      log.mock.restore();
      configureGmail();
    }
  });
}

test('challenge refusé ou indisponible : aucun envoi SMTP', async () => {
  for (const status of [200, 503]) {
    configureGmail();
    process.env.TURNSTILE_SECRET_KEY = 'test-only';
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key';
    const verification = mock.method(global, 'fetch', async () =>
      Response.json({ success: false }, { status }),
    );
    const transport = mock.method(nodemailer, 'createTransport');
    try {
      assert.equal(
        (await POST(request({ ...valid, turnstileToken: 'test-token' }))).status,
        status === 200 ? 400 : 503,
      );
      assert.equal(transport.mock.callCount(), 0);
    } finally {
      transport.mock.restore();
      verification.mock.restore();
      configureGmail();
    }
  }
});

test('refuse le type de contenu incorrect et le JSON malformé', async () => {
  assert.equal((await POST(request(valid, { 'content-type': 'text/plain' }))).status, 415);
  const malformed = new NextRequest('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      'content-type': 'application/json',
      'x-forwarded-for': '192.0.2.250',
    },
    body: '{',
  });
  assert.equal((await POST(malformed)).status, 400);
});

test('Vercel utilise son en-tête IP même si TRUST_PROXY est désactivé', async () => {
  process.env.VERCEL = '1';
  process.env.TRUST_PROXY = 'false';
  try {
    for (let i = 0; i < 5; i++)
      assert.equal((await POST(request({}, { 'x-forwarded-for': '198.51.100.90' }))).status, 400);
    assert.equal((await POST(request({}, { 'x-forwarded-for': '198.51.100.90' }))).status, 429);
    assert.equal((await POST(request({}, { 'x-forwarded-for': '198.51.100.91' }))).status, 400);
  } finally {
    delete process.env.VERCEL;
    process.env.TRUST_PROXY = 'true';
  }
});

function multipartRequest(form: FormData, extra: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      'x-forwarded-for': `192.0.2.${ip++}`,
      ...extra,
    },
    body: form,
  });
}
function contactMultipart(data: Record<string, unknown> = valid) {
  const form = new FormData();
  for (const [name, value] of Object.entries(data)) form.append(name, String(value));
  return form;
}

test('collecte tous les champs et transmet le fichier au compte officiel uniquement', async () => {
  configureGmail();
  const data = { ...valid, company: 'Entreprise de test', phone: '+224 600 00 00 00' };
  const form = contactMultipart(data);
  const content = 'Description du projet jointe au formulaire.';
  form.append('descriptionFile', new File([content], 'description.txt', { type: 'text/plain' }));
  let sends = 0;
  const transport = mock.method(
    nodemailer,
    'createTransport',
    () =>
      ({
        sendMail: async (mail: {
          to: string;
          replyTo: string;
          text: string;
          html: string;
          attachments: {
            content: Buffer;
            filename: string;
            contentType: string;
            contentDisposition: string;
          }[];
        }) => {
          sends++;
          assert.equal(mail.to, 'optimaworksgn@gmail.com');
          assert.equal(mail.replyTo, data.email);
          for (const value of Object.values(data).filter((v): v is string => typeof v === 'string'))
            assert.ok(mail.text.includes(value));
          assert.ok(mail.html.includes(data.company));
          assert.ok(mail.html.includes(data.phone));
          assert.equal(mail.attachments.length, 1);
          assert.equal(mail.attachments[0].content.toString(), content);
          assert.equal(mail.attachments[0].contentType, 'text/plain');
          assert.equal(mail.attachments[0].contentDisposition, 'attachment');
          return { accepted: [mail.to], rejected: [], response: '250 OK' };
        },
        close() {},
      }) as unknown as ReturnType<typeof nodemailer.createTransport>,
  );
  try {
    assert.equal((await POST(multipartRequest(form))).status, 200);
    assert.equal(sends, 1);
  } finally {
    transport.mock.restore();
  }
});

test('multipart sans pièce jointe conserve le fonctionnement du formulaire', async () => {
  configureGmail();
  const transport = mock.method(
    nodemailer,
    'createTransport',
    () =>
      ({
        sendMail: async (mail: { to: string; attachments?: unknown }) => {
          assert.equal(mail.attachments, undefined);
          return { accepted: [mail.to], rejected: [], response: '250 OK' };
        },
        close() {},
      }) as unknown as ReturnType<typeof nodemailer.createTransport>,
  );
  try {
    assert.equal((await POST(multipartRequest(contactMultipart()))).status, 200);
  } finally {
    transport.mock.restore();
  }
});

test('pièces jointes invalides ou multiples : aucun appel SMTP', async () => {
  configureGmail();
  const transport = mock.method(nodemailer, 'createTransport');
  const forms = [
    () => {
      const f = contactMultipart();
      f.append(
        'descriptionFile',
        new File(['bad'], 'description.pdf', { type: 'application/pdf' }),
      );
      return f;
    },
    () => {
      const f = contactMultipart();
      f.append('descriptionFile', new File(['x'.repeat(2 * 1024 * 1024 + 1)], 'description.txt'));
      return f;
    },
    () => {
      const f = contactMultipart();
      for (let i = 0; i < 2; i++)
        f.append('descriptionFile', new File(['text'], 'description.txt'));
      return f;
    },
    () => {
      const f = contactMultipart();
      f.append('descriptionFile', 'https://example.com/private.pdf');
      return f;
    },
    () => {
      const f = contactMultipart();
      f.append('company', new File(['text'], 'description.txt'));
      return f;
    },
    () => {
      const f = contactMultipart();
      f.append('email', 'another@example.com');
      return f;
    },
    () => {
      const f = contactMultipart();
      f.append('to', 'another@example.com');
      return f;
    },
    () => contactMultipart({ ...valid, email: 'adresse_invalide@gmail.com' }),
  ];
  try {
    for (const makeForm of forms)
      assert.equal((await POST(multipartRequest(makeForm()))).status, 400);
    assert.equal(transport.mock.callCount(), 0);
  } finally {
    transport.mock.restore();
  }
});

test('limite la taille multipart par lecture du flux même sans Content-Length', async () => {
  const form = contactMultipart();
  form.append(
    'descriptionFile',
    new File(['x'.repeat(2 * 1024 * 1024 + 64_000)], 'description.txt'),
  );
  const req = multipartRequest(form);
  assert.equal(req.headers.has('content-length'), false);
  assert.equal((await POST(req)).status, 413);
  const largeText = contactMultipart({ ...valid, message: 'a'.repeat(24_001) });
  assert.equal((await POST(multipartRequest(largeText))).status, 413);
});

test('n’envoie jamais la pièce jointe dans l’accusé et ne journalise pas son contenu', async () => {
  configureGmail(true);
  process.env.TURNSTILE_SECRET_KEY = 'test-only';
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key';
  const form = contactMultipart({ ...valid, turnstileToken: 'test-token' });
  form.append(
    'descriptionFile',
    new File(['confidential attachment body'], 'document-confidentiel.txt'),
  );
  const verification = mock.method(global, 'fetch', async () =>
    Response.json({ success: true, action: 'contact', hostname: 'localhost' }),
  );
  const logs: string[] = [];
  const log = mock.method(console, 'info', (line: string) => {
    logs.push(line);
  });
  let sends = 0;
  const transport = mock.method(
    nodemailer,
    'createTransport',
    () =>
      ({
        sendMail: async (mail: { to: string; attachments?: unknown[] }) => {
          sends++;
          if (sends === 1) assert.equal(mail.attachments?.length, 1);
          else assert.equal(mail.attachments, undefined);
          return { accepted: [mail.to], rejected: [], response: '250 OK' };
        },
        close() {},
      }) as unknown as ReturnType<typeof nodemailer.createTransport>,
  );
  try {
    const response = await POST(multipartRequest(form));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).acknowledgement, 'sent');
    assert.equal(sends, 2);
    assert.ok(!logs.join('').includes('confidential attachment body'));
    assert.ok(!logs.join('').includes('document-confidentiel'));
  } finally {
    transport.mock.restore();
    verification.mock.restore();
    log.mock.restore();
    configureGmail();
  }
});

test('un refus Gmail est identifiable uniquement dans le log sûr, avec référence corrélable', async () => {
  configureGmail();
  const logs: string[] = [];
  const log = mock.method(console, 'info', (line: string) => {
    logs.push(line);
  });
  const transport = mock.method(
    nodemailer,
    'createTransport',
    () =>
      ({
        sendMail: async () => {
          throw Object.assign(new Error('private account and password details'), {
            code: 'EAUTH',
            response: 'private provider response',
          });
        },
        close() {},
      }) as unknown as ReturnType<typeof nodemailer.createTransport>,
  );
  try {
    const response = await POST(request());
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.match(body.requestId, /^[a-f0-9-]{36}$/i);
    assert.equal(body.failure, undefined);
    assert.ok(!JSON.stringify(body).includes('EAUTH'));
    assert.ok(!JSON.stringify(body).includes('private'));
    assert.equal(logs.length, 1);
    const entry = JSON.parse(logs[0]);
    assert.equal(entry.failure, 'SMTP_AUTH_REJECTED');
    assert.equal(entry.requestId, body.requestId);
    for (const value of ['private', valid.email, 'test-only']) assert.ok(!logs[0].includes(value));
  } finally {
    transport.mock.restore();
    log.mock.restore();
  }
});
