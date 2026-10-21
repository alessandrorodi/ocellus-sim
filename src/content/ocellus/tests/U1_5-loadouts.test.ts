import { AttackStyle, AttackStylesController, TestNpc } from "osrs-sdk";
import type { IncomingAttackRoll, IncomingAttackRollModifiers, Location, Projectile, Region } from "osrs-sdk";
import { startDrill } from "./drill";

type Target = Readonly<{ magic: number; defence: number; size: number }>;

class MaxRollDummy extends TestNpc {
  readonly received: [number, string][] = [];
  readonly thrownAt: number[] = [];
  landed = 0;
  private readonly footprint: number;

  constructor(region: Region, location: Location, target: Target, private readonly maxedHits: number) {
    super(region, location, {});
    this.footprint = target.size;
    this.stats = { ...this.stats, magic: target.magic, defence: target.defence, hitpoint: 10000 };
    this.currentStats = { ...this.stats };
  }

  override get size(): number {
    return this.footprint;
  }

  override incomingAttackRollModifiers(_attack: IncomingAttackRoll): IncomingAttackRollModifiers {
    return this.received.length < this.maxedHits ? { guaranteedHit: true, maxDamage: true } : {};
  }

  override addProjectile(projectile: Projectile): void {
    super.addProjectile(projectile);
    this.received.push([projectile.damage, projectile.attackStyle]);
    this.thrownAt.push(this.region.world.globalTickCounter);
  }

  override damageTaken(): void {
    super.damageTaken();
    this.landed++;
  }

  override movementStep(): void {}

  override attackIfPossible(): void {}
}

type Drill = ReturnType<typeof startDrill>;

function firstAttack(drill: Drill, at: Location, target: Target, maxedHits = Infinity): MaxRollDummy {
  const dummy = new MaxRollDummy(drill.region, at, target, maxedHits);
  drill.region.addMob(dummy);
  drill.player().setAggro(dummy);
  for (let tick = 0; tick < 12 && (dummy.received.length === 0 || dummy.landed < dummy.received.length); tick++) drill.region.world.tickWorld();
  return dummy;
}

const RANGED_TARGET: Target = { magic: 300, defence: 0, size: 1 };
const SOUTH = { x: 10, y: 14 };

function clickInventory(drill: Drill, cacheItemId: number): void {
  const item = drill.player().inventory.find((slot) => slot?.cacheItemId === cacheItemId);
  if (!item) throw new Error(`no inventory item ${cacheItemId}`);
  item.inventoryLeftClick(drill.player());
}

