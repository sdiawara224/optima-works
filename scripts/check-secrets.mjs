import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Focused regression guard, not a substitute for revoking exposed credentials
// or a complete history-aware secret scanner. Never print matched values.
const sensitiveName = /(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|PRIVATE_KEY|CLIENT_SECRET)$/i;
const knownCredentials = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{50,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];

/** @param {string} path @param {string} text */
export function inspectFile(path, text) {
  /** @type {{path: string, line: number, reason: string}[]} */
  const findings = [];
  const basename = path.split('/').at(-1) ?? '';
  if (/^\.env(?:\.|$)/.test(basename) && basename !== '.env.example') {
    findings.push({ path, line: 1, reason: 'Fichier d’environnement privé versionné.' });
  }
  text.split(/\r?\n/).forEach((line, index) => {
    if (basename === '.env.example' && !line.trimStart().startsWith('#')) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (match && sensitiveName.test(match[1])) {
        // Empty assignments, empty quotes and comments are safe. Examples must
        // leave secret values empty, even when a fake placeholder would work.
        const value = match[2].replace(/\s+#.*$/, '').trim();
        if (value && value !== '""' && value !== "''" && !value.startsWith('#')) {
          findings.push({
            path,
            line: index + 1,
            reason: `${match[1]} doit rester vide dans le fichier d’exemple.`,
          });
        }
      }
    }
    if (knownCredentials.some((pattern) => pattern.test(line))) {
      findings.push({
        path,
        line: index + 1,
        reason: 'Signature de secret détectée (valeur masquée).',
      });
    }
  });
  return findings;
}

export function checkRepository() {
  let files;
  try {
    files = [
      ...new Set(
        execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        })
          .split('\0')
          .filter(Boolean),
      ),
    ];
  } catch {
    // ZIP downloads and some build platforms omit .git. Still validate both
    // committed templates, without reading private runtime dotenv files.
    console.log('Git absent : contrôle limité aux fichiers d’exemple.');
    files = ['.env.example', 'cms/.env.example'].filter((path) => existsSync(path));
    if (!files.length) {
      console.error('Aucun fichier d’exemple disponible pour le contrôle.');
      return false;
    }
  }
  const findings = files.flatMap((path) => {
    const bytes = readFileSync(path);
    // Skip binary assets (fonts, PNG, WebP…).
    if (bytes.includes(0)) return [];
    return inspectFile(path, bytes.toString('utf8'));
  });
  if (findings.length) {
    for (const finding of findings)
      console.error(`${finding.path}:${finding.line} — ${finding.reason}`);
    console.error(
      'Contrôle refusé. Retirez le secret et révoquez-le auprès du fournisseur s’il a été publié.',
    );
    return false;
  }
  console.log(
    'Contrôle réussi sur les fichiers examinés : champs secrets des exemples vides, aucune anomalie reconnue.',
  );
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!checkRepository()) process.exitCode = 1;
}
