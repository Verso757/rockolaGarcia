import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePNG(width, height, isMaskable = false) {
  const rowBytes = 1 + width * 4; // 1 filter byte + RGBA
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = (width / 2) * (isMaskable ? 0.72 : 0.88);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: deep luxury jukebox dark wood/carbon
      let r = 18;
      let g = 10;
      let b = 6;
      let a = 255;

      if (dist <= outerR) {
        // Outer gold ring
        if (dist >= outerR - Math.max(3, width * 0.035)) {
          r = 212;
          g = 175;
          b = 55;
        } else if (dist <= outerR * 0.75) {
          // Vinyl disc
          if (dist >= outerR * 0.3) {
            // Vinyl grooves
            const ring = Math.floor(dist) % 4;
            const shade = ring === 0 ? 35 : 15;
            r = shade;
            g = shade;
            b = shade;
          } else {
            // Gold center label
            r = 212;
            g = 175;
            b = 55;
            if (dist <= outerR * 0.08) {
              // Center hole
              r = 10;
              g = 5;
              b = 3;
            }
          }
        } else {
          // Arch gradient glow (magenta/amber)
          const angle = Math.atan2(dy, dx);
          r = Math.floor(180 + 70 * Math.sin(angle));
          g = Math.floor(80 + 50 * Math.cos(angle));
          b = Math.floor(50 + 40 * Math.sin(angle * 2));
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePNG(48, 48, false));

console.log('PWA icons successfully generated in /public!');
