import { test, mock } from 'node:test';
import nodemailer from 'nodemailer';
import { contactSchema } from '../src/lib/contact';
import assert from 'node:assert/strict';
import { getMailConfiguration, sendContactEmail } from '../src/lib/mail';
import { OFFICIAL_CONTACT_EMAIL } from '../src/lib/site-config';

test('Gmail cible par défaut le compte officiel et ne nécessite aucun domaine', () => {
  const config = getMailConfiguration({
    EMAIL_PROVIDER: 'gmail',
    GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop',
  });
  assert.deepEqual(config, {
    provider: 'gmail',
    user: OFFICIAL_CONTACT_EMAIL,
    password: 'abcdefghijklmnop',
    to: OFFICIAL_CONTACT_EMAIL,
  });
});
test('sans mot de passe Google, le formulaire reste non activé', () => {
  assert.equal(getMailConfiguration({ EMAIL_PROVIDER: 'gmail' }), null);
  assert.equal(getMailConfiguration({ EMAIL_PROVIDER: 'gmail', GMAIL_APP_PASSWORD: '   ' }), null);
});
test('un destinataire vide revient au Gmail officiel et jamais à celui du visiteur', () => {
  assert.equal(
    getMailConfiguration({
      EMAIL_PROVIDER: 'gmail',
      GMAIL_APP_PASSWORD: 'test-only',
      CONTACT_TO: '',
    })?.to,
    OFFICIAL_CONTACT_EMAIL,
  );
});
test('refuse les adresses de configuration invalides et les fournisseurs inconnus', () => {
  assert.equal(
    getMailConfiguration({
      EMAIL_PROVIDER: 'gmail',
      GMAIL_APP_PASSWORD: 'test-only',
      CONTACT_TO: 'invalide',
    }),
    null,
  );
  assert.equal(
    getMailConfiguration({
      EMAIL_PROVIDER: 'gmail',
      GMAIL_APP_PASSWORD: 'test-only',
      GMAIL_USER: 'invalide',
    }),
    null,
  );
  assert.equal(
    getMailConfiguration({ EMAIL_PROVIDER: 'inconnu', GMAIL_APP_PASSWORD: 'test-only' }),
    null,
  );
});
test('conserve la compatibilité Resend sans exposer les secrets au navigateur', () => {
  const config = getMailConfiguration({
    RESEND_API_KEY: 'test-only',
    CONTACT_FROM: 'test@example.com',
  });
  assert.equal(config?.provider, 'resend');
  assert.equal(config?.to, OFFICIAL_CONTACT_EMAIL);
});

test('les nouvelles variables SMTP sont prises en charge et prioritaires sur les alias', () => {
  assert.deepEqual(
    getMailConfiguration({
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '465',
      SMTP_USER: 'optimaworksgn@gmail.com',
      SMTP_PASSWORD: 'abcd efgh ijkl mnop',
      CONTACT_EMAIL: 'optimaworksgn@gmail.com',
      GMAIL_APP_PASSWORD: 'legacy-test-only',
      CONTACT_TO: 'legacy@example.com',
    }),
    {
      provider: 'gmail',
      user: OFFICIAL_CONTACT_EMAIL,
      password: 'abcdefghijklmnop',
      to: OFFICIAL_CONTACT_EMAIL,
    },
  );
});
test('refuse un hôte ou port SMTP différent et les injections dans la configuration', () => {
  for (const overrides of [
    { SMTP_HOST: 'untrusted.example' },
    { SMTP_PORT: '587' },
    { SMTP_USER: 'test@example.com\r\nBcc: other@example.com' },
    { CONTACT_EMAIL: 'test@example.com\r\nBcc: other@example.com' },
  ])
    assert.equal(getMailConfiguration({ SMTP_PASSWORD: 'test-only', ...overrides }), null);
});
test('une variable SMTP_PASSWORD explicitement vide ne réactive pas un ancien secret', () => {
  assert.equal(
    getMailConfiguration({ SMTP_PASSWORD: '', GMAIL_APP_PASSWORD: 'legacy-test-only' }),
    null,
  );
});

test('le délai SMTP total ferme le transport et refuse le faux succès', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let closed = false;
  const transport = mock.method(
    nodemailer,
    'createTransport',
    () =>
      ({
        sendMail: () => new Promise(() => {}),
        close: () => {
          closed = true;
        },
      }) as unknown as ReturnType<typeof nodemailer.createTransport>,
  );
  try {
    const data = contactSchema.parse({
      name: 'Mamadou Diallo',
      email: 'test@example.com',
      service: 'Graphisme & Design',
      subject: 'Test SMTP',
      message: 'Un message suffisamment long pour le test.',
      consent: true,
    });
    const sending = sendContactEmail(data, {
      provider: 'gmail',
      user: OFFICIAL_CONTACT_EMAIL,
      password: 'test-only',
      to: OFFICIAL_CONTACT_EMAIL,
    });
    const rejected = assert.rejects(sending, /deadline exceeded/);
    context.mock.timers.tick(20_000);
    await rejected;
    assert.equal(closed, true);
  } finally {
    transport.mock.restore();
    context.mock.timers.reset();
  }
});
