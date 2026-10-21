#!/usr/bin/env bash
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/verify.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

eval "$(grep -E '^(DRILL_QUERY|BOSS_NPC|SPAWN_TILE|WALK_CLICK_RIGHT_PX|WALK_CLICK_DOWN_PX|WALK_TARGET_TILE|CYCLE_[A-Z_]+|FOCUS_[A-Z_]+|BOSS_CLICK_[A-Z_]+|RING_CLICK_[A-Z_]+|FLOOD_[A-Z_]+|NEAR_SQUARE|VOID_[A-Z_]+|ORB_[A-Z_]+|LOADOUT_[A-Z_]+|CREDIT_LINE)=' "$SCRIPT")"
for fn in json process_start serve state doctor stop probe fight_tick_at_least drive_lead_in drive_walk drive_flood_shot drive_cycle drive_focus drive_void_floor drive_void_shot drive_lifeforce_orb click_at click_inventory_slot drive_loadouts drive release_browser stage_browser; do
  eval "$(sed -n "/^${fn}() {\$/,/^}\$/p" "$SCRIPT")"
done

setup() {
  T="$(mktemp -d "$WORK/case.XXXXXX")"
  VERIFY_DIR="$T/evidence"
  mkdir -p "$VERIFY_DIR"
  STATE_FILE="$T/current-server"
  VERIFY_PORT=8002
  URL="http://127.0.0.1:${VERIFY_PORT}/"
  log() { printf '%s\n' "$*"; }
  port_listener() { :; }
  manifest_ready() { :; }
  curl() { :; }
  node() {
    [[ "$1" == node_modules/.bin/webpack ]] || { command node "$@"; return; }
    echo "compiled successfully"
    exec sleep 30
  }
}

launched_pid() {
  sed -n 's/^pid=//p' "$VERIFY_DIR/server.pid"
}

refused_serve_does_not_stop_the_recorded_instance() {
  setup
  : >"$STATE_FILE"
  stop_called=0
  ab() { :; }
  stop() { stop_called=1; }
  if stage_browser; then echo "stage passed although serve refused"; return 1; fi
  [[ "$stop_called" -eq 0 ]] || { echo "stop was called for an instance this run did not start"; return 1; }
}

own_instance_is_stopped() {
  setup
  ab() { :; }
  doctor() { :; }
  drive() { :; }
  stage_browser || { echo "stage failed"; return 1; }
  local pid
  pid="$(launched_pid)"
  [[ -n "$pid" ]] || { echo "no instance was launched"; return 1; }
  ! kill -0 "$pid" 2>/dev/null || { echo "launched PID $pid is still running"; return 1; }
  [[ ! -e "$STATE_FILE" ]] || { echo "state file was not removed"; return 1; }
}

interrupt_stops_own_instance() {
  setup
  ab() { :; }
  doctor() { :; }
  drive() { kill -TERM "$BASHPID"; }
  (stage_browser)
  local status=$? pid
  pid="$(launched_pid)"
  [[ "$status" -eq 130 ]] || { echo "exit status $status, expected 130"; return 1; }
  ! kill -0 "$pid" 2>/dev/null || { echo "launched PID $pid is still running"; return 1; }
}

interrupt_leaves_the_recorded_instance() {
  setup
  : >"$STATE_FILE"
  ab() {
    [[ "$1" == close && ! -e "$T/signalled" ]] || return 0
    : >"$T/signalled"
    kill -TERM "$BASHPID"
  }
  stop() { : >"$T/stop-called"; }
  (stage_browser)
  local status=$?
  [[ "$status" -eq 130 ]] || { echo "exit status $status, expected 130"; return 1; }
  [[ ! -e "$T/stop-called" ]] || { echo "stop was called for an instance this run did not start"; return 1; }
}

