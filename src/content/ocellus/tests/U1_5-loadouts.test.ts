import { AttackStyle, AttackStylesController, TestNpc } from "osrs-sdk";
import type { IncomingAttackRoll, IncomingAttackRollModifiers, Location, Projectile, Region } from "osrs-sdk";
import { startDrill } from "./drill";

type Target = Readonly<{ magic: number; defence: number; size: number }>;

class MaxRollDummy extends TestNpc {
  readonly received: [number, string][] = [];
  readonly attackRolls: number[] = [];
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

  override incomingAttackRollModifiers(attack: IncomingAttackRoll): IncomingAttackRollModifiers {
    this.attackRolls.push(attack.weapon._attackRoll(attack.attacker, this, attack.bonuses));
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
const EAST_OF_SQUARE = { x: 8, y: 3 };

function clickInventory(drill: Drill, cacheItemId: number): void {
  const item = drill.player().inventory.find((slot) => slot?.cacheItemId === cacheItemId);
  if (!item) throw new Error(`no inventory item ${cacheItemId}`);
  item.inventoryLeftClick(drill.player());
}

describe("U1.5 loadouts", () => {
  test("each setup wears its owner-named items and carries Ralos, the other setup's pieces and the wiki's supplies", () => {
    const loadout = (setup: "ranged" | "melee") => {
      const drill = startDrill({ selection: { setup } });
      const player = drill.region.snapshot()?.player;
      drill.dispose();
      return player && { equipped: player.equipped, inventory: player.inventory };
    };
    expect(loadout("ranged")).toEqual({
      equipped: { weapon: 20997, offhand: null, helmet: 27235, chest: 27238, legs: 27241, gloves: 26235, cape: 28951, necklace: 33639, feet: 31097, ring: 28310, ammo: 11212 },
      inventory: [28922, 22325, 24419, 24420, 24421, 22981, 21295, 29801, 25485, 12695, 22461, 6685, 3024, 12695, 22461, 6685, 3024, 6685, 6685, 6685, 3024, 6685, 6685, 6685, 3024, 6685, 6685, 3024],
    });
    expect(loadout("melee")).toEqual({
      equipped: { weapon: 22325, offhand: null, helmet: 24419, chest: 24420, legs: 24421, gloves: 22981, cape: 21295, necklace: 29801, feet: 31097, ring: 25485, ammo: 11212 },
      inventory: [28922, 20997, 27235, 27238, 27241, 26235, 28951, 33639, 28310, 12695, 22461, 6685, 3024, 12695, 22461, 6685, 3024, 6685, 6685, 6685, 3024, 6685, 6685, 6685, 3024, 6685, 6685, 3024],
    });
  });

  test("clicking every switch but Ralos wears the melee setup and leaves the Avernic treads on", () => {
    const drill = startDrill({ selection: { setup: "ranged" } });
    for (const item of [...drill.player().inventory]) {
      if (item !== null && item.cacheItemId !== 28922) item.inventoryLeftClick(drill.player());
    }
    const player = drill.region.snapshot()?.player;
    drill.dispose();
    expect(player?.equipped).toEqual({ weapon: 22325, offhand: null, helmet: 24419, chest: 24420, legs: 24421, gloves: 22981, cape: 21295, necklace: 29801, feet: 31097, ring: 25485, ammo: 11212 });
    expect(player?.inventory.filter((id) => id === 31097)).toEqual([]);
  });

  test("the ranged setup's Masori and Zaryte bonuses set each ranged weapon's attack roll and max hit, with no void factor", () => {
    const shot = (ralos: boolean) => {
      const drill = startDrill();
      if (ralos) clickInventory(drill, 28922);
      const dummy = firstAttack(drill, EAST_OF_SQUARE, RANGED_TARGET);
      drill.dispose();
      return { attackRoll: dummy.attackRolls[0], hits: dummy.received };
    };
    expect({ twistedBow: shot(false), ralos: shot(true) }).toEqual({
      twistedBow: { attackRoll: 44490, hits: [[62, "range"]] },
      ralos: { attackRoll: 36594, hits: [[18, "range"], [18, "range"]] },
    });
  });

  test("the scythe rolls crush with Inquisitor's bonus on Jab, and slash without it on Chop", () => {
    const jab = startDrill();
    for (const item of [...jab.player().inventory]) {
      if (item !== null && item.cacheItemId !== 28922) item.inventoryLeftClick(jab.player());
    }
    jab.player().currentStats.strength = 118;
    jab.pray("Piety");
    expect(firstAttack(jab, EAST_OF_SQUARE, { magic: 1, defence: 0, size: 3 }).received).toEqual([[50, "crush"], [25, "crush"], [12, "crush"]]);
    jab.dispose();

    const chop = startDrill({ selection: { setup: "melee" } });
    const scythe = chop.player().equipment.weapon;
    if (!scythe) throw new Error("the melee setup has no weapon");
    AttackStylesController.controller.setWeaponAttackStyle(scythe, AttackStyle.AGGRESSIVESLASH);
    chop.player().currentStats.strength = 118;
    chop.pray("Piety");
    expect(firstAttack(chop, EAST_OF_SQUARE, { magic: 1, defence: 0, size: 3 }).received).toEqual([[49, "slash"], [24, "slash"], [12, "slash"]]);
    chop.dispose();
  });

  test("the Twisted Bow attacks every 5 ticks on Rapid and 6 otherwise, and Ralos every 6 on Rapid and 7 otherwise", () => {
    const gap = (ralos: boolean, style: AttackStyle) => {
      const drill = startDrill();
      if (ralos) clickInventory(drill, 28922);
      const weapon = drill.player().equipment.weapon;
      if (!weapon) throw new Error("no weapon worn");
      AttackStylesController.controller.setWeaponAttackStyle(weapon, style);
      const dummy = new MaxRollDummy(drill.region, EAST_OF_SQUARE, RANGED_TARGET, Infinity);
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
    const dummy = firstAttack(drill, EAST_OF_SQUARE, { magic: 240, defence: 200, size: 1 });
    expect([dummy.received, dummy.currentStats.defence, drill.region.snapshot()?.player.specialEnergy]).toEqual([[[18, "range"], [18, "range"]], 140, 50]);
    drill.dispose();
  });

  test("on an NPC the first glaive's drain lowers the Defence the second glaive rolls against", () => {
    const drill = startDrill({ seed: 1 });
    clickInventory(drill, 28922);
    drill.player().useSpecialAttack = true;
    const dummy = firstAttack(drill, EAST_OF_SQUARE, { magic: 2400, defence: 600, size: 1 }, 1);
    expect([dummy.received.map(([damage]) => damage > 0), dummy.currentStats.defence]).toEqual([[true, true], 0]);
    drill.dispose();
  });

  test("Division drains Ocellus's Defence only for glaives that land damage, so a spec into the invulnerable lead-in drains nothing", () => {
    const spec = (throwAt: number, landedBy: number) => {
      const drill = startDrill({ seed: 1 });
      drill.walkTo({ x: 5, y: 2 });
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
