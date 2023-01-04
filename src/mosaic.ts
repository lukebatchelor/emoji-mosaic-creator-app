export type Color = { R: number; G: number; B: number; A: number };
export type PalleteColor = Color & { emoji: string; x: number; y: number };
export type Palette = Array<PalleteColor>;
export type EmojiData = {
  rows: number;
  cols: number;
  palette: Palette;
};
// a 2d array representing each grid element from an image
// with it's average color and closest emoji
export type EmojiPalette = {
  average: Color;
  closest: PalleteColor;
}[][];

let emojiData: EmojiData;
let spritesheet: HTMLImageElement;
let emojiPalette: EmojiPalette;
let emojiPaletteResolver: ((p: EmojiPalette) => void) | null = null;

const worker = new Worker(new URL('./mosaic-worker', import.meta.url), {
  type: 'module',
});
worker.onmessage = (e: MessageEvent<EmojiPalette>) => {
  if (emojiPaletteResolver) {
    emojiPaletteResolver(e.data);
  } else {
    console.log('Unable to resolve worker message');
  }
};

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
  performance.mark('start-load-data');
  emojiData = emojiData ?? (await getEmojiData());
  spritesheet = spritesheet ?? (await getSpritesheet());
  performance.mark('end-load-data');

  performance.mark('start-calc-averages');
  emojiPalette =
    emojiPalette ??
    (await getEmojiPaletteFromWorker(img, emojiData.palette, gridSize));
  performance.mark('end-calc-averages');

  clearCanvas(canvas);
  if (opts.background) {
    drawAveragesToCanvas(emojiPalette, canvas, gridSize);
  }
  performance.mark('start-drawing');
  drawEmojis({
    emojiPalette,
    spritesheet,
    canvas,
    gridSize,
    rotation: opts.rotation,
  });
  performance.mark('end-drawing');

  const loadDataPerf = performance.measure(
    'load-data',
    'start-load-data',
    'end-load-data'
  );
  const calcAveragesPerf = performance.measure(
    'calc-averages',
    'start-calc-averages',
    'end-calc-averages'
  );
  const drawingPerf = performance.measure(
    'drawing',
    'start-drawing',
    'end-drawing'
  );
  console.log({
    loading: loadDataPerf.duration,
    calcAverages: calcAveragesPerf.duration,
    drawing: drawingPerf.duration,
  });
}

async function getEmojiPaletteFromWorker(
  img: HTMLImageElement,
  palette: Palette,
  gridSize: number
) {
  const imgBitmap = await createImageBitmap(img);
  return new Promise<EmojiPalette>((resolve) => {
    worker.postMessage({ imgBitmap, palette, gridSize }, [imgBitmap]);
    emojiPaletteResolver = (value: EmojiPalette) => {
      resolve(value);
    };
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

function drawAveragesToCanvas(
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

function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
