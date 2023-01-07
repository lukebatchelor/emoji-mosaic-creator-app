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

export type MosaicOptions = {
  gridSize: number;
  background: boolean;
  rotation: boolean;
  onProgress?: (progress: number) => void;
};

export type CalcRequest = {
  imgBitmap: ImageBitmap;
  palette: Palette;
  gridSize: number;
};

export type CalcResponse = CalcProgressResponse | CalcCompleteResponse;

type CalcCompleteResponse = {
  event: 'calc-complete';
  emojiPalette: EmojiPalette;
};

/* progress will be a number between 0 and 1 */
type CalcProgressResponse = {
  event: 'calc-progress';
  progress: number;
};
