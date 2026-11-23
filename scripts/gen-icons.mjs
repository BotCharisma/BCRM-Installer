import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const iconsDir = path.resolve('src-tauri/icons');
fs.mkdirSync(iconsDir, { recursive: true });

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePng(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((1 + size * 4) * size);
  const r = Math.max(2, Math.floor(size * 0.22));
  const pad = Math.floor(size * 0.14);

  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 4;
      // Rounded square background (#09090b) with white geometric BCRM emblem (#fafafa)
      const inBox =
        x >= 0 && y >= 0 && x < size && y < size;
      let alpha = inBox ? 255 : 0;

      // Simple rounded corner mask
      const dx = Math.min(x, size - 1 - x);
      const dy = Math.min(y, size - 1 - y);
      if (dx < r && dy < r) {
        const dist = Math.hypot(r - dx, r - dy);
        if (dist > r) alpha = 0;
      }

      // Inner glyph: downward package arrow / minimal tray bar in #fafafa
      const cx = size / 2;
      const inStem = Math.abs(x - cx) <= size * 0.08 && y >= size * 0.24 && y <= size * 0.62;
      const arrowY = (y - size * 0.48) / (size * 0.2);
      const inHead =
        y >= size * 0.48 &&
        y <= size * 0.68 &&
        Math.abs(x - cx) <= (1 - arrowY) * (size * 0.24);
      const inTray =
        y >= size * 0.72 &&
        y <= size * 0.8 &&
        x >= pad + size * 0.12 &&
        x <= size - pad - size * 0.12;

      const isGlyph = inStem || inHead || inTray;
      raw[px] = isGlyph ? 250 : 12;
      raw[px + 1] = isGlyph ? 250 : 12;
      raw[px + 2] = isGlyph ? 252 : 16;
      raw[px + 3] = alpha;
    }
  }

  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeIco(png32, png256) {
  const entries = [
    { size: 32, data: png32 },
    { size: 0, data: png256 }, // 0 encodes 256px in ICO header
  ];
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(entries.length * 16);
  let offset = 6 + dir.length;

  entries.forEach((entry, i) => {
    const base = i * 16;
    dir[base] = entry.size;
    dir[base + 1] = entry.size;
    dir[base + 2] = 0;
    dir[base + 3] = 0;
    dir.writeUInt16LE(1, base + 4);
    dir.writeUInt16LE(32, base + 6);
    dir.writeUInt32LE(entry.data.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += entry.data.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

const p32 = makePng(32);
const p128 = makePng(128);
const p256 = makePng(256);

fs.writeFileSync(path.join(iconsDir, '32x32.png'), p32);
fs.writeFileSync(path.join(iconsDir, '128x128.png'), p128);
fs.writeFileSync(path.join(iconsDir, '128x128@2x.png'), p256);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), makeIco(p32, p256));

console.log('Generated default placeholder icons in src-tauri/icons/');
