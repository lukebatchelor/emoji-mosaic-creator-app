import fs from 'fs';
import { getAverageColor } from 'fast-average-color-node';

const emojis = fs
  .readdirSync(new URL('./public/emojis', import.meta.url))
  .filter((f) => f.endsWith('.png'));
const averageColors = {};

console.log(`Calculating average color for ${emojis.length} emojis...`);
for (let emoji of emojis) {
  await getAverageColor('./public/emojis/' + emoji).then((d) => {
    averageColors[emoji] = d.value;
  });
}

console.log('Writing average colors to file...');
fs.writeFileSync(
  './public/average-colors-all.json',
  JSON.stringify(averageColors)
);

console.log('Removing duplicates');
const seen = new Set();

const deduped = {};

for (let [emoji, data] of Object.entries(averageColors)) {
  // console.log({ emoji, data });
  const key = data.join(',');
  if (!seen.has(key)) {
    deduped[emoji] = data;
    seen.add(key);
  }
}

console.log(`${Object.keys(deduped).length} emojis left after deduping`);
fs.writeFileSync(
  './public/average-colors-deduped.json',
  JSON.stringify(deduped)
);
