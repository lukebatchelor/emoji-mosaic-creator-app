import { CalcRequest } from './types';
import { getImageEmojiPalette } from './mosaic-browser';

onmessage = function (e: MessageEvent<CalcRequest>) {
  const { imgBitmap, palette, gridSize } = e.data;
  const emojiPalette = getImageEmojiPalette(imgBitmap, palette, gridSize);
  this.self.postMessage(emojiPalette);
};
