#!/usr/bin/env bash
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/verify.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

eval "$(grep -E '^(DRILL_QUERY|BOSS_NPC|SPAWN_TILE|WALK_[A-Z_]+|EDGE_[A-Z_]+|CYCLE_[A-Z_]+|FOCUS_[A-Z_]+|BOSS_CLICK_[A-Z_]+|RING_CLICK_[A-Z_]+|FLOOD_[A-Z_]+|NEAR_SQUARE|VOID_[A-Z_]+|ORB_[A-Z_]+|LOADOUT_[A-Z_]+|EXPLOSION_[A-Z_]+|STEP_CLICK_[A-Z_]+|DODGE_CLICK_[A-Z_]+|UNDER_BOSS_CLICK_[A-Z_]+|MARKER_SHOT_[A-Z_]+|SOUND_[A-Z_]+|SPECIAL_[A-Z_]+|PROTECT_[A-Z_]+|TELL_[A-Z_]+|TRANSITION_[A-Z_]+|LANDING_[A-Z_]+|STYLE_[A-Z_]+|SUPPLY_[A-Z_]+|KEYBIND_[A-Z_]+|CREDIT_LINE)=' "$SCRIPT")"
for fn in json process_start serve state doctor stop probe fight_tick_at_least canvas_centre click_after_tick shot_after_tick save_sound_settings record_audio_starts step_on_marks step_south_and_back_on_marks drive_lead_in drive_walk click_past_the_edge drive_edge drive_flood_shot drive_cycle choose_focus drive_focus drive_void_floor drive_void_shot drive_lifeforce_orb drive_explosions drive_transition_attack click_at click_inventory_slot drive_loadouts right_click_inventory_slot drive_supplies bind_inventory_key drive_keybinds drive release_browser stage_browser; do
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

failed_transfer_fails_doctor() {
  setup
  printf 'pid=4242\nstarted=unchanged\nport=8002\nrevision=%s\n' "$(git rev-parse HEAD)" >"$STATE_FILE"
  process_start() { echo unchanged; }
  port_listener() { echo 4242; }
  curl() {
    case "$*" in
      *manifest.json*)
        [[ "$BROKEN" != manifest ]] || { printf '{"assets":{"npc-16677":'; return 18; }
        printf '{"assets":{"npc-16677":{}}}'
        ;;
      *)
        [[ "$BROKEN" != page ]] || { printf '<html><title>Archive Ocellus Trainer</title>'; return 18; }
        printf '<html><title>Archive Ocellus Trainer</title></html>'
        ;;
    esac
  }
  BROKEN=none
  doctor >"$T/doctor.log" || { echo "doctor rejected a healthy instance"; cat "$T/doctor.log"; return 1; }
  for BROKEN in page manifest; do
    if doctor >"$T/doctor.log"; then echo "doctor passed although the ${BROKEN} transfer failed (curl exit 18)"; return 1; fi
    grep -q "doctor: ${BROKEN} request failed" "$T/doctor.log" || { echo "doctor did not name the failed ${BROKEN} transfer"; cat "$T/doctor.log"; return 1; }
  done
}