describe("U1.5 loadouts", () => {
  test("each setup wears its owner-named items and keeps Ralos and the other setup's pieces as switches", () => {
    const loadout = (setup: "ranged" | "melee") => {
      const drill = startDrill({ selection: { setup } });
      const player = drill.region.snapshot()?.player;
      drill.dispose();
      return player && { equipped: player.equipped, switches: player.inventory.filter((id) => id !== null) };
    };
    expect(loadout("ranged")).toEqual({
      equipped: { weapon: 20997, offhand: null, helmet: 11664, chest: 13072, legs: 13073, gloves: 8842, cape: 28951, necklace: 19547, feet: 13237, ring: 28310, ammo: 11212 },
      switches: [28922, 22325, 24419, 24420, 24421, 22981, 21295, 19553, 13239, 25485],
    });
    expect(loadout("melee")).toEqual({
      equipped: { weapon: 22325, offhand: null, helmet: 24419, chest: 24420, legs: 24421, gloves: 22981, cape: 21295, necklace: 19553, feet: 13239, ring: 25485, ammo: 11212 },
      switches: [28922, 20997, 11664, 13072, 13073, 8842, 28951, 19547, 13237, 28310],
    });
  });

  test("full elite void raises the Twisted Bow's max hit, and without the gloves the set gives nothing", () => {
    const full = startDrill();
    expect(firstAttack(full, SOUTH, RANGED_TARGET).received).toEqual([[62, "range"]]);
    full.dispose();

    const noGloves = startDrill();
    noGloves.player().equipment.gloves?.unequip(noGloves.player());
    expect(firstAttack(noGloves, SOUTH, RANGED_TARGET).received).toEqual([[55, "range"]]);
    noGloves.dispose();
  });

  test("elite void's damage factor is floored on effective ranged strength", () => {
    const drill = startDrill();
    drill.player().currentStats.range = 93;
    expect(firstAttack(drill, SOUTH, RANGED_TARGET).received).toEqual([[58, "range"]]);
    drill.dispose();
  });

  test("elite void's accuracy factor is floored on the effective ranged level for the Twisted Bow and Ralos", () => {
    const attackRoll = (ralos: boolean) => {
      const drill = startDrill();
      if (ralos) clickInventory(drill, 28922);
      const player = drill.player();
      const weapon = player.equipment.weapon;
      if (!weapon) throw new Error("no weapon worn");
      const roll = weapon._attackRoll(player, drill.boss(), { effectivePrayers: {}, voidMultiplier: 1.1, gearRangeMultiplier: 1 });
      drill.dispose();
      return roll;
    };
    expect([attackRoll(false), attackRoll(true)]).toEqual([30958, 27378]);
  });

  test("the scythe rolls crush with Inquisitor's bonus on Jab, and slash without it on Chop", () => {
    const jab = startDrill();
    for (const item of [...jab.player().inventory]) {
      if (item !== null && item.cacheItemId !== 28922) item.inventoryLeftClick(jab.player());
    }
    jab.player().currentStats.strength = 118;
    jab.pray("Piety");
    expect(firstAttack(jab, SOUTH, { magic: 1, defence: 0, size: 3 }).received).toEqual([[50, "crush"], [25, "crush"], [12, "crush"]]);
    jab.dispose();

    const chop = startDrill({ selection: { setup: "melee" } });
    const scythe = chop.player().equipment.weapon;
    if (!scythe) throw new Error("the melee setup has no weapon");
    AttackStylesController.controller.setWeaponAttackStyle(scythe, AttackStyle.AGGRESSIVESLASH);
    chop.player().currentStats.strength = 118;
    chop.pray("Piety");
    expect(firstAttack(chop, SOUTH, { magic: 1, defence: 0, size: 3 }).received).toEqual([[49, "slash"], [24, "slash"], [12, "slash"]]);
    chop.dispose();
  });

  test("the Twisted Bow attacks every 5 ticks on Rapid and 6 otherwise, and Ralos every 6 on Rapid and 7 otherwise", () => {
    const gap = (ralos: boolean, style: AttackStyle) => {
      const drill = startDrill();
      if (ralos) clickInventory(drill, 28922);
      const weapon = drill.player().equipment.weapon;
      if (!weapon) throw new Error("no weapon worn");
      AttackStylesController.controller.setWeaponAttackStyle(weapon, style);
      const dummy = new MaxRollDummy(drill.region, SOUTH, RANGED_TARGET, Infinity);
      drill.region.addMob(dummy);
      drill.player().setAggro(dummy);
      for (let tick = 0; tick < 20 && new Set(dummy.thrownAt).size < 2; tick++) drill.region.world.tickWorld();
      AttackStylesController.controller.setWeaponAttackStyle(weapon, weapon.defaultStyle());
      drill.dispose();
      const [first, second] = [...new Set(dummy.thrownAt)];
      return second - first;
    };
    const stances = [AttackStyle.ACCURATE, AttackStyle.RAPID, AttackStyle.LONGRANGE];
    expect({ twistedBow: stances.map((style) => gap(false, style)), ralos: stances.map((style) => gap(true, style)) }).toEqual({
      twistedBow: [6, 5, 6],
      ralos: [7, 6, 7],
    });
  });

  test("Division spends half the bar, throws both glaives and drains 12.5% of Magic from Defence for each hit", () => {
    const drill = startDrill();
    clickInventory(drill, 28922);
    drill.player().useSpecialAttack = true;
    const dummy = firstAttack(drill, SOUTH, { magic: 240, defence: 200, size: 1 });
    expect([dummy.received, dummy.currentStats.defence, drill.region.snapshot()?.player.specialEnergy]).toEqual([[[18, "range"], [18, "range"]], 140, 50]);
    drill.dispose();
  });

  test("on an NPC the first glaive's drain lowers the Defence the second glaive rolls against", () => {
    const drill = startDrill({ seed: 1 });
    clickInventory(drill, 28922);
    drill.player().useSpecialAttack = true;
    const dummy = firstAttack(drill, SOUTH, { magic: 2400, defence: 600, size: 1 }, 1);
    expect([dummy.received.map(([damage]) => damage > 0), dummy.currentStats.defence]).toEqual([[true, true], 0]);
    drill.dispose();
  });

  test("Division drains Ocellus's Defence only for glaives that land damage, so a spec into the invulnerable lead-in drains nothing", () => {
    const spec = (throwAt: number, landedBy: number) => {
      const drill = startDrill({ seed: 1 });
      drill.walkTo(10, 8);
      drill.tickTo(throwAt);
      clickInventory(drill, 28922);
      drill.player().useSpecialAttack = true;
      drill.player().setAggro(drill.boss());
      drill.tickTo(landedBy);
      const { hitpoint, defence } = drill.boss().currentStats;
      const outcome = [drill.events("player-hit-judged").map((event) => event.outcome), hitpoint, defence, drill.region.snapshot()?.player.specialEnergy];
      drill.dispose();
      return outcome;
    };
    expect([spec(4, 7), spec(9, 12)]).toEqual([
      [["invulnerable", "invulnerable"], 1355, 250, 50],
      [["passed", "passed"], 1329, 176, 50],
    ]);
  });
});
