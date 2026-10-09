import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPNG(width, height, isMaskable = false) {
  // RGBA buffer with filter byte at start of each scanline
  const stride = width * 4 + 1;
  const rawData = Buffer.alloc(stride * height);

  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.42;
  const rInner = width * 0.35;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: Deep dark slate (#090d16)
      let r = 9;
      let g = 13;
      let b = 22;
      let a = 255;

      // Outer ring
      if (dist >= rInner && dist <= rOuter) {
        // Indigo ring (#6366f1)
        r = 99;
        g = 102;
        b = 241;
      } else if (dist < rInner) {
        // Inner circle dark slate (#0f172a)
        r = 15;
        g = 23;
        b = 42;

        // Schedule blocks inside
        // Block 1 (Top left)
        if (x >= cx - width * 0.22 && x <= cx - width * 0.04 && y >= cy - height * 0.18 && y <= cy - height * 0.08) {
          r = 99; g = 102; b = 241; // Indigo
        }
        // Block 2 (Top right)
        else if (x >= cx + width * 0.02 && x <= cx + width * 0.22 && y >= cy - height * 0.18 && y <= cy - height * 0.08) {
          r = 56; g = 189; b = 248; // Sky
        }
        // Block 3 (Middle left)
        else if (x >= cx - width * 0.22 && x <= cx + width * 0.04 && y >= cy - height * 0.04 && y <= cy + height * 0.06) {
          r = 16; g = 185; b = 129; // Emerald
        }
        // Block 4 (Middle right)
        else if (x >= cx + width * 0.10 && x <= cx + width * 0.22 && y >= cy - height * 0.04 && y <= cy + height * 0.06) {
          r = 245; g = 158; b = 11; // Amber
        }
        // Block 5 (Bottom)
        else if (x >= cx - width * 0.22 && x <= cx + width * 0.18 && y >= cy + height * 0.10 && y <= cy + height * 0.20) {
          r = 139; g = 92; b = 246; // Purple
        }
      }

      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
      rawData[px + 3] = a;
    }
  }

  // Deflate IDAT data
  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);

  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);

  const crcData = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcData);
  chunk.writeUInt32BE(crcVal, 8 + len);

  return chunk;
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64));

console.log('PWA and Apple icons generated successfully in public/');
