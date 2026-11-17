/** Pure flashlight geometry. No DOM access. */

export interface Viewport {
  width: number;
  height: number;
}

export interface MaskSize {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Lantern mode light radius multiplier (Req 8.12). */
export const LANTERN_RADIUS_FACTOR = 1.5;

/** Mask is 200vw by 200vh (Req 8.3). */
export function maskSize(vp: Viewport): MaskSize {
  return { width: vp.width * 2, height: vp.height * 2 };
}

/** Translate that centers the mask on the pointer: pointer - mask/2 (Req 8.3, 8.4, 8.5). */
export function maskTranslate(pointer: Point, mask: MaskSize): Point {
  return { x: pointer.x - mask.width / 2, y: pointer.y - mask.height / 2 };
}

/** Light radius; Lantern mode uses base x 1.5 (Req 8.12). */
export function lanternRadius(base: number, lantern: boolean): number {
  return lantern ? base * LANTERN_RADIUS_FACTOR : base;
}
