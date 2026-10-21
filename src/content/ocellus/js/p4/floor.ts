import type { FloorRule, FloorShape, ResolvedChoices } from "../OcellusTimings";
import { OCELLUS_P4 } from "../OcellusTimings";
import type { Phase, Tile, VoidKind } from "../P4Types";
import { tile } from "../P4Types";

const key = (at: Tile) => `${at.x},${at.y}`;

export type Side = "north" | "south" | "east" | "west";
const STEP: Readonly<Record<Side, Readonly<{ dx: number; dy: number }>>> = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  west: { dx: -1, dy: 0 },
  east: { dx: 1, dy: 0 },
};
const SIDES: readonly Side[] = ["north", "south", "west", "east"];

export class TileMask<K extends VoidKind | null = VoidKind | null> {
  private constructor(readonly kind: K, private readonly byKey: ReadonlyMap<string, Tile>) {}

  static area(from: Tile, to: Tile): TileMask<null> {
    if (from.x > to.x || from.y > to.y) throw new RangeError(`empty area from ${key(from)} to ${key(to)}`);
    const tiles = new Map<string, Tile>();
    for (let x: number = from.x; x <= to.x; x++) {
      for (let y: number = from.y; y <= to.y; y++) tiles.set(`${x},${y}`, tile(x, y));
    }
    return new TileMask(null, tiles);
  }

  static floorOf(rows: readonly string[]): TileMask<null> {
    const tiles = new Map<string, Tile>();
    rows.forEach((row, y) =>
      [...row].forEach((cell, x) => {
        if (cell === "#") tiles.set(`${x},${y}`, tile(x, y));
        else if (cell !== "." && cell !== "?") throw new RangeError(`platform cell ${JSON.stringify(cell)} at ${x},${y} is not #, . or ?`);
      }),
    );
    return new TileMask(null, tiles);
  }

  minus(other: TileMask): TileMask<null> {
    return new TileMask(null, new Map([...this.byKey].filter(([at]) => !other.byKey.has(at))));
  }

  forVoid<V extends VoidKind>(kind: V): TileMask<V> {
    return new TileMask(kind, this.byKey);
  }

  contains(at: Tile): boolean {
    return this.byKey.has(key(at));
  }

  tiles(): readonly Tile[] {
    return [...this.byKey.values()];
  }

  border(): readonly Readonly<{ at: Tile; side: Side }>[] {
    return this.tiles().flatMap((at) =>
      SIDES.filter((side) => !this.byKey.has(`${at.x + STEP[side].dx},${at.y + STEP[side].dy}`)).map((side) => ({ at, side })),
    );
  }

  surround(): TileMask<null> {
    const around = new Map<string, Tile>();
    for (const { x, y } of this.tiles()) {
      for (const dx of [-1, 0, 1]) {
        for (const dy of [-1, 0, 1]) {
          const at = tile(x + dx, y + dy);
          if (!this.contains(at)) around.set(key(at), at);
        }
      }
    }
    return new TileMask(null, around);
  }

  extent(): Readonly<{ width: number; height: number }> {
    const tiles = this.tiles();
    return { width: Math.max(0, ...tiles.map(({ x }) => x + 1)), height: Math.max(0, ...tiles.map(({ y }) => y + 1)) };
  }
}

const { geometry, boss, floor } = OCELLUS_P4;
const anchor = geometry.bossAnchor.value;
const size = boss.size.value;
const ring = (floor.squareSide.value - size) / 2;
if (!Number.isInteger(ring) || ring < 0) throw new RangeError(`a ${floor.squareSide.value}-tile square cannot centre on a ${size}-tile boss`);

// The SDK anchors a unit on its south-west tile and extends it east and north (lower y).
const aroundBoss = (grow: number) => TileMask.area(tile(anchor.x - grow, anchor.y - size + 1 - grow), tile(anchor.x + size - 1 + grow, anchor.y + grow));
const nearSquare = aroundBoss(ring);
export const FOOTPRINT = aroundBoss(0);
export const PLATFORM = TileMask.floorOf(geometry.platform.value);

function shaped(shape: FloorShape): TileMask {
  switch (shape) {
    case "near-square":
      return nearSquare;
    case "platform-minus-near-square":
      return PLATFORM.minus(nearSquare);
    default: {
      const unhandled: never = shape;
      return unhandled;
    }
  }
}

function voidMask<K extends VoidKind>(kind: K): TileMask<K> {
  return shaped(floor.shapes[kind].value).forVoid(kind);
}

export const VOID_MASKS: { readonly [K in VoidKind]: TileMask<K> } = {
  "inner-void": voidMask("inner-void"),
  "outer-void": voidMask("outer-void"),
};

export function floorRule(kind: VoidKind, choices: ResolvedChoices): FloorRule {
  switch (kind) {
    case "inner-void":
      return choices.innerVoidFloor.option.value;
    case "outer-void":
      return floor.outerDamage.value;
    default: {
      const unhandled: never = kind;
      return unhandled;
    }
  }
}

export function voidUnder(phase: Phase): VoidKind | null {
  switch (phase.stage) {
    case "inner-void":
    case "outer-void":
      return phase.stage;
    case "lead-in":
    case "after-inner":
    case "after-outer":
      return null;
    default: {
      const unhandled: never = phase;
      return unhandled;
    }
  }
}
