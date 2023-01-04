import { FastAverageColor } from 'fast-average-color';
import colorDiff from 'color-diff';
import {
  type Palette,
  type EmojiPalette,
  type Color,
  type PalleteColor,
} from './mosaic';

type CalcRequest = {
  imgBitmap: ImageBitmap;
  palette: Palette;
  gridSize: number;
};

const fac = new FastAverageColor();
const colorDiffCache = new Map();
let cacheHits = 0;

onmessage = function (e: MessageEvent<CalcRequest>) {
  const { imgBitmap, palette, gridSize } = e.data;
  const emojiPalette = getImageEmojiPalette(imgBitmap, palette, gridSize);
  this.self.postMessage(emojiPalette);
};

/* 
  For each grid cell in the image, calculate it's average color and find
  the emoji with the closest average color to that cell
*/
function getImageEmojiPalette(
  imgBitmap: ImageBitmap,
  palette: Palette,
  gridSize: number = 32
): EmojiPalette {
  const { rows, cols } = getSizeOfImage(imgBitmap, gridSize);
  const averages: EmojiPalette = [];
  cacheHits = 0;

  for (let row = 0; row < rows; row++) {
    averages[row] = [];
    for (let col = 0; col < cols; col++) {
      const ave = fac.getColor(imgBitmap, {
        algorithm: 'dominant',
        ignoredColor: [0, 0, 0, 0], // ignore transparency
        top: row * gridSize,
        left: col * gridSize,
        width: gridSize,
        height: gridSize,
      });
      const [R, G, B, a] = ave.value;
      const average = { R, G, B, A: a / 255 };
      const closest = memoizedColorDiff(average, palette);
      averages[row][col] = { average, closest };
    }
  }

  return averages;
}

function memoizedColorDiff(color: Color, palette: Palette) {
  const key = JSON.stringify(color);
  if (colorDiffCache.has(key)) {
    cacheHits++;
    return colorDiffCache.get(key);
  }
  const closest = colorDiff.closest(color, palette) as PalleteColor;
  colorDiffCache.set(key, closest);
  return closest;
}

function getSizeOfImage(
  img: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  gridSize: number = 32
) {
  const { height, width } = img;
  const rows = Math.ceil(height / gridSize);
  const cols = Math.ceil(width / gridSize);
  return { height, width, rows, cols };
}
