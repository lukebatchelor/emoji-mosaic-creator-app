import fs from 'fs';
import { getAverageColor } from 'fast-average-color-node';
import { Image, createCanvas } from 'canvas';

const GRID_SIZE = 32;
const emojisDir = './emojis';
const jsonOutputFile = './public/emoji-data.json';
const spriteSheetOutputFile = './public/emoji-sheet.png';

const averageColors = [];

// we'll get a warning printed because we're using 'sharp' and 'canvas' in the same
// script ('fast-average-color-node' uses sharp under the hood). We can safely ignore this
// warning
console.log('\n');
console.log('=== We can safely ignore the warning above ===');
console.log(
  "It happens because we're importing sharp and canvas in the same script"
);
console.log(
  'See https://github.com/Automattic/node-canvas/issues/1386 for more info'
);
console.log('\n');

// get list of all emoji files
const emojis = fs
  .readdirSync(new URL(emojisDir, import.meta.url))
  .filter((f) => f.endsWith('.png'));
console.log(`Found ${emojis.length} images`);

// calculate dimensions of spritesheet
const rows = largestPrimeFactor(emojis.length);
const cols = emojis.length / rows;
const height = rows * GRID_SIZE;
const width = cols * GRID_SIZE;
console.log(`Spritesheet: ${rows} x ${cols} emojis`);
console.log(`Dimensions: ${width}x${height} px`);

// create canvas
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// for each emoji we'll calculate its average color and add it to the spritesheet
(async () => {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const emoji = emojis[idx];
      // get the average color of the emoji
      const averageColor = await getAverageColor(`${emojisDir}/` + emoji);
      const [R, G, B, a] = averageColor.value;
      averageColors[idx] = { R, G, B, A: a / 255, emoji, y: row, x: col };
      // now draw the emoji to the spritesheet
      await drawEmojiToSpritesheet(emoji, ctx, col, row);
    }
  }

  // write out the emojiData to json file
  console.log(`Writing emoji data to ${jsonOutputFile}`);
  const emojiData = {
    rows,
    cols,
    palette: averageColors,
  };
  fs.writeFileSync(jsonOutputFile, JSON.stringify(emojiData));

  console.log(`Writing spritesheet file to ${spriteSheetOutputFile}`);
  await writeSpritesheetToFile();
})();

async function writeSpritesheetToFile() {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(spriteSheetOutputFile);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function drawEmojiToSpritesheet(emojiName, ctx, col, row) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, col * GRID_SIZE, row * GRID_SIZE);
      resolve();
    };
    img.onerror = reject;
    img.src = `${emojisDir}/${emojiName}`;
  });
}

function largestPrimeFactor(num) {
  if (num % 2 == 0) return num / 2;
  const stop = Math.sqrt(num);
  for (let i = 3; i <= stop; i += 2) {
    if (num % i == 0) {
      return num / i;
    }
  }
  return num;
}
