import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMailConfiguration } from '../src/lib/mail';
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