fixture_logs() {
  local inner_void_tick="$1" focus="$2" fault="$3"
  command node -e '
    const [dir, innerVoid, focus, fault] = process.argv.slice(1);
    const stages = { 0: "lead-in", [innerVoid]: "inner-void", 30: "after-inner", 39: "outer-void", 59: "after-outer", 68: "inner-void" };
    const overheads = { 8: "deflect-melee", 33: "soul-split", 39: "deflect-range", 61: "soul-split", 68: "deflect-melee" };
    const specials = { 37: "vortex", 65: "spike-disk" };
    const at = (x, y) => ({ tile: { x, y } });
    const walks = { 3: { x: 8, y: 3 }, 5: fault === "edge-on-floor" ? { x: 8, y: 1 } : { x: 8, y: 0 }, 40: { x: 7, y: 3 } };
    const cycle = Array.from({ length: 71 }, (_, t) => ({
      tick: t,
      beats: specials[t] ? [{ kind: "special-hit", variant: specials[t] }] : [],
      playerAtBossStep: t <= 40 ? at(8, 1) : t === 41 ? at(7, 2) : at(7, 3),
      playerAtPostTick: t <= 39 ? at(8, 1) : t === 40 ? at(7, 2) : at(7, 3),
      bossHp: { atBossStep: 1355, atPostTick: 1355 },
      combatDraws: 0,
      inputs: walks[t] ? [{ kind: "walk-ordered", destination: walks[t] }] : [],
      events: [
        ...(stages[t] ? [{ kind: "stage-entered", at: t, stage: stages[t] }] : []),
        ...(overheads[t] ? [{ kind: "overhead-switched", at: t, overhead: overheads[t] }] : []),
      ],
    }));
    const startOn = (t) => (t <= 47 ? at(8, 1) : t === 48 ? at(7, 2) : at(7, 3));
    const endOn = (t) => (t <= 46 ? at(8, 1) : t === 47 ? at(7, 2) : at(7, 3));
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
      inputs: t === 47 ? [{ kind: "walk-ordered", destination: { x: 7, y: 3 } }] : [],
      events: [
        ...(t === landingTick ? [{ kind: "player-hit-judged", at: t, style: "ranged", outcome: "passed", requested: 57 }] : []),
        ...(floodHits[t] ? [{ kind: "floor-hit", at: t, tile: startOn(t).tile, receipt: { applied: floodHits[t] } }] : []),
      ],
    }));
    const focusBeats = { 5: "boss-shouts", 29: "boss-landing-starts", 32: "special-tell", 34: "special-sound", 37: "special-hit", 39: "soul-split-heal" };
    const focused = Array.from({ length: 41 }, (_, t) => ({ tick: t, beats: focusBeats[t] ? [{ kind: focusBeats[t] }] : [], events: [] }));
    const standingHits = { 44: 9, 45: 11, 46: 10, 47: 11, 48: 10, 49: 9, 50: 9, 51: 10, 52: 9, 53: 10, 54: 1 };
    const standing = Array.from({ length: 55 }, (_, t) => ({
      tick: t,
      beats: [],
      events: [
        ...(standingHits[t] ? [{ kind: "floor-hit", at: t, tile: { x: 5, y: 1 }, receipt: { applied: standingHits[t] } }] : []),
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
      13: [{ kind: "orb-spawned", at: 13, void: "inner-void", tile: { x: 3, y: 2 }, credit: 49 }],
      24: [{ kind: "orb-matured", at: 24, void: "inner-void", tile: { x: 3, y: 2 } }],
      [orbReturn]: [{ kind: "orb-returned", at: orbReturn, void: "inner-void", receipt: { afterHp: 99, applied: 49, beforeHp: 50, requested: 49 } }],
    };
    const orb = Array.from({ length: 31 }, (_, t) => ({ tick: t, playerAtPostTick: t < 27 ? orbAt(5, 1, 99) : orbAt(3, 2, t < orbReturn ? 50 : 99), events: orbEvents[t] ?? [] }));
    const skipEvents = {
      30: [{ kind: "orb-expired", at: 30, void: "inner-void" }],
      61: [{ kind: "orb-expired", at: 61, void: "outer-void" }],
      62: fault === "no-boss-heal" ? [] : [{ kind: "boss-healed", at: 62, cause: { kind: "unclaimed-orb" }, receipt: { afterHp: 1380, applied: 25, beforeHp: 1355, requested: 25 } }],
    };
    const skip = Array.from({ length: 64 }, (_, t) => ({ tick: t, playerAtPostTick: orbAt(5, 1, 99), events: skipEvents[t] ?? [] }));
    write("orb-log.json", "lifeforce-orb", orb);
    write("orb-skip-log.json", "lifeforce-orb", skip);
    const walk = (x, y) => ({ kind: "walk-ordered", destination: { x, y } });
    const marked = (t, x, y) => ({ kind: "explosion-marked", at: t, void: t < 39 ? "inner-void" : "outer-void", tile: { x, y } });
    const resolved = (t, x, y, outcome, underBoss = false) => ({ kind: "explosion-resolved", at: t, tile: { x, y }, underBoss, outcome });
    const lateHit = { kind: "hit", receipt: { requested: 16, applied: 16, beforeHp: 99, afterHp: 83, prayer: null } };
    const dodge = { 17: 5, 19: 3, 21: 5, 23: 3, 25: 5, 27: 3 };
    const dodgeRows = Array.from({ length: 51 }, (_, t) => {
      const markX = dodge[t], impactX = dodge[t - 1];
      return {
        tick: t,
        playerAtBossStep: at(5, 1),
        playerAtPostTick: t === 49 ? at(3, 1) : at(5, 1),
        inputs: markX !== undefined ? [walk(8 - markX, 1)] : t === 49 ? [walk(3, 1)] : [],
        events: [
          ...(markX !== undefined ? [marked(t, markX, 1)] : []),
          ...(impactX !== undefined ? [resolved(t, impactX, 1, fault === "dodge-hit" && t === 22 ? lateHit : { kind: "avoided" })] : []),
          ...(t === 48 ? [marked(48, 5, 1)] : []),
          ...(t === 49 ? [resolved(49, 5, 1, fault === "late-spared" ? { kind: "avoided" } : lateHit)] : []),
        ],
      };
    });
    const underRows = Array.from({ length: 30 }, (_, t) => ({
      tick: t,
      events: [
        ...(dodge[t] !== undefined ? [marked(t, 5, 6)] : []),
        ...(dodge[t - 1] !== undefined
          ? [resolved(t, 5, 6, fault === "under-spared" ? { kind: "avoided" } : { kind: "hit", receipt: { requested: 16, applied: 16, beforeHp: 99 - 8 * (t - 18), afterHp: 99 - 8 * (t - 18) - 16, prayer: null } }, true)]
          : []),
      ],
    }));
    write("explosion-log.json", "explosions", dodgeRows);
    const late = fault === "sound-on-impact" ? 1 : 0;
    const cue = (tick, samples) => ({ tick, samples, rate: 22050, state: fault === "suspended-audio" ? "suspended" : "running" });
    const audio = [
      cue(14, 14332), ...[17, 19, 21, 23, 25, 27].map((t) => cue(t + late, 8820)),
      cue(45, 14332), ...[48, 50, 52, 54, 56, 58].map((t) => cue(t + late, 8820)),
      { ...cue(49, 30720), rate: 48000 },
    ].sort((a, b) => a.tick - b.tick);
    fs.writeFileSync(`${dir}/explosion-audio.json`, JSON.stringify({ data: { result: audio } }));
    write("explosion-under-log.json", "explosions", underRows);
    const told = (t, variant, style) => ({ kind: "special-told", at: t, variant, style });
    const struck = (t, style, receipt) => ({ kind: "special-hit", at: t, style, receipt });
    const prayed = { kind: "prayer-published", prayer: "magic" };
    const protectedHit = struck(37, "magic", { requested: 8, applied: 8, beforeHp: 99, afterHp: 91, prayer: "magic" });
    const unprotectedHit = struck(37, "magic", { requested: 49, applied: 49, beforeHp: 99, afterHp: 50, prayer: null });
    const inTime = Array.from({ length: 39 }, (_, t) => ({
      tick: t,
      inputs: t === 34 ? [prayed] : [],
      events: [...(t === 32 ? [told(32, "vortex", "magic")] : []), ...(t === 37 ? [fault === "unprotected" ? unprotectedHit : protectedHit] : [])],
    }));
    const firstTell = fault === "tell-late" ? 33 : 32;
    const lateTells = { [firstTell]: told(firstTell, "vortex", "magic"), 60: told(60, "spike-disk", "ranged"), 92: told(92, "black-disk", "melee") };
    const lateHits = {
      37: fault === "late-protected" ? protectedHit : unprotectedHit,
      65: struck(65, "ranged", { requested: 47, applied: 47, beforeHp: 50, afterHp: 3, prayer: "magic" }),
      97: struck(97, "melee", { requested: 49, applied: 3, beforeHp: 3, afterHp: 0, prayer: "magic" }),
    };
    const lateRows = Array.from({ length: 98 }, (_, t) => ({
      tick: t,
      inputs: t === 38 ? [prayed] : [],
      events: [...(lateTells[t] ? [lateTells[t]] : []), ...(lateHits[t] ? [lateHits[t]] : []), ...(t === 97 ? [{ kind: "run-ended", at: 97, reason: "death" }] : [])],
    }));
    write("special-log.json", "transition-attacks", inTime);
    write("special-late-log.json", "transition-attacks", lateRows);
    const heard = (at, samples, rate = 22050) => ({ tick: Math.floor(at), phase: Math.round((at - Math.floor(at)) * 100) / 100, samples, rate, state: fault === "special-unclicked" && at < 38 ? "suspended" : "running" });
    const landingAt = (start) => [[0.11, 19845], [0.86, 33075], [2.08, 22050], [2.5, 22050]].map(([offset, samples]) => heard(start + offset, samples));
    const landingStart = fault === "landing-late" ? 1 : 0;
    const transitionAudio = [
      ...[26, 28].map((t) => heard(t + 0.11, 44100)),
      ...landingAt(29 + landingStart), heard(32.44, 22050), heard(34.2, 35280), heard(36.53, 19845), heard(37.01, 9042, 48000), heard(37.11, 26460), heard(37.25, 55125),
      heard(60.44, 22050), heard(fault === "ranged-on-the-hit" ? 65.01 : 64.4, 33075), heard(64.53, 19845), heard(65.1, 44100), heard(65.11, 26460),
      heard(68.08, 39690), ...[70, 72, 74, 76, 78, 80, 82, 84, 86, 88].map((t) => heard(t + 0.11, 44100)),
      ...landingAt(89 + landingStart), heard(92.1, 66150), heard(92.44, 22050), heard(96.53, 19845), heard(97.1, 33075), heard(97.11, 26460),
    ].sort((a, b) => a.tick + a.phase - (b.tick + b.phase));
    fs.writeFileSync(`${dir}/special-audio.json`, JSON.stringify({ data: { result: transitionAudio } }));
  ' "$T" "$inner_void_tick" "$focus" "$fault"
}

fixture_shards() {
  command node -e '
    const [file, centre] = process.argv.slice(1);
    const zlib = require("zlib");
    const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return ~c >>> 0; };
    const chunk = (type, data) => { const head = Buffer.alloc(8), tail = Buffer.alloc(4); head.writeUInt32BE(data.length); head.write(type, 4); tail.writeUInt32BE(crc(Buffer.concat([Buffer.from(type), data]))); return Buffer.concat([head, data, tail]); };
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(100, 0); ihdr.writeUInt32BE(100, 4); ihdr[8] = 8; ihdr[9] = 2;
    const shard = (x, y) => y >= 45 && y <= 55 && Math.abs(x + 0.5 - Number(centre) * 100) <= 2;
    const rows = Array.from({ length: 100 }, (_, y) => Buffer.from([0, ...Array.from({ length: 100 }, (_, x) => (shard(x, y) ? [0x5e, 0x31, 0x7b] : [0x68, 0x60, 0x58])).flat()]));
    require("fs").writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]));
  ' "$1" "$2"
}

