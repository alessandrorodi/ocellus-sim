import type { DamageRange } from "../OcellusTimings";
import type { Seed, Tick } from "../P4Types";

type RollStream = "orbTile" | "floorDamage" | "explosionDamage" | "specialDamage" | "specialVariant" | "riftBurst" | "holeLayout" | "holeDamage";

const STREAM_ID: Readonly<Record<RollStream, number>> = {
  orbTile: 1,
  floorDamage: 2,
  explosionDamage: 3,
  specialDamage: 4,
  specialVariant: 5,
  riftBurst: 6,
  holeLayout: 7,
  holeDamage: 8,
};

export function roll(seed: Seed, stream: RollStream, at: Tick, draw: number): number {
  let h = (seed ^ Math.imul(STREAM_ID[stream], 0x9e3779b9) ^ Math.imul(at, 0x85ebca6b) ^ Math.imul(draw, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x21f0aaad);
  h ^= h >>> 15;
  h = Math.imul(h, 0x735a2d97);
  h ^= h >>> 15;
  return (h >>> 0) / 2 ** 32;
}

export function rollInt(seed: Seed, stream: RollStream, at: Tick, range: DamageRange, draw: number): number {
  return range.min + Math.floor(roll(seed, stream, at, draw) * (range.max - range.min + 1));
}

export class CombatStream {
  private state: number;
  draws = 0;

  constructor(seed: Seed) {
    this.state = (seed ^ 0x5eed0c0b) >>> 0;
  }

  next(): number {
    this.draws++;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  }
}
