export function paintedTiles(paint: (context: OffscreenCanvasRenderingContext2D, scale: number) => void): ReadonlySet<string> {
  const painted = new Set<string>();
  const context = { fillStyle: "", fillRect: (x: number, y: number) => void painted.add(`${x},${y}`) };
  paint(context as unknown as OffscreenCanvasRenderingContext2D, 1);
  return painted;
}