fixture_tell() {
  command node -e '
    const [file, percent, centre, tellBox, centreBox] = process.argv.slice(1);
    const zlib = require("zlib");
    const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return ~c >>> 0; };
    const chunk = (type, data) => { const head = Buffer.alloc(8), tail = Buffer.alloc(4); head.writeUInt32BE(data.length); head.write(type, 4); tail.writeUInt32BE(crc(Buffer.concat([Buffer.from(type), data]))); return Buffer.concat([head, data, tail]); };
    const [width, height] = [1280, 800];
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
    const around = (o) => ({ minX: width / 2 + o.minX, maxX: width / 2 + o.maxX, minY: height / 2 + o.minY, maxY: height / 2 + o.maxY });
    const [box, middle] = [around(JSON.parse(tellBox)), around(JSON.parse(centreBox))];
    const within = (b, x, y) => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;
    const centreColour = { black: [0x02, 0x02, 0x03], white: [0xf8, 0xf8, 0xf8] }[centre];
    let left = ((box.maxX - box.minX + 1) * (box.maxY - box.minY + 1) * Number(percent)) / 100;
    const raw = Buffer.alloc(height * (1 + width * 3));
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colour = centreColour && within(middle, x, y) ? centreColour : within(box, x, y) && left-- > 0 ? [0x9b, 0x30, 0xff] : [0x68, 0x60, 0x58];
        raw.set(colour, y * (1 + width * 3) + 1 + x * 3);
      }
    }
    require("fs").writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
  ' "$1" "$2" "${3:-none}" "$TELL_BOX" "$TELL_CENTRE_BOX"
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
  ' "$1" "$2" "${3:-0}" "${4:-0}" "$((1280 / 2 + ORB_CLICK_RIGHT_PX))" "$((800 / 2 - ORB_CLICK_UP_PX))" "$ORB_BOX"
}

