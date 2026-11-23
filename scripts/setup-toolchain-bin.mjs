import fs from 'node:fs';
import path from 'node:path';

export function buildCleanRustEnv() {
  const cargoBin = path.join(process.env.USERPROFILE || '', '.cargo', 'bin');
  const currentPathParts = (process.env.PATH || '').split(path.delimiter).filter((p) => p.trim() !== '');
  const extra = fs.existsSync(cargoBin) ? [cargoBin] : [];

  return {
    ...process.env,
    PATH: [...extra, ...currentPathParts].join(path.delimiter),
  };
}
