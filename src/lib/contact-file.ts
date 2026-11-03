// Shared metadata checks. File bytes are verified separately on the server.
export const MAX_DESCRIPTION_FILE_BYTES = 2 * 1024 * 1024;
export const DESCRIPTION_FILE_ACCEPT = '.pdf,.txt,application/pdf,text/plain';
export const DESCRIPTION_FILE_HINT =
  'Facultatif : un fichier PDF ou TXT (UTF-8), 2 Mo maximum. Aucun autre format accepté.';

export function descriptionFileError(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (!file.size) return 'Le fichier sélectionné est vide.';
  if (file.size > MAX_DESCRIPTION_FILE_BYTES) return 'Le fichier dépasse la limite de 2 Mo.';
  if (file.name.length > 160 || /[\u0000-\u001f\u007f/\\]/.test(file.name))
    return 'Le nom du fichier n’est pas accepté. Renommez-le simplement.';
  // A single extension prevents misleading names such as projet.exe.pdf.
  const extension = file.name.match(/^[^.]+\.(pdf|txt)$/i)?.[1]?.toLowerCase();
  if (!extension) return 'Joignez uniquement un fichier PDF ou TXT, avec une seule extension.';
  const expected = extension === 'pdf' ? 'application/pdf' : 'text/plain';
  if (file.type && file.type !== expected && file.type !== 'application/octet-stream')
    return 'Le type du fichier ne correspond pas à son extension.';
  return null;
}