fixture_logs() {
  local inner_void_tick="$1" focus="$2" fault="$3"
  command node -e '
    const [dir, innerVoid, focus, fault] = process.argv.slice(1);
    const stages = { 0: "lead-in", [innerVoid]: "inner-void", 30: "after-inner", 39: "outer-void", 59: "after-outer", 68: "inner-void" };
    const overheads = { 8: "deflect-melee", 33: "soul-split", 39: "deflect-range", 61: "soul-split", 68: "deflect-melee" };
    const specials = { 37: "vortex", 65: "spike-disk" };
    const at = (x, y) => ({ tile: { x, y } });
    const cycle = Array.from({ length: 71 }, (_, t) => ({
      tick: t,
      beats: specials[t] ? [{ kind: "special-hit", variant: specials[t] }] : [],
      playerAtBossStep: t <= 40 ? at(13, 11) : t === 41 ? at(13, 9) : at(12, 7),
      playerAtPostTick: t <= 39 ? at(13, 11) : t === 40 ? at(13, 9) : at(12, 7),
      bossHp: { atBossStep: 1355, atPostTick: 1355 },
      combatDraws: 0,
      inputs: t === 40 ? [{ kind: "walk-ordered", destination: { x: 12, y: 7 } }] : [],
      events: [
        ...(stages[t] ? [{ kind: "stage-entered", at: t, stage: stages[t] }] : []),
        ...(overheads[t] ? [{ kind: "overhead-switched", at: t, overhead: overheads[t] }] : []),
      ],
    }));
    const startOn = (t) => (t <= 47 ? at(13, 11) : t === 48 ? at(13, 9) : at(12, 7));
    const endOn = (t) => (t <= 46 ? at(13, 11) : t === 47 ? at(13, 9) : at(12, 7));
    const floodHits = { 44: 9, 45: 11, 46: 10, 47: 11, 48: 10, ...(fault === "ring-hit" ? { 50: 10 } : {}) };
    const launchTick = fault === "shot-from-the-ring" ? 50 : 45;
    const landingTick = fault === "no-ranged-landing" ? null : launchTick + 3;
    const shot = Array.from({ length: 59 }, (_, t) => ({
      tick: t,
      beats: [],
      playerAtBossStep: startOn(t),
      playerAtPostTick: endOn(t),
      bossHp: landingTick === null ? { atBossStep: 1355, atPostTick: 1355 } : { atBossStep: t <= landingTick ? 1355 : 1298, atPostTick: t < landingTick ? 1355 : 1298 },
      combatDraws: t === launchTick ? 2 : 0,
      inputs: t === 47 ? [{ kind: "walk-ordered", destination: { x: 12, y: 7 } }] : [],
      events: [
        ...(t === landingTick ? [{ kind: "player-hit-judged", at: t, style: "ranged", outcome: "passed", requested: 57 }] : []),
        ...(floodHits[t] ? [{ kind: "floor-hit", at: t, tile: startOn(t).tile, receipt: { applied: floodHits[t] } }] : []),
      ],
    }));
    const focusBeats = { 5: "boss-shouts", 32: "special-tell", 37: "special-hit", 39: "soul-split-heal" };
    const focused = Array.from({ length: 41 }, (_, t) => ({ tick: t, beats: focusBeats[t] ? [{ kind: focusBeats[t] }] : [], events: [] }));
    const standingHits = { 44: 9, 45: 11, 46: 10, 47: 11, 48: 10, 49: 9, 50: 9, 51: 10, 52: 9, 53: 10, 54: 1 };
    const standing = Array.from({ length: 55 }, (_, t) => ({
      tick: t,
      beats: [],
      events: [
        ...(standingHits[t] ? [{ kind: "floor-hit", at: t, tile: { x: 10, y: 10 }, receipt: { applied: standingHits[t] } }] : []),
        ...(t === 54 ? [{ kind: "run-ended", at: t, reason: "death" }] : []),
      ],
    }));
    const fs = require("fs");
    const write = (file, key, rows) => fs.writeFileSync(`${dir}/${file}`, JSON.stringify({ data: { result: { header: { choices: { focus: { key } } }, rows } } }));
    write("cycle-log.json", "full-fight", cycle);
    write("focus-log.json", focus, focused);
    write("void-log.json", "void-floor", standing);
    write("void-shot-log.json", "void-floor", shot);
    const orbReturn = fault === "late-orb-return" ? 29 : 28;
    const orbAt = (x, y, hp) => ({ tile: { x, y }, hp });
    const orbEvents = {
      11: [{ kind: "lifeforce-told", at: 11, void: "inner-void" }],
      12: [{ kind: "lifeforce-drained", at: 12, void: "inner-void", receipt: { applied: 49, afterHp: 50 } }],
      13: [{ kind: "orb-spawned", at: 13, void: "inner-void", tile: { x: 7, y: 9 }, credit: 49 }],
      24: [{ kind: "orb-matured", at: 24, void: "inner-void", tile: { x: 7, y: 9 } }],
      [orbReturn]: [{ kind: "orb-returned", at: orbReturn, void: "inner-void", receipt: { afterHp: 99, applied: 49, beforeHp: 50, requested: 49 } }],
    };
    const orb = Array.from({ length: 31 }, (_, t) => ({ tick: t, playerAtPostTick: t < 27 ? orbAt(10, 10, 99) : orbAt(7, 9, t < orbReturn ? 50 : 99), events: orbEvents[t] ?? [] }));
    const skipEvents = {
      30: [{ kind: "orb-expired", at: 30, void: "inner-void" }],
      61: [{ kind: "orb-expired", at: 61, void: "outer-void" }],
      62: fault === "no-boss-heal" ? [] : [{ kind: "boss-healed", at: 62, cause: { kind: "unclaimed-orb" }, receipt: { afterHp: 1380, applied: 25, beforeHp: 1355, requested: 25 } }],
    };
    const skip = Array.from({ length: 64 }, (_, t) => ({ tick: t, playerAtPostTick: orbAt(10, 10, 99), events: skipEvents[t] ?? [] }));
    write("orb-log.json", "lifeforce-orb", orb);
    write("orb-skip-log.json", "lifeforce-orb", skip);
  ' "$T" "$inner_void_tick" "$focus" "$fault"
}

