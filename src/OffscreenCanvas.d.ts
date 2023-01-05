/* eslint-disable no-var */
/*
  This file modifies some lib.dom interfaces so that typescript knows about
  OffscreenCanvas.
  Type definitions by zeen3 https://stackoverflow.com/a/53603401
*/

interface OffscreenCanvasRenderingContext2D
  extends CanvasState,
    CanvasTransform,
    CanvasCompositing,
    CanvasImageSmoothing,
    CanvasFillStrokeStyles,
    CanvasShadowStyles,
    CanvasFilters,
    CanvasRect,
    CanvasDrawPath,
    CanvasUserInterface,
    CanvasText,
    CanvasDrawImage,
    CanvasImageData,
    CanvasPathDrawingStyles,
    CanvasTextDrawingStyles,
    CanvasPath {
  readonly canvas: OffscreenCanvas;
}
declare var OffscreenCanvasRenderingContext2D: {
  prototype: OffscreenCanvasRenderingContext2D;
  new (): OffscreenCanvasRenderingContext2D;
};
interface OffscreenCanvas extends EventTarget {
  width: number;
  height: number;
  getContext(
    contextId: '2d',
    contextAttributes?: CanvasRenderingContext2DSettings
  ): OffscreenCanvasRenderingContext2D | null;
}
declare var OffscreenCanvas: {
  prototype: OffscreenCanvas;
  new (width: number, height: number): OffscreenCanvas;
};
