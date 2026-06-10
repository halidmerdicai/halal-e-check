const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const outDir = path.join(__dirname, "..", "public");

const files = [
  { name: "icon-192.png", size: 192, radius: 36, maskable: false },
  { name: "icon-512.png", size: 512, radius: 96, maskable: false },
  { name: "icon-maskable-512.png", size: 512, radius: 0, maskable: true },
  { name: "apple-touch-icon.png", size: 180, radius: 36, maskable: false }
];

const colors = {
  green: [22, 128, 60, 255],
  white: [255, 255, 255, 255],
  transparent: [0, 0, 0, 0]
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function setPixel(buffer, width, x, y, color) {
  const index = y * (width * 4 + 1) + 1 + x * 4;
  buffer[index] = color[0];
  buffer[index + 1] = color[1];
  buffer[index + 2] = color[2];
  buffer[index + 3] = color[3];
}

function inRoundedRect(x, y, size, radius) {
  if (!radius) return true;
  const left = radius;
  const right = size - radius - 1;
  const top = radius;
  const bottom = size - radius - 1;

  if ((x >= left && x <= right) || (y >= top && y <= bottom)) return true;

  const cx = x < left ? left : right;
  const cy = y < top ? top : bottom;
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const x = ax + t * dx;
  const y = ay + t * dy;
  return Math.hypot(px - x, py - y);
}

function drawIcon({ size, radius, maskable }) {
  const rowBytes = size * 4 + 1;
  const raw = Buffer.alloc(rowBytes * size);

  for (let y = 0; y < size; y += 1) {
    raw[y * rowBytes] = 0;
    for (let x = 0; x < size; x += 1) {
      const inside = inRoundedRect(x, y, size, radius);
      setPixel(raw, size, x, y, inside ? colors.green : colors.transparent);
    }
  }

  const center = size / 2;
  const circleRadius = size * (maskable ? 0.33 : 0.3);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x - center, y - center);
      if (distance <= circleRadius) {
        const index = y * rowBytes + 1 + x * 4;
        raw[index] = Math.round(raw[index] * 0.86 + 255 * 0.14);
        raw[index + 1] = Math.round(raw[index + 1] * 0.86 + 255 * 0.14);
        raw[index + 2] = Math.round(raw[index + 2] * 0.86 + 255 * 0.14);
      }
    }
  }

  const stroke = size * 0.1;
  const points = [
    [size * 0.3, size * 0.52],
    [size * 0.44, size * 0.66],
    [size * 0.72, size * 0.34]
  ];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const d1 = distanceToSegment(x, y, points[0][0], points[0][1], points[1][0], points[1][1]);
      const d2 = distanceToSegment(x, y, points[1][0], points[1][1], points[2][0], points[2][1]);
      if (Math.min(d1, d2) <= stroke / 2) setPixel(raw, size, x, y, colors.white);
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

for (const file of files) {
  fs.writeFileSync(path.join(outDir, file.name), drawIcon(file));
}

console.log(`Generated ${files.length} PWA icon files.`);
