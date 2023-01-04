import path from 'path';
import fs from 'fs';
import { Image, createCanvas } from 'canvas';

const gridSize = 32;

const images = fs
  .readdirSync('./public/emojis')
  .filter((f) => f.endsWith('.png'));
console.log(`Found ${images.length} images`);

const rows = largestPrimeFactor(images.length);
const cols = images.length / rows;
console.log(`Factors are ${rows} and ${cols}`);

const height = rows * gridSize;
const width = cols * gridSize;
console.log(`Canvas dimensions are ${width}x${height}`);

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

console.log('Paiting emojis');
(async () => {
  await drawImages();
  await new Promise((resolve) => {
    console.log('Paiting complete. Writing to disk');
    const out = fs.createWriteStream('./public/emoji-sheet.png');
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    stream.on('finish', () => {
      console.log('Writing complete');
      resolve();
    });
  });
})();

async function drawImages() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          drawn++;
          ctx.drawImage(img, col * gridSize, row * gridSize);
          resolve();
        };
        img.onerror = (e) => {
          console.log({ row, col, idx, img: images[idx] });
          console.log('error', e);
        };
        img.src = `./public/emojis/${images[idx]}`;
      });
    }
  }
}

function largestPrimeFactor(num) {
  if (num % 2 == 0) return num / 2;
  const stop = Math.sqrt(num);
  for (let i = 3; i <= stop; i += 2) {
    if (num % i == 0) {
      return num / i;
    }
  }
  return num; // no int or < 2
}
