export function paintedTiles(paint: (context: OffscreenCanvasRenderingContext2D, scale: number) => void): ReadonlySet<string> {
  const painted = new Set<string>();
  const context = { fillStyle: "", fillRect: (x: number, y: number) => void painted.add(`${x},${y}`) };
  paint(context as unknown as OffscreenCanvasRenderingContext2D, 1);
  return painted;
}

export type Fill = Readonly<{ style: string; x: number; y: number }>;

export function paintedFills(paint: (context: OffscreenCanvasRenderingContext2D) => void): readonly Fill[] {
  const fills: Fill[] = [];
  const state: Record<string | symbol, unknown> = { fillStyle: "" };
  const context = new Proxy(state, {
    get: (target, property) =>
      property === "fillRect" ? (x: number, y: number) => void fills.push({ style: String(target.fillStyle), x, y }) : property in target ? target[property] : () => undefined,
    set: (target, property, value) => {
      target[property] = value;
      return true;
    },
  });
  paint(context as unknown as OffscreenCanvasRenderingContext2D);
  return fills;
}