OK_DORMANT_TEAL=(0 2.3 0.4 0 0 0)
OK_GLOW_TEAL=(2.4 11.1 12.7 12.9 14.4 9.2)
NOORB_DORMANT_TEAL=(0 0 0 0 0 0.2)
NOORB_GLOW_TEAL=(3.5 4 3.4 3.1 2.9 2.5)

fake_screenshot() {
  local name frame
  name="$(basename "$1")"
  frame="${name//[^0-9]/}"
  case "$SCREENSHOT:$name" in
    fail:*) return 1 ;;
    empty:*) ;;
    markerfollows:explosion-left.png | *:explosion-standing.png) fixture_shards "$1" 0.5 ;;
    *:explosion-left.png) fixture_shards "$1" 0.44 ;;
    notell:special-* | *:special-before.png) fixture_tell "$1" 0 ;;
    *:special-semicircle.png) fixture_tell "$1" 4 ;;
    whitecentre:special-*) fixture_tell "$1" 4 white ;;
    *:special-*) fixture_tell "$1" 4 black ;;
    notell:* | whitecentre:*) SCREENSHOT=ok fake_screenshot "$1" ;;
    ok:void-flood.png | ok:flood-ring.png | noorb:void-flood.png | noorb:flood-ring.png | markerfollows:void-flood.png | markerfollows:flood-ring.png) fixture_png "$1" 60 ;;
    ok:void-inner.png | noorb:void-inner.png | markerfollows:void-inner.png) fixture_png "$1" 2 ;;
    swapped:void-flood.png | swapped:flood-ring.png) fixture_png "$1" 2 ;;
    swapped:void-inner.png) fixture_png "$1" 5 ;;
    ok:orb-dormant-* | markerfollows:orb-dormant-* | swapped:orb-dormant-*) fixture_png "$1" 0 "${OK_DORMANT_TEAL[frame - 1]}" ;;
    ok:orb-glow-* | markerfollows:orb-glow-* | swapped:orb-glow-*) fixture_png "$1" 0 "${OK_GLOW_TEAL[frame - 1]}" ;;
    noorb:orb-dormant-*) fixture_png "$1" 0 "${NOORB_DORMANT_TEAL[frame - 1]}" ;;
    noorb:orb-glow-*) fixture_png "$1" 0 "${NOORB_GLOW_TEAL[frame - 1]}" 1 ;;
    *) fixture_png "$1" 0 ;;
  esac
}

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

supply_probe() {
  local n
  case "$1" in
    inventory)
      [[ "$FAULT" == no-supplies ]] && { echo '{"data":{"result":[28922,22325,24419,24420,24421,22981,21295,29801,25485,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}}'; return; }
      printf '{"data":{"result":%s}}\n' "$SUPPLY_INVENTORY"
      ;;
    menu)
      n=$(($(cat "$T/menu-probes" 2>/dev/null || echo 0) + 1))
      echo "$n" >"$T/menu-probes"
      if [[ "$n" -gt 1 ]]; then echo '{"data":{"result":null}}'
      elif [[ "$FAULT" == null-names ]]; then echo '{"data":{"result":["Equip null","Drop null","Examine null"]}}'
      else printf '{"data":{"result":%s}}\n' "$SUPPLY_NAMED_MENU"
      fi
      ;;
    hp)
      local healed="$SUPPLY_HP_AFTER_BREW"
      [[ "$FAULT" != no-heal ]] || healed=99
      printf '{"data":{"result":[[0,99],[1,99],[2,99],[3,99],[4,%s],[5,%s]]}}\n' "$healed" "$healed"
      ;;
    panel)
      local tab=SETTINGS key="$KEYBIND_DEFAULT_KEY"
      n=$(($(cat "$T/panel-probes" 2>/dev/null || echo 0) + 1))
      echo "$n" >"$T/panel-probes"
      case "$n:$FAULT" in
        1:keybinds-closed) tab=INVENTORY ;;
        2:*) key="$KEYBIND_NEW_KEY" ;;
        3:unsaved-key | 4:unsaved-key) tab=PRAYER ;;
        3:*) tab=PRAYER key="$KEYBIND_NEW_KEY" ;;
        4:*) tab=INVENTORY key="$KEYBIND_NEW_KEY" ;;
        5:unrestored-key) key="$KEYBIND_NEW_KEY" ;;
      esac
      printf '{"data":{"result":{"keys":{"combat":"F5","equipment":"F1","inventory":"%s","prayer":"F3","spellbook":"F2"},"tab":"%s"}}}\n' "$key" "$tab"
      ;;
    saved)
      local key="$KEYBIND_NEW_KEY"
      [[ "$FAULT" != unsaved-key ]] || key="$KEYBIND_DEFAULT_KEY"
      printf '{"data":{"result":"{\\"version\\":1,\\"values\\":{\\"inventory_key\\":\\"%s\\"}}"}}\n' "$key"
      ;;
  esac
}