fixture_png() {
  command node -e '
    const [file, voidPercent, boxTealPercent, outsideTealPercent, orbX, orbY, orbBox] = process.argv.slice(1);
    const zlib = require("zlib");
    const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return ~c >>> 0; };
    const chunk = (type, data) => { const head = Buffer.alloc(8), tail = Buffer.alloc(4); head.writeUInt32BE(data.length); head.write(type, 4); tail.writeUInt32BE(crc(Buffer.concat([Buffer.from(type), data]))); return Buffer.concat([head, data, tail]); };
    const [width, height] = [1280, 800];
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
    const offset = JSON.parse(orbBox);
    const box = { minX: Number(orbX) + offset.minX, maxX: Number(orbX) + offset.maxX, minY: Number(orbY) + offset.minY, maxY: Number(orbY) + offset.maxY };
    const left = {
      void: (width * height * Number(voidPercent)) / 100,
      box: ((box.maxX - box.minX + 1) * (box.maxY - box.minY + 1) * Number(boxTealPercent)) / 100,
      outside: (width * height * Number(outsideTealPercent)) / 100,
    };
    const [VOID, TEAL, FLOOR] = [[0x1e, 0x25, 0x29], [0x7c, 0xec, 0xb2], [0x68, 0x60, 0x58]];
    const colour = (x, y) => {
      if (left.void-- > 0) return VOID;
      const inBox = x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY;
      return (inBox ? left.box-- : left.outside--) > 0 ? TEAL : FLOOR;
    };
    const raw = Buffer.alloc(height * (1 + width * 3));
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) raw.set(colour(x, y), y * (1 + width * 3) + 1 + x * 3);
    require("fs").writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
  ' "$1" "$2" "${3:-0}" "${4:-0}" "$((1280 / 2 - ORB_CLICK_LEFT_PX))" "$((800 / 2 - ORB_CLICK_UP_PX))" "$ORB_BOX"
}

OK_DORMANT_TEAL=(0 2.3 0.4 0 0 0)
OK_GLOW_TEAL=(2.4 11.1 12.7 12.9 14.4 9.2)
NOORB_DORMANT_TEAL=(0 0 0 0 0 0.2)
NOORB_GLOW_TEAL=(3.5 4 3.4 3.1 2.9 2.5)

