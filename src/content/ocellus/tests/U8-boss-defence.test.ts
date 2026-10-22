import type { AttackBonuses, Mob } from "osrs-sdk";
import { startDrill } from "./drill";

type Roll = Readonly<{ defence: number; hitChance: number }>;

function recordRolls(boss: Mob): Roll[] {
  const rolls: Roll[] = [];
  const seen = new Set<AttackBonuses>();
  const modifiers = boss.incomingAttackRollModifiers.bind(boss);
  jest.spyOn(boss, "incomingAttackRollModifiers").mockImplementation((attack) => {
    if (!seen.has(attack.bonuses)) {
      seen.add(attack.bonuses);
      rolls.push({ defence: boss.currentStats.defence, hitChance: attack.weapon._hitChance(attack.attacker, boss, attack.bonuses) });
    }
    return modifiers(attack);
  });
  return rolls;
}

type Attack = "twisted-bow" | "ralos" | "division";

function firstRoll(attack: Attack): Roll {
  const drill = startDrill();
  const rolls = recordRolls(drill.boss());
  drill.tickTo(9);
  if (attack !== "twisted-bow") drill.clickInventory(28922);
  drill.player().useSpecialAttack = attack === "division";
  drill.player().setAggro(drill.boss());
  drill.tickTo(10);
  drill.dispose();
  return rolls[0];
}

describe("U8 boss defence", () => {
  test("the Twisted Bow and Ralos roll against the wiki's 250 Defence and 250 ranged defence", () => {
    expect({ twistedBow: firstRoll("twisted-bow"), ralos: firstRoll("ralos"), division: firstRoll("division") }).toEqual({
      twistedBow: { defence: 250, hitChance: 44490 / 162653 },
      ralos: { defence: 250, hitChance: 36594 / 162653 },
      division: { defence: 250, hitChance: 54891 / 162653 },
    });
  });

  test("Division drains the boss's Defence to the 60% floor of 150 and no lower", () => {
    const drill = startDrill({ seed: 20 });
    const rolls = recordRolls(drill.boss());
    drill.walkTo({ x: 5, y: 2 });
    drill.tickTo(9);
    drill.clickInventory(28922);
    drill.player().useSpecialAttack = true;
    drill.player().setAggro(drill.boss());
    drill.tickTo(12);
    const afterFirstSpec = drill.boss().currentStats.defence;
    drill.player().useSpecialAttack = true;
    drill.tickTo(18);
    const landed = [afterFirstSpec, drill.boss().currentStats.defence];
    const glaives = drill.events("player-hit-judged").map((event) => event.requested > 0);
    drill.dispose();
    expect({ rolledAgainst: rolls.map((roll) => roll.defence), glaivesDamaged: glaives, landed }).toEqual({
      rolledAgainst: [250, 213, 176, 150],
      glaivesDamaged: [true, true, true, true],
      landed: [176, 150],
    });
  });
});
