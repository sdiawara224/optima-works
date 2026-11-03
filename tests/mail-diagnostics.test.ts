import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mailFailureCategory } from '../src/lib/mail-diagnostics';

test('classe les erreurs connues sans recopier les détails SMTP', () => {
  const cases = [
    ['EAUTH', 'SMTP_AUTH_REJECTED'],
    ['ETIMEDOUT', 'SMTP_TIMEOUT'],
    ['SMTP_DEADLINE', 'SMTP_TIMEOUT'],
    ['ECONNREFUSED', 'SMTP_CONNECTION_FAILED'],
    ['EDNS', 'SMTP_CONNECTION_FAILED'],
    ['ESOCKET', 'SMTP_CONNECTION_FAILED'],
    ['ETLS', 'SMTP_TLS_FAILED'],
    ['CERT_HAS_EXPIRED', 'SMTP_TLS_FAILED'],
    ['EENVELOPE', 'SMTP_ENVELOPE_REJECTED'],
    ['EMESSAGE', 'MAIL_CONTENT_FAILED'],
    ['ESTREAM', 'MAIL_CONTENT_FAILED'],
    ['SMTP_NOT_ACCEPTED', 'SMTP_ACCEPTANCE_UNCONFIRMED'],
  ];
  for (const [code, category] of cases) {
    assert.equal(
      mailFailureCategory({
        code,
        message: 'private details',
        response: 'private details',
        stack: 'private details',
      }),
      category,
    );
  }
  assert.equal(mailFailureCategory({ responseCode: 535 }), 'SMTP_AUTH_REJECTED');
});
test('une erreur arbitraire ne peut injecter ses propriétés dans le diagnostic', () => {
  for (const value of [
    null,
    undefined,
    'private details',
    new Error('private details'),
    { code: 'EAUTH\nprivate details', responseCode: '535', response: 'private details' },
  ])
    assert.equal(mailFailureCategory(value), 'DELIVERY_FAILED');
});