loadout_snapshot() {
  local n worn="$LOADOUT_RANGED_WORN" energy=100 defence=250
  n=$(($(cat "$T/loadout-probes" 2>/dev/null || echo 0) + 1))
  echo "$n" >"$T/loadout-probes"
  case "$n:$FAULT" in
    2:unswitched) ;;
    2:* | 4:*) worn="$LOADOUT_MELEE_WORN" ;;
    3:unspent) worn="$LOADOUT_MELEE_WORN" ;;
    3:two-drains) worn="$LOADOUT_MELEE_WORN" energy=50 defence=176 ;;
    3:three-drains) worn="$LOADOUT_MELEE_WORN" energy=50 defence=139 ;;
    3:*) worn="$LOADOUT_MELEE_WORN" energy=50 defence=213 ;;
  esac
  # agent-browser returns object keys sorted, unlike the literals in verify.sh.
  worn="$(command node -e 'const v = JSON.parse(process.argv[1]); console.log(JSON.stringify(Object.fromEntries(Object.entries(v).sort())))' "$worn")"
  printf '{"data":{"result":{"boss":{"defence":%s},"player":{"equipped":%s,"specialEnergy":%s}}}}\n' "$defence" "$worn" "$energy"
}

fake_browser() {
  FINAL_TILE="$1"
  SCREENSHOT="${2:-ok}"
  FAULT="${7:-none}"
  fixture_logs "${3:-8}" "${4:-$FOCUS_DRILL}" "$FAULT"
  LEAD_IN_FIGHT="${5:-}" PRESENT_FIGHT="${6:-}"
  [[ -n "$LEAD_IN_FIGHT" ]] || LEAD_IN_FIGHT='{"run":{"kind":"running","tick":1},"boss":{"npcId":16677,"visible":false}}'
  [[ -n "$PRESENT_FIGHT" ]] || PRESENT_FIGHT='{"run":{"kind":"running","tick":70},"boss":{"npcId":16677,"visible":true}}'
  ab() {
    case "$*" in
      "--json eval window.__archiveOcellusProbe.snapshot().fight") loadout_snapshot ;;
      "--json eval window.__archiveOcellusProbe.snapshot()")
        local n tile='{"x":10,"y":10}' tick=8 fight="$LEAD_IN_FIGHT"
        n=$(($(cat "$T/evals" 2>/dev/null || echo 0) + 1))
        echo "$n" >"$T/evals"
        [[ "$n" -ne 1 ]] || tick=6
        [[ "$n" -lt 3 ]] || { tile="$FINAL_TILE"; tick=12; fight="$PRESENT_FIGHT"; }
        [[ "$(cat "$T/restarts" 2>/dev/null || echo 0)" -lt 3 ]] || tile='{"x":7,"y":9}'
        printf '{"data":{"result":{"ticking":true,"tick":%s,"player":%s,"destination":%s,"fight":%s}}}\n' "$tick" "$tile" "$tile" "$fight"
        ;;
      "--json eval window.__archiveOcellusProbe.log()")
        [[ ! -e "$T/orb-skip" ]] || { cat "$T/orb-skip-log.json"; return; }
        case "$(cat "$T/restarts" 2>/dev/null || echo 0)" in
          0) cat "$T/cycle-log.json" ;;
          1) cat "$T/focus-log.json" ;;
          2) if [[ -e "$T/void-shot" ]]; then cat "$T/void-shot-log.json"; else cat "$T/void-log.json"; fi ;;
          *) cat "$T/orb-log.json" ;;
        esac
        ;;
      "open "*"focus=${VOID_DRILL}") : >"$T/void-shot" ;;
      "open "*"focus=${ORB_DRILL}") : >"$T/orb-skip" ;;
      "click #restart") echo $(($(cat "$T/restarts" 2>/dev/null || echo 0) + 1)) >"$T/restarts" ;;
      "--json get text "*) printf '{"data":{"text":"%s"}}\n' "$CREDIT_LINE" ;;
      "--json is visible "*) echo '{"data":{"visible":true}}' ;;
      "--json get box "*) echo '{"data":{"x":0,"y":0,"width":1280,"height":800}}' ;;
      "--json errors") echo '{"data":{"errors":[]}}' ;;
      "screenshot "*)
        local name frame
        name="$(basename "$2")"
        frame="${name//[^0-9]/}"
        case "$SCREENSHOT:$name" in
          ok:void-flood.png | ok:flood-ring.png | noorb:void-flood.png | noorb:flood-ring.png) fixture_png "$2" 60 ;;
          ok:void-inner.png | noorb:void-inner.png) fixture_png "$2" 2 ;;
          ok:orb-dormant-*) fixture_png "$2" 0 "${OK_DORMANT_TEAL[frame - 1]}" ;;
          ok:orb-glow-*) fixture_png "$2" 0 "${OK_GLOW_TEAL[frame - 1]}" ;;
          noorb:orb-dormant-*) fixture_png "$2" 0 "${NOORB_DORMANT_TEAL[frame - 1]}" ;;
          noorb:orb-glow-*) fixture_png "$2" 0 "${NOORB_GLOW_TEAL[frame - 1]}" 1 ;;
          ok:* | novoid:* | noorb:*) fixture_png "$2" 0 ;;
          fail:*) return 1 ;;
        esac
        ;;
      console) echo "[info] page loaded" ;;
    esac
  }
}

