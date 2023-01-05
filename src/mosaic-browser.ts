import { FastAverageColor } from 'fast-average-color';
import colorDiff from 'color-diff';

import {
  type EmojiPalette,
  type EmojiData,
  Color,
  Palette,
  PalleteColor,
} from './types';

const fac = new FastAverageColor();
const colorDiffCache = new Map();

/* 
  For each grid cell in the image, calculate it's average color and find
  the emoji with the closest average color to that cell
*/
export function getImageEmojiPalette(
  img: HTMLImageElement | ImageBitmap,
  palette: Palette,
  gridSize: number = 32
): EmojiPalette {
  const { rows, cols } = getSizeOfImage(img, gridSize);
  const averages: EmojiPalette = [];

  for (let row = 0; row < rows; row++) {
    averages[row] = [];
    for (let col = 0; col < cols; col++) {
      const ave = fac.getColor(img, {
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

export function memoizedColorDiff(color: Color, palette: Palette) {
  const key = JSON.stringify(color);
  if (colorDiffCache.has(key)) {
    return colorDiffCache.get(key);
  }
  const closest = colorDiff.closest(color, palette) as PalleteColor;
  colorDiffCache.set(key, closest);
  return closest;
}

export function getSizeOfImage(
  img: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  gridSize: number = 32
) {
  const { height, width } = img;
  const rows = Math.ceil(height / gridSize);
  const cols = Math.ceil(width / gridSize);
  return { height, width, rows, cols };
}

export function drawAveragesToCanvas(
  emojiPalette: EmojiPalette,
  canvas: HTMLCanvasElement,
  gridSize: number = 32
) {
  const ctx = canvas.getContext('2d')!;
  const { rows, cols } = getSizeOfImage(canvas, gridSize);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const { R, G, B, A } = emojiPalette[row][col].average;
      ctx.fillStyle = `rgba(${R},${G},${B},${A})`;
      ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
    }
  }
}

export async function getEmojiData() {
  return fetch('/emoji-data.json')
    .then((res) => res.json())
    .then((data: EmojiData) => data);
}

export async function getSpritesheet(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = '/emoji-sheet.png';
  });
}

export function drawEmojis(opts: {
  emojiPalette: EmojiPalette;
  canvas: HTMLCanvasElement;
  spritesheet: HTMLImageElement;
  gridSize: number;
  rotation: boolean;
}) {
  const { emojiPalette, spritesheet, canvas, gridSize, rotation } = opts;
  const { rows, cols } = getSizeOfImage(canvas, gridSize);
  const ctx = canvas.getContext('2d')!;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const closest = emojiPalette[row][col].closest;
      const paletteX = closest.x * gridSize;
      const paletteY = closest.y * gridSize;

      if (rotation) {
        const offset = (gridSize / 2) * -1;
        const randAngle = -180 + Math.random() * 360;
        ctx.save();
        ctx.translate(col * 32, row * 32);
        ctx.rotate((randAngle * Math.PI) / 180);
        ctx.drawImage(
          spritesheet,
          paletteX,
          paletteY,
          gridSize,
          gridSize,
          offset,
          offset,
          gridSize,
          gridSize
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          spritesheet,
          paletteX,
          paletteY,
          gridSize,
          gridSize,
          col * 32,
          row * 32,
          gridSize,
          gridSize
        );
      }
    }
  }
}

export function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