fake_browser() {
  FINAL_TILE="$1"
  SCREENSHOT="${2:-ok}"
  FAULT="${7:-none}"
  EDGE_TILE="${8:-$EDGE_STOP_TILE}"
  EDGE_HELD_TICK="${9:-16}"
  fixture_logs "${3:-8}" "${4:-$FOCUS_DRILL}" "$FAULT"
  LEAD_IN_FIGHT="${5:-}" PRESENT_FIGHT="${6:-}"
  [[ -n "$LEAD_IN_FIGHT" ]] || LEAD_IN_FIGHT='{"run":{"kind":"running","tick":1},"boss":{"npcId":16677,"visible":false}}'
  [[ -n "$PRESENT_FIGHT" ]] || PRESENT_FIGHT='{"run":{"kind":"running","tick":70},"boss":{"npcId":16677,"visible":true}}'
  ab() {
    case "$*" in
      "--json eval window.__archiveOcellusProbe.snapshot().fight") loadout_snapshot ;;
      "--json eval window.__archiveOcellusProbe.snapshot()")
        local n tile='{"x":5,"y":1}' tick=8 fight="$LEAD_IN_FIGHT"
        n=$(($(cat "$T/evals" 2>/dev/null || echo 0) + 1))
        echo "$n" >"$T/evals"
        [[ "$n" -ne 1 ]] || tick=6
        [[ "$n" -lt 3 ]] || { tile="$FINAL_TILE"; tick=12; fight="$PRESENT_FIGHT"; }
        [[ "$n" -ne 4 ]] || { tile="$EDGE_TILE"; tick=13; }
        [[ "$n" -ne 5 ]] || { tile="$EDGE_TILE"; tick="$EDGE_HELD_TICK"; }
        [[ "$(cat "$T/restarts" 2>/dev/null || echo 0)" -lt 3 ]] || tile='{"x":3,"y":2}'
        printf '{"data":{"result":{"ticking":true,"tick":%s,"player":%s,"destination":%s,"fight":%s}}}\n' "$tick" "$tile" "$tile" "$fight"
        ;;
      "--json eval window.__cueAudio") if [[ -e "$T/special-late" ]]; then cat "$T/special-audio.json"; else cat "$T/explosion-audio.json"; fi ;;
      "--json eval window.__archiveOcellusProbe.snapshot().fight.player.inventory") supply_probe inventory ;;
      "--json eval window.__archiveOcellusProbe.snapshot().menu") supply_probe menu ;;
      "--json eval window.__archiveOcellusProbe.snapshot().fight.run.tick") echo '{"data":{"result":3}}' ;;
      "--json eval window.__archiveOcellusProbe.log().rows.map((row) => [row.tick, row.playerAtPostTick.hp])") supply_probe hp ;;
      "--json eval window.__archiveOcellusProbe.snapshot().panel") supply_probe panel ;;
      "--json eval localStorage.getItem('osrs-sdk:settings')") supply_probe saved ;;
      "--json eval window.__archiveOcellusProbe.log()")
        [[ ! -e "$T/special-late" ]] || { cat "$T/special-late-log.json"; return; }
        [[ ! -e "$T/special" ]] || { cat "$T/special-log.json"; return; }
        [[ ! -e "$T/explosion-under" ]] || { cat "$T/explosion-under-log.json"; return; }
        [[ "$(cat "$T/restarts" 2>/dev/null || echo 0)" -lt 4 ]] || { cat "$T/explosion-log.json"; return; }
        [[ ! -e "$T/orb-skip" ]] || { cat "$T/orb-skip-log.json"; return; }
        case "$(cat "$T/restarts" 2>/dev/null || echo 0)" in
          0) cat "$T/cycle-log.json" ;;
          1) if [[ -e "$T/focus-not-reloaded" ]]; then cat "$T/cycle-log.json"; else cat "$T/focus-log.json"; fi ;;
          2) if [[ -e "$T/void-shot" ]]; then cat "$T/void-shot-log.json"; else cat "$T/void-log.json"; fi ;;
          *) cat "$T/orb-log.json" ;;
        esac
        ;;
      "open "*"focus=${VOID_DRILL}") : >"$T/void-shot" ;;
      "open "*"focus=${ORB_DRILL}") : >"$T/orb-skip" ;;
      "open "*"focus=${EXPLOSION_DRILL}") : >"$T/explosion-under" ;;
      "open "*"${SPECIAL_QUERY}") : >"$T/special" ;;
      "batch --bail")
        local shot
        for shot in $(command node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>JSON.parse(s).filter((c)=>c[0]==="screenshot").forEach((c)=>console.log(c[1])))'); do
          fake_screenshot "$shot" || return 1
        done
        ;;
      "select #focus "*)
        echo $(($(cat "$T/restarts" 2>/dev/null || echo 0) + 1)) >"$T/restarts"
        [[ "$FAULT" != focus-not-reloaded || "$*" != "select #focus ${FOCUS_DRILL}" ]] || : >"$T/focus-not-reloaded"
        ;;
      "click #restart")
        echo $(($(cat "$T/restarts" 2>/dev/null || echo 0) + 1)) >"$T/restarts"
        [[ ! -e "$T/special" ]] || : >"$T/special-late"
        ;;
      "--json get text "*) printf '{"data":{"text":"%s"}}\n' "$CREDIT_LINE" ;;
      "--json is visible "*) echo '{"data":{"visible":true}}' ;;
      "--json get box "*) echo '{"data":{"x":0,"y":0,"width":1280,"height":800}}' ;;
      "--json errors") echo '{"data":{"errors":[]}}' ;;
      "screenshot "*) fake_screenshot "$2" ;;
      console) echo "[info] page loaded" ;;
    esac
  }
}

