import {
  getEmojiSpritesAndData,
  clearCanvas,
  drawAveragesToCanvas,
  drawEmojis,
  getImageEmojiPalette,
} from './mosaic-browser';
import {
  type MosaicOptions,
  type EmojiPalette,
  type Palette,
  type CalcResponse,
} from './types';

// store the emojiPalette in the top of the module so that we only have to calculate it once
let emojiPalette: EmojiPalette | null = null;
// emojiPaletteResolvedCb is a callback that is called once the service worker has
// completed it's the emojiPalette calculation
let emojiPaletteResolvedCb: ((p: EmojiPalette) => void) | null = null;
// calcProgressCb is a call back that we'll call whenever the worker reports back progress
// it is not used at all if the emojiPalette calc is done in the browser
let calcProgressCb: ((progress: number) => void) | null = null;

const worker = new Worker(new URL('./mosaic-worker', import.meta.url), {
  type: 'module',
});
worker.onmessage = (e: MessageEvent<CalcResponse>) => {
  switch (e.data.event) {
    case 'calc-complete':
      emojiPaletteResolvedCb && emojiPaletteResolvedCb(e.data.emojiPalette);
      break;
    case 'calc-progress':
      calcProgressCb && calcProgressCb(e.data.progress);
      break;
    default:
      throw Error('Unknown message event received');
  }
};

export async function mosaic(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  opts: MosaicOptions
) {
  const gridSize = opts.gridSize || 32;

  performance.mark('start-load-data');
  const { emojiData, spritesheet } = await getEmojiSpritesAndData();
  performance.mark('end-load-data');

  performance.mark('start-calc-averages');
  if (!emojiPalette) {
    // if we support offscreen canvas we use webworkers instead
    if (typeof OffscreenCanvas !== 'undefined') {
      if (opts.onProgress) calcProgressCb = opts.onProgress;
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

  performance.mark('start-drawing');
  clearCanvas(canvas);
  if (opts.background) {
    drawAveragesToCanvas(emojiPalette, canvas, gridSize);
  }
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
    emojiPaletteResolvedCb = (value: EmojiPalette) => {
      resolve(value);
    };
  });
}

export function clearPaletteCache() {
  emojiPalette = null;
}
