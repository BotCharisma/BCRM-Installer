import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { buildCleanRustEnv } from './setup-toolchain-bin.mjs';

const root = process.cwd();
const env = buildCleanRustEnv(root);
const cargoExe = fs.existsSync(path.join(process.env.USERPROFILE || '', '.cargo', 'bin', 'cargo.exe'))
  ? path.join(process.env.USERPROFILE || '', '.cargo', 'bin', 'cargo.exe')
  : 'cargo';

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd, env });
}

// 1. Build production frontend + Rust release binary WITH Tauri's custom-protocol feature
// so dist/ is embedded offline inside bcrm-winget.exe (no localhost:1420 needed)
run('npx.cmd tauri build --no-bundle');

// 3. Locate compiled exe
const candidates = [
  path.join(root, 'src-tauri', 'target', 'release', 'bcrm-winget.exe'),
  path.join(root, 'src-tauri', 'target', 'x86_64-pc-windows-gnu', 'release', 'bcrm-winget.exe'),
];
const releaseExe = candidates.find((p) => fs.existsSync(p));
if (!releaseExe) {
  throw new Error(`Không tìm thấy file thực thi release tại: ${candidates.join(' hoặc ')}`);
}

const releaseDir = path.join(root, 'dist-releases');
const portableDir = path.join(releaseDir, 'BCRM-Winget-Portable');
const portableDataDir = path.join(portableDir, 'data');

fs.rmSync(portableDir, { recursive: true, force: true });
fs.mkdirSync(portableDataDir, { recursive: true });

fs.copyFileSync(releaseExe, path.join(portableDir, 'bcrm-winget.exe'));
fs.writeFileSync(
  path.join(portableDir, 'portable.mode'),
  '# Presence of this file enables Portable Mode (stores settings in ./data/)\nportable=true\n',
  'utf8',
);
fs.writeFileSync(
  path.join(portableDir, 'README-PORTABLE.txt'),
  [
    'BCRM Winget — Portable Edition',
    '================================',
    '- Chạy trực tiếp bcrm-winget.exe không cần cài đặt.',
    '- Khi có file portable.mode hoặc thư mục data/ cạnh file .exe, toàn bộ cấu hình Winget được lưu tại ./data/settings.json.',
    '- Xóa file portable.mode để chuyển sang lưu cấu hình theo người dùng Windows (%LOCALAPPDATA%\\BCRMWinget).',
  ].join('\r\n'),
  'utf8',
);

const zipPath = path.join(releaseDir, 'BCRM-Winget-Portable-x64.zip');
fs.rmSync(zipPath, { force: true });

run(
  `powershell -NoProfile -Command "$ProgressPreference = 'SilentlyContinue'; Compress-Archive -Path '${portableDir}\\*' -DestinationPath '${zipPath}' -Force"`,
);

if (!fs.existsSync(zipPath)) {
  throw new Error(`Không tạo được file nén Portable tại: ${zipPath}`);
}

console.log(`\n✓ Đóng gói Portable thành công:\n  - Folder: ${portableDir}\n  - Zip: ${zipPath}`);