walk_to_the_documented_tile_passes() {
  setup
  fake_browser '{"x":13,"y":11}'
  drive >"$T/drive.log" 2>&1 || { cat "$T/drive.log"; return 1; }
}

walk_to_a_wrong_tile_fails() {
  setup
  fake_browser '{"x":11,"y":10}'
  if drive >"$T/drive.log" 2>&1; then echo "drive passed with the player on (11,10)"; return 1; fi
}

failed_screenshot_fails() {
  setup
  fake_browser '{"x":13,"y":11}' fail
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although every screenshot exited 1"; return 1; fi
}

missing_screenshot_fails() {
  setup
  fake_browser '{"x":13,"y":11}' empty
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although no screenshot was written"; return 1; fi
}

cycle_off_schedule_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 9
  if drive >"$T/drive.log" 2>&1; then echo "drive passed with the first inner void at P4 tick 9"; return 1; fi
  grep -q '"stagesOnSchedule": false' "$T/drive.log" || { echo "the stage check did not name the failure"; cat "$T/drive.log"; return 1; }
}

focus_not_applied_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 full-fight
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the reloaded drill ignored the focus"; return 1; fi
  grep -q '"focusApplied": false' "$T/drive.log" || { echo "the focus check did not name the failure"; cat "$T/drive.log"; return 1; }
}

boss_drawn_in_lead_in_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '{"run":{"kind":"running","tick":1},"boss":{"npcId":16677,"visible":true}}'
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the boss was drawn at P4 tick 1"; return 1; fi
  grep -q '"bossHiddenInLeadIn": false' "$T/drive.log" || { echo "the lead-in check did not name the failure"; cat "$T/drive.log"; return 1; }
}

lead_in_captured_after_the_hidden_ticks_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '{"run":{"kind":"running","tick":4},"boss":{"npcId":16677,"visible":false}}'
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the lead-in capture ran at P4 tick 4"; return 1; fi
  grep -q '"bossHiddenInLeadIn": false' "$T/drive.log" || { echo "the lead-in check did not name the failure"; cat "$T/drive.log"; return 1; }
}

flood_hit_in_the_ring_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '' '' ring-hit
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the floor hit the player in the ring at P4 tick 50"; return 1; fi
  grep -q '"ringSparedInFlood": false' "$T/drive.log" || { echo "the ring check did not name the failure"; cat "$T/drive.log"; return 1; }
}

ranged_shot_never_lands_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '' '' no-ranged-landing
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the arrow fired across the flood never landed"; return 1; fi
  grep -q '"rangedShotLanded": false' "$T/drive.log" || { echo "the landing check did not name the failure"; cat "$T/drive.log"; return 1; }
}

ranged_shot_from_the_ring_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '' '' shot-from-the-ring
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the bow fired only from the ring"; return 1; fi
  grep -q '"rangedShotFromTheFlood": false' "$T/drive.log" || { echo "the launch check did not name the failure"; cat "$T/drive.log"; return 1; }
}

