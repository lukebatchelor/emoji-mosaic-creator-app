import { CalcRequest, CalcResponse } from './types';
import { getImageEmojiPalette } from './mosaic-browser';

declare let self: ServiceWorkerGlobalScope;

onmessage = function (e: MessageEvent<CalcRequest>) {
  const { imgBitmap, palette, gridSize } = e.data;
  let lastProgress = 0;
  const onProgress = (progress: number) => {
    if (progress < lastProgress + 0.001) return;
    lastProgress = progress;
    const message: CalcResponse = { event: 'calc-progress', progress };
    this.self.postMessage(message);
  };
  const emojiPalette = getImageEmojiPalette(
    imgBitmap,
    palette,
    gridSize,
    onProgress
  );
  const message: CalcResponse = { event: 'calc-complete', emojiPalette };
  this.self.postMessage(message);
};
