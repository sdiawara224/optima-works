import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { inspectFile } from '../scripts/check-secrets.mjs';

test('autorise les secrets vides et les coordonnées publiques', () => {
  assert.deepEqual(
    inspectFile(
      '.env.example',
      'GMAIL_APP_PASSWORD=\nRESEND_API_KEY=""\nCONTACT_TO=optimaworksgn@gmail.com\n',
    ),
    [],
  );
});
test('refuse un mot de passe dans les exemples sans jamais le réafficher', () => {
  const secret = ['faux', 'secret', 'a', 'bloquer'].join('-');
  const findings = inspectFile('.env.example', `GMAIL_APP_PASSWORD=${secret}`);
  assert.equal(findings.length, 1);
  assert.ok(!JSON.stringify(findings).includes(secret));
});
test('refuse aussi les valeurs entre guillemets et les exemples CMS', () => {
  for (const value of ['"test-only"', "'test-only'", 'votre_cle']) {
    assert.equal(inspectFile('cms/.env.example', `API_TOKEN=${value}`).length, 1);
  }
});
test('refuse les fichiers dotenv privés versionnés', () => {
  for (const path of ['.env', '.env.local', 'cms/.env.production']) {
    assert.equal(inspectFile(path, '').length, 1);
  }
});
test('autorise les commentaires sans secret', () => {
  assert.deepEqual(
    inspectFile(
      '.env.example',
      '# GMAIL_APP_PASSWORD: configurer en privé\nGMAIL_APP_PASSWORD= # uniquement local\n',
    ),
    [],
  );
});
test('détecte une signature de jeton GitHub sans révéler la valeur', () => {
  const token = ['ghp', 'x'.repeat(40)].join('_');
  const findings = inspectFile('configuration.ts', `const value = '${token}';`);
  assert.equal(findings.length, 1);
  assert.ok(!JSON.stringify(findings).includes(token));
});

test('le build depuis un ZIP sans .git vérifie aussi les exemples sans divulgation', () => {
  const directory = mkdtempSync(join(tmpdir(), 'optimaworks-security-'));
  const script = fileURLToPath(new URL('../scripts/check-secrets.mjs', import.meta.url));
  try {
    writeFileSync(join(directory, '.env.example'), 'GMAIL_APP_PASSWORD=\n');
    const clean = spawnSync(process.execPath, [script], { cwd: directory, encoding: 'utf8' });
    assert.equal(clean.status, 0);
    const secret = ['faux', 'mot', 'de', 'passe'].join('-');
    writeFileSync(join(directory, '.env.example'), `GMAIL_APP_PASSWORD=${secret}`);
    const rejected = spawnSync(process.execPath, [script], { cwd: directory, encoding: 'utf8' });
    assert.equal(rejected.status, 1);
    assert.ok(!`${rejected.stdout}${rejected.stderr}`.includes(secret));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('refuse aussi les secrets SMTP et Turnstile dans les exemples', () => {
  for (const key of ['SMTP_PASSWORD', 'TURNSTILE_SECRET_KEY']) {
    const findings = inspectFile('.env.example', `${key}=test-only-value`);
    assert.equal(findings.length, 1);
    assert.ok(!JSON.stringify(findings).includes('test-only-value'));
  }
});
