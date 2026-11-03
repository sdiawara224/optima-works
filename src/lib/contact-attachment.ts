// Server-side only: bounded bytes, no disk/cloud storage, no user-provided path or URL.
import { descriptionFileError } from './contact-file';

export type ContactAttachment = {
  filename: string;
  content: Buffer;
  contentType: 'application/pdf' | 'text/plain';
  contentDisposition: 'attachment';
};

export class InvalidDescriptionFile extends Error {}

export async function readDescriptionAttachment(file: File): Promise<ContactAttachment> {
  const error = descriptionFileError(file);
  if (error) throw new InvalidDescriptionFile(error);
  const content = Buffer.from(await file.arrayBuffer());
  const pdf = file.name.toLowerCase().endsWith('.pdf');
  if (pdf) {
    if (
      !/^%PDF-1\.[0-9]|^%PDF-2\.0/.test(content.subarray(0, 8).toString('ascii')) ||
      !content.subarray(-1024).includes(Buffer.from('%%EOF'))
    ) {
      throw new InvalidDescriptionFile('Le contenu ne correspond pas à un document PDF.');
    }
  } else {
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(content);
      if (!text.trim() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))
        throw new Error();
    } catch {
      throw new InvalidDescriptionFile(
        'Le fichier TXT doit contenir du texte UTF-8 lisible, sans contenu binaire.',
      );
    }
  }
  // Keep only a safe basename in MIME headers. Never use this as a filesystem path.
  const basename =
    file.name
      .slice(0, file.name.lastIndexOf('.'))
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9 _-]/g, '')
      .trim()
      .slice(0, 90) || 'description';
  return {
    filename: `${basename}.${pdf ? 'pdf' : 'txt'}`,
    content,
    contentType: pdf ? 'application/pdf' : 'text/plain',
    contentDisposition: 'attachment',
  };
}
