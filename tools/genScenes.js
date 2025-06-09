// genScenes.js
// Usage:  node genScenes.js
// Creates public/data/scene-S.json (500) | scene-M.json (5 000) | scene-L.json (30 000)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, 'public', 'data');
const SIZES = [
  { name: 'S', count: 500 },
  { name: 'M', count: 5_000 },
  { name: 'L', count: 30_000 },
];

// grid parameters
const RECT_W = 10;
const RECT_H = 10;
const PADDING = 2;          // gap between rects
const COLS = 300;           // arbitrary; wide enough for 30 000 / 300 = 100 rows

function randomColor() {
  return Number(`0x${crypto.randomBytes(3).toString('hex')}`); // 0xRRGGBB as number
}

function buildScene(n) {
  const scene = [];
  for (let i = 0; i < n; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    scene.push({
      id: `rect-${i}`,
      type: 'rect',
      x: col * (RECT_W + PADDING),
      y: row * (RECT_H + PADDING),
      w: RECT_W,
      h: RECT_H,
      fill: randomColor(),
    });
  }
  return scene;
}

// ensure output dir exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const { name, count } of SIZES) {
  const scene = buildScene(count);
  const outPath = path.join(OUTPUT_DIR, `scene-${name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(scene));
  console.log(`✔  wrote ${outPath} (${count} shapes)`);
}
