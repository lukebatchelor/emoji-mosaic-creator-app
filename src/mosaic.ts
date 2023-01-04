import { FastAverageColor } from 'fast-average-color';
import colorDiff from 'color-diff';

type Color = { R: number; G: number; B: number; A: number };
type PalleteColor = Color & { emoji: string; x: number; y: number };
type Palette = Array<PalleteColor>;
type EmojiData = {
  rows: number;
  cols: number;
  palette: Palette;
};

const fac = new FastAverageColor();
let emojiData: EmojiData;
let spritesheet: HTMLImageElement;

type MosaicOptions = {
  gridSize: number;
  background: boolean;
  rotation: boolean;
};

export async function mosaic(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  opts: MosaicOptions
) {
  const gridSize = opts.gridSize || 32;
  emojiData = emojiData ?? (await getEmojiData());
  spritesheet = spritesheet ?? (await getSpritesheet());
  const averages = getAveragesGrid(img, gridSize);

  clearCanvas(canvas);
  if (opts.background) {
    drawAveragesToCanvas(averages, canvas, gridSize);
  }
  drawEmojis({
    averages,
    emojiData,
    spritesheet,
    canvas,
    gridSize,
    rotation: opts.rotation,
  });
}

function getSizeOfImage(
  img: HTMLImageElement | HTMLCanvasElement,
  gridSize: number = 32
) {
  const { height, width } = img;
  const rows = Math.ceil(height / gridSize);
  const cols = Math.ceil(width / gridSize);
  return { height, width, rows, cols };
}

/* 
  Returns a 2d array of colors where each element is the 
  average color for that particular cell 
*/
function getAveragesGrid(
  img: HTMLImageElement,
  gridSize: number = 32
): Color[][] {
  const { rows, cols } = getSizeOfImage(img, gridSize);
  const averages: Color[][] = [];

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
      averages[row][col] = { R, G, B, A: a / 255 };
    }
  }

  return averages;
}

function drawAveragesToCanvas(
  averages: Color[][],
  canvas: HTMLCanvasElement,
  gridSize: number = 32
) {
  const ctx = canvas.getContext('2d')!;
  const { rows, cols } = getSizeOfImage(canvas, gridSize);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const { R, G, B, A } = averages[row][col];
      ctx.fillStyle = `rgba(${R},${G},${B},${A})`;
      ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
    }
  }
}

async function getEmojiData() {
  return fetch('/emoji-data.json')
    .then((res) => res.json())
    .then((data: EmojiData) => data);
}

async function getSpritesheet(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = '/emoji-sheet.png';
  });
}

function drawEmojis(opts: {
  averages: Color[][];
  emojiData: EmojiData;
  canvas: HTMLCanvasElement;
  spritesheet: HTMLImageElement;
  gridSize: number;
  rotation: boolean;
}) {
  const { averages, emojiData, spritesheet, canvas, gridSize, rotation } = opts;
  const { palette } = emojiData;
  const { rows: imgRows, cols: imgCols } = getSizeOfImage(canvas, gridSize);
  const ctx = canvas.getContext('2d')!;

  for (let row = 0; row < imgRows; row++) {
    for (let col = 0; col < imgCols; col++) {
      const closest = colorDiff.closest(
        averages[row][col],
        palette
      ) as PalleteColor;
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

function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
