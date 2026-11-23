import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { buildCleanRustEnv } from './setup-toolchain-bin.mjs';

const root = process.cwd();
const env = buildCleanRustEnv(root);

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root, env });
}

run('npx.cmd tauri build');

const installerOutDir = path.join(root, 'dist-releases', 'Installer');
fs.rmSync(installerOutDir, { recursive: true, force: true });
fs.mkdirSync(installerOutDir, { recursive: true });

const bundleRoots = [
  path.join(root, 'src-tauri', 'target', 'release', 'bundle'),
];

let copied = 0;
for (const bundleRoot of bundleRoots) {
  if (!fs.existsSync(bundleRoot)) continue;
  for (const sub of fs.readdirSync(bundleRoot)) {
    const subDir = path.join(bundleRoot, sub);
    if (!fs.statSync(subDir).isDirectory()) continue;
    for (const file of fs.readdirSync(subDir)) {
      if (file.endsWith('.exe') || file.endsWith('.msi')) {
        fs.copyFileSync(path.join(subDir, file), path.join(installerOutDir, file));
        copied++;
      }
    }
  }
}

if (copied === 0) {
  throw new Error('Không tìm thấy file Installer (.exe/.msi) sau khi chạy tauri build.');
}

console.log(`\n✓ Đóng gói Installer thành công (${copied} file) tại: ${installerOutDir}`);