walk_to_the_documented_tile_passes() {
  setup
  fake_browser '{"x":8,"y":3}'
  drive >"$T/drive.log" 2>&1 || { cat "$T/drive.log"; return 1; }
}

walk_to_a_wrong_tile_fails() {
  setup
  fake_browser '{"x":9,"y":3}'
  if drive >"$T/drive.log" 2>&1; then echo "drive passed with the player on (9,3)"; return 1; fi
}

failed_screenshot_fails() {
  setup
  fake_browser '{"x":8,"y":3}' fail
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although every screenshot exited 1"; return 1; fi
}

missing_screenshot_fails() {
  setup
  fake_browser '{"x":8,"y":3}' empty
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although no screenshot was written"; return 1; fi
}

cycle_off_schedule_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 9
  if drive >"$T/drive.log" 2>&1; then echo "drive passed with the first inner void at P4 tick 9"; return 1; fi
  grep -q '"stagesOnSchedule": false' "$T/drive.log" || { echo "the stage check did not name the failure"; cat "$T/drive.log"; return 1; }
}

focus_not_applied_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 full-fight
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the reloaded drill ignored the focus"; return 1; fi
  grep -q '"focusApplied": false' "$T/drive.log" || { echo "the focus check did not name the failure"; cat "$T/drive.log"; return 1; }
}

focus_choice_not_reloaded_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' focus-not-reloaded
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although choosing the focus left the full fight running until Restart"; return 1; fi
  grep -q '"focusApplied": false' "$T/drive.log" || { echo "the focus check did not name the failure"; cat "$T/drive.log"; return 1; }
}

boss_drawn_in_lead_in_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '{"run":{"kind":"running","tick":1},"boss":{"npcId":16677,"visible":true}}'
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the boss was drawn at P4 tick 1"; return 1; fi
  grep -q '"bossHiddenInLeadIn": false' "$T/drive.log" || { echo "the lead-in check did not name the failure"; cat "$T/drive.log"; return 1; }
}

lead_in_captured_after_the_hidden_ticks_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '{"run":{"kind":"running","tick":4},"boss":{"npcId":16677,"visible":false}}'
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the lead-in capture ran at P4 tick 4"; return 1; fi
  grep -q '"bossHiddenInLeadIn": false' "$T/drive.log" || { echo "the lead-in check did not name the failure"; cat "$T/drive.log"; return 1; }
}

flood_hit_in_the_ring_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' ring-hit
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the floor hit the player in the ring at P4 tick 50"; return 1; fi
  grep -q '"ringSparedInFlood": false' "$T/drive.log" || { echo "the ring check did not name the failure"; cat "$T/drive.log"; return 1; }
}

ranged_shot_never_lands_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' no-ranged-landing
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the arrow fired across the flood never landed"; return 1; fi
  grep -q '"rangedShotLanded": false' "$T/drive.log" || { echo "the landing check did not name the failure"; cat "$T/drive.log"; return 1; }
}

ranged_shot_from_the_ring_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' shot-from-the-ring
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the bow fired only from the ring"; return 1; fi
  grep -q '"rangedShotFromTheFlood": false' "$T/drive.log" || { echo "the launch check did not name the failure"; cat "$T/drive.log"; return 1; }
}

void_not_drawn_fails() {
  setup
  fake_browser '{"x":8,"y":3}' novoid
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although no screenshot showed the void"; return 1; fi
  grep -q '"floodDrawn": false' "$T/drive.log" || { echo "the drawing check did not name the failure"; cat "$T/drive.log"; return 1; }
  grep -q '"innerVoidDrawn": false' "$T/drive.log" || { echo "the inner drawing check did not name the failure"; cat "$T/drive.log"; return 1; }
}

orb_returned_a_tick_late_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' late-orb-return
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the orb returned two ticks after it was ready"; return 1; fi
  grep -q '"orbReturnedTickAfterArrival": false' "$T/drive.log" || { echo "the return check did not name the failure"; cat "$T/drive.log"; return 1; }
}

skipped_orb_without_boss_heal_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' no-boss-heal
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the skipped outer orb never healed the boss"; return 1; fi
  grep -q '"skippedOrbHealsBoss": false' "$T/drive.log" || { echo "the heal check did not name the failure"; cat "$T/drive.log"; return 1; }
}

explosion_dodge_hit_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' dodge-hit
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although a dodge on a mark tick was hit"; return 1; fi
  grep -q '"explosionsDodgedOnMarkTicks": false' "$T/drive.log" || { echo "the dodge check did not name the failure"; cat "$T/drive.log"; return 1; }
}

late_step_spared_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' late-spared
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the step on the impact tick escaped the explosion"; return 1; fi
  grep -q '"lateStepHitOnMarkedTile": false' "$T/drive.log" || { echo "the late-step check did not name the failure"; cat "$T/drive.log"; return 1; }
}

camping_under_boss_spared_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' under-spared
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the marks under the boss never hit"; return 1; fi
  grep -q '"campingUnderBossHit": false' "$T/drive.log" || { echo "the under-boss check did not name the failure"; cat "$T/drive.log"; return 1; }
}

explosion_sound_on_the_impact_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' sound-on-impact
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although 12537 played a tick after each mark"; return 1; fi
  grep -q '"explosionSoundsOnSchedule": false' "$T/drive.log" || { echo "the sound check did not name the failure"; cat "$T/drive.log"; return 1; }
}

