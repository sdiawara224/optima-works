import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactSchema, emailText } from '../src/lib/contact';

export const valid = {
  name: 'Aïssatou Diallo',
  company: '',
  email: 'contact@example.com',
  phone: '+224 610 39 72 58',
  service: 'Graphisme & Design',
  subject: 'Une identité de marque',
  message: 'Je souhaite concevoir une nouvelle identité pour mon entreprise.',
  consent: true,
  website: '',
};
test('accepte les noms accentués et les coordonnées valides', () => {
  assert.equal(contactSchema.safeParse(valid).success, true);
});
test('accepte les champs facultatifs vides', () => {
  assert.equal(contactSchema.safeParse({ ...valid, company: undefined, phone: '' }).success, true);
});
test('refuse les champs obligatoires absents', () => {
  assert.equal(contactSchema.safeParse({}).success, false);
});
test('refuse une adresse e-mail invalide', () => {
  assert.equal(contactSchema.safeParse({ ...valid, email: 'invalide' }).success, false);
});
test('refuse un service non autorisé', () => {
  assert.equal(contactSchema.safeParse({ ...valid, service: 'CRM' }).success, false);
});
test('refuse un besoin trop court ou trop long', () => {
  for (const message of ['court', 'a'.repeat(5001)])
    assert.equal(contactSchema.safeParse({ ...valid, message }).success, false);
});
test('exige une information de confidentialité acceptée', () => {
  assert.equal(contactSchema.safeParse({ ...valid, consent: false }).success, false);
});
test('refuse les numéros incohérents et les noms contenant du HTML', () => {
  assert.equal(contactSchema.safeParse({ ...valid, phone: '<script>' }).success, false);
  assert.equal(contactSchema.safeParse({ ...valid, name: '<h1>Test</h1>' }).success, false);
});
test('produit un e-mail texte structuré, sans HTML interprété', () => {
  const parsed = contactSchema.parse({
    ...valid,
    message: 'Une demande contenant <script>alert(1)</script>.',
  });
  const text = emailText(parsed);
  assert.ok(text.includes('Nom : Aïssatou Diallo'));
  assert.ok(text.includes('Service : Graphisme & Design'));
  assert.ok(text.includes('Page d’origine : /#contact'));
});