void_not_drawn_fails() {
  setup
  fake_browser '{"x":13,"y":11}' novoid
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although no screenshot showed the void"; return 1; fi
  grep -q '"floodDrawn": false' "$T/drive.log" || { echo "the drawing check did not name the failure"; cat "$T/drive.log"; return 1; }
  grep -q '"innerVoidDrawn": false' "$T/drive.log" || { echo "the inner drawing check did not name the failure"; cat "$T/drive.log"; return 1; }
}

orb_returned_a_tick_late_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '' '' late-orb-return
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the orb returned two ticks after it was ready"; return 1; fi
  grep -q '"orbReturnedTickAfterArrival": false' "$T/drive.log" || { echo "the return check did not name the failure"; cat "$T/drive.log"; return 1; }
}

skipped_orb_without_boss_heal_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '' '' no-boss-heal
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the skipped outer orb never healed the boss"; return 1; fi
  grep -q '"skippedOrbHealsBoss": false' "$T/drive.log" || { echo "the heal check did not name the failure"; cat "$T/drive.log"; return 1; }
}

orb_glow_not_drawn_fails() {
  setup
  fake_browser '{"x":13,"y":11}' noorb
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the orb kept its dormant look and the new teal was elsewhere on screen"; return 1; fi
  grep -q '"orbGlowDrawn": false' "$T/drive.log" || { echo "the orb drawing check did not name the failure"; cat "$T/drive.log"; return 1; }
}

boss_never_drawn_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '' '{"run":{"kind":"running","tick":70},"boss":{"npcId":16677,"visible":false}}'
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the boss was never drawn"; return 1; fi
  grep -q '"bossDrawnOncePresent": false' "$T/drive.log" || { echo "the presence check did not name the failure"; cat "$T/drive.log"; return 1; }
}

loadout_not_switched_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '' '' unswitched
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the inventory clicks changed no gear"; return 1; fi
  grep -q '"switchesWornByClick": false' "$T/drive.log" || { echo "the switch check did not name the failure"; cat "$T/drive.log"; return 1; }
}

division_not_spent_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '' '' unspent
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although Division never fired"; return 1; fi
  grep -q '"divisionSpentHalfTheBar": false' "$T/drive.log" || { echo "the special attack check did not name the failure"; cat "$T/drive.log"; return 1; }
  grep -q '"divisionDrainedBossDefence": false' "$T/drive.log" || { echo "the Defence check did not name the failure"; cat "$T/drive.log"; return 1; }
}

division_extra_drains_fail() {
  local drains
  for drains in three-drains two-drains; do
    setup
    fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '' '' "$drains"
    if drive >"$T/drive.log" 2>&1; then echo "drive passed with ${drains} from seed 1's one damaging glaive"; return 1; fi
    grep -q '"divisionDrainedBossDefence": false' "$T/drive.log" || { echo "the Defence check did not name the ${drains} failure"; cat "$T/drive.log"; return 1; }
  done
}

failed=0
for t in \
  refused_serve_does_not_stop_the_recorded_instance \
  own_instance_is_stopped \
  interrupt_stops_own_instance \
  interrupt_leaves_the_recorded_instance \
  walk_to_the_documented_tile_passes \
  walk_to_a_wrong_tile_fails \
  failed_screenshot_fails \
  missing_screenshot_fails \
  cycle_off_schedule_fails \
  focus_not_applied_fails \
  boss_drawn_in_lead_in_fails \
  lead_in_captured_after_the_hidden_ticks_fails \
  flood_hit_in_the_ring_fails \
  ranged_shot_never_lands_fails \
  ranged_shot_from_the_ring_fails \
  void_not_drawn_fails \
  boss_never_drawn_fails \
  orb_returned_a_tick_late_fails \
  skipped_orb_without_boss_heal_fails \
  orb_glow_not_drawn_fails \
  loadout_not_switched_fails \
  division_not_spent_fails \
  division_extra_drains_fail; do
  if ("$t") >"$WORK/$t.log" 2>&1; then
    echo "PASS $t"
  else
    echo "FAIL $t"
    sed 's/^/  /' "$WORK/$t.log"
    failed=1
  fi
done
exit $failed