explosion_sound_on_a_suspended_context_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' suspended-audio
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although every sound started on a suspended audio context"; return 1; fi
  grep -q '"explosionSoundsOnSchedule": false' "$T/drive.log" || { echo "the sound check did not name the failure"; cat "$T/drive.log"; return 1; }
}

explosion_marker_following_the_player_fails() {
  setup
  fake_browser '{"x":8,"y":3}' markerfollows
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the marker was drawn on the player after the dodge"; return 1; fi
  grep -q '"markerStaysOnCapturedTile": false' "$T/drive.log" || { echo "the marker check did not name the failure"; cat "$T/drive.log"; return 1; }
}

orb_glow_not_drawn_fails() {
  setup
  fake_browser '{"x":8,"y":3}' noorb
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the orb kept its dormant look and the new teal was elsewhere on screen"; return 1; fi
  grep -q '"orbGlowDrawn": false' "$T/drive.log" || { echo "the orb drawing check did not name the failure"; cat "$T/drive.log"; return 1; }
}

void_layers_swapped_fails() {
  setup
  fake_browser '{"x":8,"y":3}' swapped
  if drive >"$T/drive.log" 2>&1; then echo "drive passed with the inner square's share in the flood frames and the flood's in the inner frame"; return 1; fi
  grep -q '"floodDrawn": false' "$T/drive.log" || { echo "the flood check did not name the failure"; cat "$T/drive.log"; return 1; }
  grep -q '"innerVoidDrawn": false' "$T/drive.log" || { echo "the inner check did not name the failure"; cat "$T/drive.log"; return 1; }
}

boss_never_drawn_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '{"run":{"kind":"running","tick":70},"boss":{"npcId":16677,"visible":false}}'
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the boss was never drawn"; return 1; fi
  grep -q '"bossDrawnOncePresent": false' "$T/drive.log" || { echo "the presence check did not name the failure"; cat "$T/drive.log"; return 1; }
}

prayer_before_landing_unprotected_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' unprotected
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the prayer clicked before the landing did not protect"; return 1; fi
  grep -q '"prayerBeforeLandingProtects": false' "$T/drive.log" || { echo "the in-time prayer check did not name the failure"; cat "$T/drive.log"; return 1; }
}

late_click_protected_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' late-protected
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although a prayer clicked after the landing protected"; return 1; fi
  grep -q '"lateClickTakesFullHit": false' "$T/drive.log" || { echo "the late prayer check did not name the failure"; cat "$T/drive.log"; return 1; }
}

tell_off_schedule_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' tell-late
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the vortex was told a tick late"; return 1; fi
  grep -q '"tellsToldOnSchedule": false' "$T/drive.log" || { echo "the tell schedule check did not name the failure"; cat "$T/drive.log"; return 1; }
}

tells_not_drawn_fails() {
  setup
  fake_browser '{"x":8,"y":3}' notell
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although no tell was drawn over the boss"; return 1; fi
  grep -q '"tellsDrawn": false' "$T/drive.log" || { echo "the tell drawing check did not name the failure"; cat "$T/drive.log"; return 1; }
}

tell_centre_white_fails() {
  setup
  fake_browser '{"x":8,"y":3}' whitecentre
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although each tell drew a white centre"; return 1; fi
  grep -q '"tellCentresDark": false' "$T/drive.log" || { echo "the centre check did not name the failure"; cat "$T/drive.log"; return 1; }
}

transition_sounds_before_the_first_click_fail() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' special-unclicked
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the landing and wind-up sounds started on a suspended audio context"; return 1; fi
  grep -q '"landingSoundsOnSchedule": false' "$T/drive.log" || { echo "the landing sound check did not name the failure"; cat "$T/drive.log"; return 1; }
  grep -q '"styleSoundsOnSchedule": false' "$T/drive.log" || { echo "the style sound check did not name the failure"; cat "$T/drive.log"; return 1; }
}

landing_a_tick_late_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' landing-late
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although each landing started as the inner void cleared"; return 1; fi
  grep -q '"landingSoundsOnSchedule": false' "$T/drive.log" || { echo "the landing sound check did not name the failure"; cat "$T/drive.log"; return 1; }
}

ranged_sound_on_the_hit_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' ranged-on-the-hit
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although 12555 played on the ranged hit, not before it"; return 1; fi
  grep -q '"styleSoundsOnSchedule": false' "$T/drive.log" || { echo "the style sound check did not name the failure"; cat "$T/drive.log"; return 1; }
}

loadout_not_switched_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' unswitched
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the inventory clicks changed no gear"; return 1; fi
  grep -q '"switchesWornByClick": false' "$T/drive.log" || { echo "the switch check did not name the failure"; cat "$T/drive.log"; return 1; }
}

division_not_spent_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' unspent
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although Division never fired"; return 1; fi
  grep -q '"divisionSpentHalfTheBar": false' "$T/drive.log" || { echo "the special attack check did not name the failure"; cat "$T/drive.log"; return 1; }
  grep -q '"divisionDrainedBossDefence": false' "$T/drive.log" || { echo "the Defence check did not name the failure"; cat "$T/drive.log"; return 1; }
}

division_extra_drains_fail() {
  local drains
  for drains in three-drains two-drains; do
    setup
    fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' "$drains"
    if drive >"$T/drive.log" 2>&1; then echo "drive passed with ${drains} from seed 1's one damaging glaive"; return 1; fi
    grep -q '"divisionDrainedBossDefence": false' "$T/drive.log" || { echo "the Defence check did not name the ${drains} failure"; cat "$T/drive.log"; return 1; }
  done
}

