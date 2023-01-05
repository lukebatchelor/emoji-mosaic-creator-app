import {
  getEmojiData,
  getSpritesheet,
  clearCanvas,
  drawAveragesToCanvas,
  drawEmojis,
  getImageEmojiPalette,
} from './mosaic-browser';
import {
  type MosaicOptions,
  type EmojiData,
  type EmojiPalette,
  type Palette,
} from './types';

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
  if (!emojiPalette) {
    // if we support offscreen canvas we use webworkers instead
    if (typeof OffscreenCanvas !== 'undefined') {
      emojiPalette = await getEmojiPaletteFromWorker(
        img,
        emojiData.palette,
        gridSize
      );
    } else {
      emojiPalette = getImageEmojiPalette(img, emojiData.palette, gridSize);
    }
  }
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
