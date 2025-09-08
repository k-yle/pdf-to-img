import type Canvas from "canvas";

type Factory = {
  canvas: Canvas.Canvas | null;
  context: Canvas.CanvasRenderingContext2D | null;
};

type NonNullableFactory = {
  [K in keyof Factory]: NonNullable<Factory[K]>;
};

export interface CanvasFactory {
  create(
    width: number,
    height: number,
    transparent: boolean
  ): NonNullableFactory;
}