walk_off_the_edge_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' none '{"x":8,"y":0}'
  if drive >"$T/drive.log" 2>&1; then echo "drive passed with the player on (8,0), off the platform"; return 1; fi
  grep -q '"stoppedAtTheEdge": false' "$T/drive.log" || { echo "the edge check did not name the failure"; cat "$T/drive.log"; return 1; }
}

edge_read_before_the_hold_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' none "$EDGE_STOP_TILE" 14
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the edge stop was read 1 tick after arrival"; return 1; fi
  grep -q '"stoppedAtTheEdge": false' "$T/drive.log" || { echo "the edge check did not name the failure"; cat "$T/drive.log"; return 1; }
}

edge_click_on_the_floor_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' edge-on-floor
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the edge click ordered the floor tile (8,1)"; return 1; fi
  grep -q '"edgeClickOrderedOffThePlatform": false' "$T/drive.log" || { echo "the edge order check did not name the failure"; cat "$T/drive.log"; return 1; }
}

item_names_shown_as_null_fail() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' null-names
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the item menu read Equip null"; return 1; fi
  grep -q '"itemNamedInMenu": false' "$T/drive.log" || { echo "the name check did not name the failure"; cat "$T/drive.log"; return 1; }
}

supplies_missing_fail() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' no-supplies
  if drive >"$T/drive.log" 2>&1; then echo "drive passed with empty supply slots"; return 1; fi
  grep -q '"suppliesCarried": false' "$T/drive.log" || { echo "the supplies check did not name the failure"; cat "$T/drive.log"; return 1; }
}

brew_without_heal_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' no-heal
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the brew left hitpoints at 99"; return 1; fi
  grep -q '"brewHealedNextTick": false' "$T/drive.log" || { echo "the heal check did not name the failure"; cat "$T/drive.log"; return 1; }
}

key_binding_lost_on_reload_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' unsaved-key
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the bound key was not saved"; return 1; fi
  grep -q '"keyBoundAndSaved": false' "$T/drive.log" || { echo "the saved key check did not name the failure"; cat "$T/drive.log"; return 1; }
  grep -q '"boundKeyOpensTabAfterReload": false' "$T/drive.log" || { echo "the reload check did not name the failure"; cat "$T/drive.log"; return 1; }
}

failed_checks() {
  command node -e 'const { checks } = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); console.log(Object.keys(checks).filter((name) => !checks[name]).join(" "))' "$VERIFY_DIR/observed.json"
}

keybinds_button_not_opening_settings_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' keybinds-closed
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the Keybinds button left the inventory open"; return 1; fi
  [[ "$(failed_checks)" == keybindsButtonOpensSettings ]] || { echo "expected only keybindsButtonOpensSettings to fail, got: $(failed_checks)"; return 1; }
}

default_key_not_restored_fails() {
  setup
  fake_browser '{"x":8,"y":3}' ok 8 "$FOCUS_DRILL" '' '' unrestored-key
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the inventory key stayed ${KEYBIND_NEW_KEY}"; return 1; fi
  [[ "$(failed_checks)" == defaultKeyRestored ]] || { echo "expected only defaultKeyRestored to fail, got: $(failed_checks)"; return 1; }
}

failed=0
for t in \
  refused_serve_does_not_stop_the_recorded_instance \
  own_instance_is_stopped \
  interrupt_stops_own_instance \
  interrupt_leaves_the_recorded_instance \
  failed_transfer_fails_doctor \
  walk_to_the_documented_tile_passes \
  walk_to_a_wrong_tile_fails \
  walk_off_the_edge_fails \
  edge_read_before_the_hold_fails \
  edge_click_on_the_floor_fails \
  failed_screenshot_fails \
  missing_screenshot_fails \
  cycle_off_schedule_fails \
  focus_not_applied_fails \
  focus_choice_not_reloaded_fails \
  boss_drawn_in_lead_in_fails \
  lead_in_captured_after_the_hidden_ticks_fails \
  flood_hit_in_the_ring_fails \
  ranged_shot_never_lands_fails \
  ranged_shot_from_the_ring_fails \
  void_not_drawn_fails \
  void_layers_swapped_fails \
  boss_never_drawn_fails \
  orb_returned_a_tick_late_fails \
  skipped_orb_without_boss_heal_fails \
  orb_glow_not_drawn_fails \
  explosion_dodge_hit_fails \
  late_step_spared_fails \
  camping_under_boss_spared_fails \
  explosion_marker_following_the_player_fails \
  explosion_sound_on_the_impact_fails \
  explosion_sound_on_a_suspended_context_fails \
  prayer_before_landing_unprotected_fails \
  late_click_protected_fails \
  tell_off_schedule_fails \
  tells_not_drawn_fails \
  tell_centre_white_fails \
  landing_a_tick_late_fails \
  ranged_sound_on_the_hit_fails \
  transition_sounds_before_the_first_click_fail \
  loadout_not_switched_fails \
  division_not_spent_fails \
  division_extra_drains_fail \
  item_names_shown_as_null_fail \
  supplies_missing_fail \
  brew_without_heal_fails \
  key_binding_lost_on_reload_fails \
  keybinds_button_not_opening_settings_fails \
  default_key_not_restored_fails; do
  if ("$t") >"$WORK/$t.log" 2>&1; then
    echo "PASS $t"
  else
    echo "FAIL $t"
    sed 's/^/  /' "$WORK/$t.log"
    failed=1
  fi
done
exit $failed
