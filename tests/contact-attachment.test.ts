import { test } from 'node:test';
import assert from 'node:assert/strict';
import { descriptionFileError, MAX_DESCRIPTION_FILE_BYTES } from '../src/lib/contact-file';
import { readDescriptionAttachment } from '../src/lib/contact-attachment';

const pdf = '%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n';

test('accepte un TXT UTF-8 et produit uniquement une pièce jointe mémoire', async () => {
  const content = 'Description du projet : création d’une identité visuelle.';
  const attachment = await readDescriptionAttachment(
    new File([content], 'Résumé projet.txt', { type: 'text/plain' }),
  );
  assert.equal(attachment.filename, 'Resume projet.txt');
  assert.equal(attachment.content.toString(), content);
  assert.equal(attachment.contentType, 'text/plain');
  assert.equal(attachment.contentDisposition, 'attachment');
  assert.equal('path' in attachment, false);
  assert.equal('href' in attachment, false);
});

test('accepte une enveloppe PDF avec signature et marqueur final cohérents', async () => {
  const attachment = await readDescriptionAttachment(
    new File([pdf], 'Description.PDF', { type: 'application/pdf' }),
  );
  assert.equal(attachment.filename, 'Description.pdf');
  assert.equal(attachment.contentType, 'application/pdf');
  assert.equal(attachment.content.toString(), pdf);
});

test('refuse fichiers vides, trop lourds, formats non autorisés et noms trompeurs', async () => {
  for (const file of [
    new File([], 'vide.txt'),
    new File([new Uint8Array(MAX_DESCRIPTION_FILE_BYTES + 1)], 'lourd.txt'),
    new File(['script'], 'document.html', { type: 'text/html' }),
    new File(['zip'], 'document.docx'),
    new File([pdf], 'projet.exe.pdf', { type: 'application/pdf' }),
    new File(['text'], 'x\r\nBcc.txt'),
    new File(['text'], '../projet.txt'),
    new File(['text'], 'x'.repeat(161) + '.txt'),
  ])
    await assert.rejects(readDescriptionAttachment(file));
});

test('vérifie le contenu réel et pas seulement l’extension ou le MIME', async () => {
  for (const file of [
    new File(['not a pdf'], 'description.pdf', { type: 'application/pdf' }),
    new File(['%PDF-1.7\nmissing eof'], 'description.pdf'),
    new File(['MZ executable\n%%EOF'], 'description.pdf'),
    new File(['text'], 'description.txt', { type: 'application/pdf' }),
    new File([new Uint8Array([0xff, 0xfe])], 'description.txt'),
    new File(['text\u0000binary'], 'description.txt'),
    new File(['   \n\t'], 'description.txt'),
  ])
    await assert.rejects(readDescriptionAttachment(file));
});

test('la limite de 2 Mo est inclusive et les MIME génériques sont contrôlés par le contenu', async () => {
  const file = new File(['a'.repeat(MAX_DESCRIPTION_FILE_BYTES)], 'description.txt', {
    type: 'application/octet-stream',
  });
  assert.equal(descriptionFileError(file), null);
  assert.equal((await readDescriptionAttachment(file)).content.length, MAX_DESCRIPTION_FILE_BYTES);
});
