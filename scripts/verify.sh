#!/usr/bin/env bash
set -uo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"

OSRS_CACHE_DIR="${OSRS_CACHE_DIR:-$HOME/osrs-sims/cache/openrs2}"
OSRS_CACHE_READER="${OSRS_CACHE_READER:-$HOME/osrs-sims/osrscachereader}"
VERIFY_PORT="${VERIFY_PORT:-8002}"
VERIFY_DIR="${VERIFY_DIR:-$ROOT/.verify/$(date -u +%Y%m%dT%H%M%SZ)}"
STATE_FILE="$ROOT/.verify/current-server"
MANIFEST="$ROOT/public/osrs-assets/manifest.json"
URL="http://127.0.0.1:${VERIFY_PORT}/"
DRILL_QUERY="?seed=1&specialSelection=replay-v2"
BOSS_NPC=16677
SPAWN_TILE='{"x":5,"y":1}'
WALK_CLICK_LEFT_PX=160
WALK_CLICK_UP_PX=50
WALK_TARGET_TILE='{"x":8,"y":3}'
EDGE_CLICK_DOWN_PX=160
EDGE_ORDER_TILE='{"x":8,"y":0}'
EDGE_STOP_TILE='{"x":8,"y":1}'
EDGE_HOLD_TICKS=3
CYCLE_LAST_HIDDEN_TICK=3
CYCLE_RING_TICK=39
CYCLE_LAST_TICK=70
CYCLE_STAGE_ENTRIES='[[0,"lead-in"],[8,"inner-void"],[30,"after-inner"],[39,"outer-void"],[59,"after-outer"],[68,"inner-void"]]'
CYCLE_OVERHEAD_SWITCHES='[[8,"deflect-melee"],[33,"soul-split"],[39,"deflect-range"],[61,"soul-split"],[68,"deflect-melee"]]'
CYCLE_SPECIAL_HITS='[[37,"vortex"],[65,"spike-disk"]]'
FOCUS_DRILL="transition-attacks"
FOCUS_LAST_TICK=40
FOCUS_BEATS='["boss-landing-starts","boss-shouts","soul-split-heal","special-hit","special-sound","special-tell"]'
LOADOUT_QUERY="?seed=1&setup=ranged"
LOADOUT_RANGED_WORN='{"weapon":20997,"offhand":null,"helmet":11664,"chest":13072,"legs":13073,"gloves":8842,"cape":28951,"necklace":19547,"feet":13237,"ring":28310,"ammo":11212}'
LOADOUT_MELEE_WORN='{"weapon":22325,"offhand":null,"helmet":24419,"chest":24420,"legs":24421,"gloves":22981,"cape":21295,"necklace":19553,"feet":13239,"ring":25485,"ammo":11212}'
LOADOUT_INVENTORY_TAB_X=1164
LOADOUT_INVENTORY_TAB_Y=745
LOADOUT_SLOT_X=1125
LOADOUT_SLOT_Y=508
LOADOUT_SLOT_DX=39
LOADOUT_SLOT_DY=32
LOADOUT_SPECIAL_SLOT=0
LOADOUT_SWITCHES=9
LOADOUT_SPECIAL_ORB_X=1140
LOADOUT_SPECIAL_ORB_Y=157
LOADOUT_BOSS_CLICK_RIGHT_PX=-10
LOADOUT_BOSS_CLICK_DOWN_PX=-160
LOADOUT_DIVISION_DRAIN=37
BOSS_CLICK_RIGHT_PX=150
BOSS_CLICK_UP_PX=150
RING_CLICK_RIGHT_PX=140
RING_CLICK_UP_PX=40
FLOOD_DAMAGE_TICK=44
FLOOD_LAST_TICK=58
FLOOD_RING_SCREENSHOT_TICK=52
NEAR_SQUARE='{"minX":3,"maxX":7,"minY":3,"maxY":7}'
VOID_DRILL="void-floor"
VOID_INNER_SHOT_TICK=12
VOID_FLOOD_SHOT_TICK=45
VOID_FLOOR_HITS='[[44,9],[45,11],[46,10],[47,11],[48,10],[49,9],[50,9],[51,10],[52,9],[53,10],[54,1]]'
VOID_RUN_END='[[54,"death"]]'
VOID_PIXEL="#1e2529"
ORB_DRILL="lifeforce-orb"
ORB_DORMANT_TICK=20
ORB_GLOW_TICK=24
ORB_LAST_TICK=30
ORB_FRAMES=6
ORB_CLICK_RIGHT_PX=110
ORB_CLICK_UP_PX=15
ORB_BOX='{"minX":-60,"maxX":50,"minY":-75,"maxY":5}'
ORB_SKIP_LAST_TICK=63
EXPLOSION_DRILL="explosions"
EXPLOSION_INNER_MARKS="17 19 21 23 25 27"
EXPLOSION_OUTER_MARKS="48 50 52 54 56 58"
EXPLOSION_LAST_TICK=59
EXPLOSION_UNDER_LAST_TICK=29
STEP_CLICK_SIDE_PX=55
STEP_CLICK_DOWN_PX=25
DODGE_CLICK_SIDE_PX=110
UNDER_BOSS_CLICK_UP_PX=120
MARKER_SHOT_DELAY_MS=450
EXPLOSION_PIXEL="#5e317b"
SOUND_SETTINGS_KEY="osrs-sdk:settings"
SOUND_SAMPLES='{"12638":14332,"12537":8820}'
EXPLOSION_SOUNDS='[[14,12638],[17,12537],[19,12537],[21,12537],[23,12537],[25,12537],[27,12537],[45,12638],[48,12537],[50,12537],[52,12537],[54,12537],[56,12537],[58,12537]]'
EXPLOSION_EXPECTED='{"lateHit":{"requested":16,"applied":16,"beforeHp":99,"afterHp":83,"prayer":null},"under":[[18,{"x":5,"y":6},true,"hit",83],[20,{"x":5,"y":6},true,"hit",67],[22,{"x":5,"y":6},true,"hit",51],[24,{"x":5,"y":6},true,"hit",35],[26,{"x":5,"y":6},true,"hit",19],[28,{"x":5,"y":6},true,"hit",3]]}'
SPECIAL_DRILL="transition-attacks"
SPECIAL_QUERY="?seed=1&focus=${SPECIAL_DRILL}&specialSelection=replay-v2"
PROTECT_MAGIC_RIGHT_PX=514
PROTECT_RANGE_RIGHT_PX=551
PROTECT_DOWN_PX=218
SPECIAL_PRAY_TICK=33
SPECIAL_RANGE_PRAY_TICK=61
SPECIAL_HIT_TICK=37
SPECIAL_BEFORE_SHOT_TICK=31
SPECIAL_VORTEX_SHOT_TICK=35
SPECIAL_SPIKE_SHOT_TICK=63
SPECIAL_SEMICIRCLE_SHOT_TICK=93
SPECIAL_BLACK_SHOT_TICK=95
TELL_BOX='{"minX":-200,"maxX":200,"minY":-220,"maxY":-40}'
TELL_CENTRE_BOX='{"minX":-50,"maxX":0,"minY":-110,"maxY":-75}'
TRANSITION_SOUND_SAMPLES='{"12584":19845,"12587":33075,"12586":22050,"12585":22050,"12572":66150,"12567":33075,"12555":33075,"12556":44100,"12554":35280}'
LANDING_SOUNDS='[[29.1,12584],[29.83,12587],[31.03,12586],[31.47,12585],[89.1,12584],[89.83,12587],[91.03,12586],[91.47,12585]]'
LANDING_WINDOWS='[[29,32],[89,92]]'
STYLE_SOUNDS='[[34.2,12554],[64.4,12555],[65.1,12556],[92.1,12572],[97.1,12567]]'
STYLE_WINDOWS='[[32,37.5],[60,65.5],[92,97.5]]'
SOUND_TOLERANCE_TICKS=0.2
SPECIAL_EXPECTED='{"protected":[37,"magic",{"requested":8,"applied":8,"beforeHp":99,"afterHp":91,"prayer":"magic"}],"late":[37,"magic",{"requested":49,"applied":49,"beforeHp":99,"afterHp":50,"prayer":null}],"told":[[32,"vortex","magic"],[60,"spike-disk","ranged"],[92,"black-disk","melee"]]}'
ORB_EXPECTED='{"told":[[11,"inner-void"]],"drained":[[12,49,50]],"spawned":[[13,{"x":3,"y":2},49]],"matured":[[24,{"x":3,"y":2}]],"returned":{"requested":49,"applied":49,"beforeHp":50,"afterHp":99},"skipExpired":[[30,"inner-void"],[61,"outer-void"]],"skipHeal":[[62,{"kind":"unclaimed-orb"},{"requested":25,"applied":25,"beforeHp":1355,"afterHp":1380}]]}'
CREDIT_LINE="Created using intellectual property belonging to Jagex Limited under the terms of Jagex's Fan Content Policy. This content is not endorsed by or affiliated with Jagex."

log() { echo "verify: $*"; }

json() {
  node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{let v=JSON.parse(s);for(const k of process.argv[1].split(".").filter(Boolean))v=v?.[k];process.stdout.write(typeof v==="string"?v:JSON.stringify(v))})' "$1"
}

ensure_deps() {
  if node -e 'require.resolve("osrs-sdk-react"); require.resolve("osrs-sdk-assets/package.json")' 2>/dev/null; then
    return 0
  fi
  log "installing dependencies and the beta SDK"
  if [[ -z "${OSRS_SDK_PACKS:-}" && -d "$HOME/osrs-sims/packs" ]]; then
    export OSRS_SDK_PACKS="$HOME/osrs-sims/packs"
  fi
  npm ci --no-audit --no-fund && scripts/install-beta-sdk.sh
}

manifest_ready() {
  [[ -f "$MANIFEST" ]] && node --input-type=module -e '
    import { loadConfig } from "osrs-sdk-assets";
    import { existsSync, readFileSync } from "node:fs";
    import { dirname, join } from "node:path";
    const { assets } = await loadConfig();
    const m = JSON.parse(readFileSync(process.argv[1], "utf8"));
    const items = Object.values(assets.items).every(({ id }) => m.playerItems?.[`item:${id}`]);
    const spotAnims = Object.values(assets.spotAnims).every(({ id }) => m.spotAnims?.[id]);
    const pack = m.soundEffects && join(dirname(process.argv[1]), m.soundEffects.file);
    const bytes = pack && existsSync(pack) ? readFileSync(pack) : Buffer.alloc(6);
    const packed = new Set();
    for (let at = 6, n = 0; n < bytes.readUInt16BE(4); n++, at += 4 + bytes.readUInt16BE(at + 2)) packed.add(bytes.readUInt16BE(at));
    const sounds = Object.values(assets.sounds).every(({ id }) => packed.has(id));
    process.exit(m.cache?.source === "openrs2:2746" && m.assets?.[`npc-${process.argv[2]}`] && items && spotAnims && sounds ? 0 : 1);
  ' "$MANIFEST" "$BOSS_NPC"
}

stage_build() {
  npm run build >"$VERIFY_DIR/build.log" 2>&1
}

stage_types() {
  npm run typecheck >"$VERIFY_DIR/types.log" 2>&1
}

stage_test() {
  npm test -- --runInBand --json --outputFile="$VERIFY_DIR/jest.json" >"$VERIFY_DIR/test.log" 2>&1 || return 1
  local total
  total="$(json numPassedTests <"$VERIFY_DIR/jest.json")"
  log "jest passed ${total} tests"
  [[ "$total" -gt 0 ]]
}

stage_assets() {
  if manifest_ready; then
    log "assets: manifest already has npc-${BOSS_NPC} and every configured item, spotanim and sound from openrs2:2746, skipping rebuild" | tee "$VERIFY_DIR/assets.log"
    return 0
  fi
  npm run assets -- --cache-dir "$OSRS_CACHE_DIR" --reader-path "$OSRS_CACHE_READER" >"$VERIFY_DIR/assets.log" 2>&1 && manifest_ready
}

port_listener() {
  lsof -nP -iTCP:"$VERIFY_PORT" -sTCP:LISTEN -t 2>/dev/null
}

process_start() {
  ps -p "$1" -o lstart= 2>/dev/null
}

serve() {
  case "$VERIFY_PORT" in 8000 | 8001)
    log "port ${VERIFY_PORT} belongs to another trainer; refusing to use it"
    return 1
    ;;
  esac
  if [[ -f "$STATE_FILE" ]]; then
    log "an instance is already recorded in ${STATE_FILE}; run scripts/verify.sh stop first"
    return 1
  fi
  if [[ -n "$(port_listener)" ]]; then
    log "port ${VERIFY_PORT} is already in use by PID $(port_listener); not starting a second instance"
    return 1
  fi
  manifest_ready || { log "assets missing: run scripts/verify.sh assets"; return 1; }

  node node_modules/.bin/webpack serve --mode development --host 127.0.0.1 --port "$VERIFY_PORT" \
    >"$VERIFY_DIR/server.log" 2>&1 &
  local pid=$!
  LAUNCHED_PID=$pid
  printf 'pid=%s\nstarted=%s\nport=%s\nevidence=%s\nrevision=%s\n' \
    "$pid" "$(process_start "$pid")" "$VERIFY_PORT" "$VERIFY_DIR" "$(git rev-parse HEAD)" >"$STATE_FILE"
  cp "$STATE_FILE" "$VERIFY_DIR/server.pid"
  log "started dev server PID ${pid} on ${URL}"

  for _ in $(seq 1 120); do
    if curl -sf -o /dev/null "$URL" && grep -q "compiled successfully" "$VERIFY_DIR/server.log"; then
      return 0
    fi
    kill -0 "$pid" 2>/dev/null || { log "dev server exited; see ${VERIFY_DIR}/server.log"; return 1; }
    sleep 1
  done
  log "dev server did not become ready within 120s"
  return 1
}

state() {
  sed -n "s/^$1=//p" "$STATE_FILE"
}

doctor() {
  [[ -f "$STATE_FILE" ]] || { log "doctor: no recorded instance"; return 1; }
  local pid problems=0
  pid="$(state pid)"
  if [[ "$(process_start "$pid")" != "$(state started)" ]]; then
    log "doctor: recorded PID ${pid} is not running (or the PID was reused)"
    problems=1
  fi
  if [[ "$(port_listener)" != "$pid" ]]; then
    log "doctor: port $(state port) is held by '$(port_listener)', not the recorded PID ${pid}"
    problems=1
  fi
  if ! curl -sf "http://127.0.0.1:$(state port)/" | grep -q "<title>Archive Ocellus Trainer</title>"; then
    log "doctor: page title is not Archive Ocellus Trainer"
    problems=1
  fi
  if ! curl -sf "http://127.0.0.1:$(state port)/osrs-assets/manifest.json" | grep -q "\"npc-${BOSS_NPC}\""; then
    log "doctor: served manifest has no npc-${BOSS_NPC}"
    problems=1
  fi
  if [[ "$(state revision)" != "$(git rev-parse HEAD)" ]] || [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    log "doctor: served tree differs from HEAD $(git rev-parse --short HEAD) (started at $(state revision), or tracked files are modified)"
  fi
  [[ $problems -eq 0 ]] && log "doctor: instance PID ${pid} on port $(state port) is healthy"
  return $problems
}

stop() {
  [[ -f "$STATE_FILE" ]] || { log "stop: no recorded instance"; return 0; }
  local pid evidence port
  pid="$(state pid)"
  evidence="$(state evidence)"
  port="$(state port)"
  if [[ "$(process_start "$pid")" == "$(state started)" ]]; then
    kill "$pid"
    for _ in $(seq 1 20); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done
  fi
  if kill -0 "$pid" 2>/dev/null && [[ "$(process_start "$pid")" == "$(state started)" ]]; then
    log "stop: PID ${pid} is still running"
    return 1
  fi
  rm "$STATE_FILE"
  log "stop: PID ${pid} is gone; evidence kept in ${evidence}" | tee -a "$evidence/cleanup.log"
  [[ -z "$(VERIFY_PORT=$port port_listener)" ]] || { log "stop: port ${port} is still held by $(VERIFY_PORT=$port port_listener)"; return 1; }
}

ab() {
  agent-browser --session "$BROWSER_SESSION" "$@"
}

probe() {
  ab --json eval "window.__archiveOcellusProbe.$1" | json data.result
}

fight_tick_at_least() {
  ab wait --fn "(window.__archiveOcellusProbe?.snapshot().fight?.run.tick ?? -1) >= $1" --timeout "$2" >/dev/null
}

canvas_centre() {
  local box
  box="$(ab --json get box "#world")" || return 1
  CX=$(( $(json data.x <<<"$box") + $(json data.width <<<"$box") / 2 ))
  CY=$(( $(json data.y <<<"$box") + $(json data.height <<<"$box") / 2 ))
}

click_after_tick() {
  printf '[["wait","--fn","(window.__archiveOcellusProbe?.snapshot().fight?.run.tick ?? -1) >= %d","--timeout","90000"],["mouse","move","%d","%d"],["mouse","down","left"],["mouse","up","left"]]' \
    "$1" $((CX + $2)) $((CY + $3)) | ab batch --bail >/dev/null
}

shot_after_tick() {
  printf '[["wait","--fn","(window.__archiveOcellusProbe?.snapshot().fight?.run.tick ?? -1) >= %d","--timeout","30000"],["wait","%d"],["screenshot","%s"]]' \
    "$1" "$2" "$VERIFY_DIR/$3" | ab batch --bail >/dev/null
}

save_sound_settings() {
  ab eval "(() => { const key = '${SOUND_SETTINGS_KEY}', saved = JSON.parse(localStorage.getItem(key) ?? '{\"version\":1,\"values\":{}}'); saved.values = { ...saved.values, playsAudio: $1, playsAreaAudio: $1 }; localStorage.setItem(key, JSON.stringify(saved)); })()" >/dev/null
}

record_audio_starts() {
  ab eval '(() => {
    const starts = [], seen = {}, start = AudioBufferSourceNode.prototype.start;
    const tick = () => {
      const run = window.__archiveOcellusProbe?.snapshot().fight?.run;
      const t = run?.kind === "running" ? run.tick : run?.kind === "ended" ? run.at : null;
      if (t !== null && seen[t] === undefined) seen[t] = performance.now();
      return t;
    };
    const watch = () => { tick(); requestAnimationFrame(watch); };
    watch();
    window.__cueAudio = starts;
    AudioBufferSourceNode.prototype.start = function (...args) {
      const t = tick();
      starts.push({ tick: t, phase: t === null ? null : Math.round((performance.now() - seen[t]) / 6) / 100, samples: this.buffer?.length ?? null, rate: this.buffer?.sampleRate ?? null, state: this.context.state });
      return start.apply(this, args);
    };
  })()' >/dev/null
}

step_on_marks() {
  local side="$1" mark
  shift
  for mark in "$@"; do
    click_after_tick $((mark - 1)) "$side" "$STEP_CLICK_DOWN_PX" || return 1
    side=$((-side))
  done
}

# The camera trails the player by about a tick, so side steps two ticks apart drift; a click past the north edge always stops on row 1.
step_south_and_back_on_marks() {
  local north=0 mark
  for mark in "$@"; do
    click_after_tick $((mark - 1)) 0 $((north * EDGE_CLICK_DOWN_PX)) || return 1
    north=$((1 - north))
  done
}

drive_walk() {
  local before after box cx cy credit
  before="$(probe "snapshot()")"
  echo "$before" >"$VERIFY_DIR/before.json"
  ab screenshot "$VERIFY_DIR/before.png" >/dev/null || { log "before screenshot failed"; return 1; }

  credit="$(ab --json get text "#credit_line" | json data.text)"
  [[ "$credit" == "$CREDIT_LINE" ]] || { log "credit line text differs: ${credit}"; return 1; }
  [[ "$(ab --json is visible "#credit_line" | json data.visible)" == "true" ]] || { log "credit line is not visible"; return 1; }

  box="$(ab --json get box "#world")"
  cx=$(( $(json data.x <<<"$box") + $(json data.width <<<"$box") / 2 - WALK_CLICK_LEFT_PX ))
  cy=$(( $(json data.y <<<"$box") + $(json data.height <<<"$box") / 2 - WALK_CLICK_UP_PX ))
  echo "{\"x\":${cx},\"y\":${cy}}" >"$VERIFY_DIR/click.json"
  ab mouse move "$cx" "$cy" >/dev/null && ab mouse down left >/dev/null && ab mouse up left >/dev/null || return 1

  ab wait --fn "(() => { const s = window.__archiveOcellusProbe.snapshot(), spawn = ${SPAWN_TILE}; return (s.player.x !== spawn.x || s.player.y !== spawn.y) && s.player.x === s.destination.x && s.player.y === s.destination.y; })()" \
    --timeout 15000 >/dev/null || log "player did not settle on a new tile after the click"
  after="$(probe "snapshot()")"
  echo "$after" >"$VERIFY_DIR/after.json"
  ab wait 1200 >/dev/null
  ab screenshot "$VERIFY_DIR/after.png" >/dev/null || { log "after screenshot failed"; return 1; }
}

click_past_the_edge() {
  canvas_centre || return 1
  click_at "$CX" $((CY + EDGE_CLICK_DOWN_PX)) || return 1
  ab wait --fn "(() => { const s = window.__archiveOcellusProbe.snapshot(), stop = ${EDGE_STOP_TILE}; return s.player.x === stop.x && s.player.y === stop.y; })()" \
    --timeout 15000 >/dev/null || log "player never stopped on the edge tile"
}

drive_edge() {
  local arrived
  click_past_the_edge || return 1
  echo "{\"x\":${CX},\"y\":$((CY + EDGE_CLICK_DOWN_PX))}" >"$VERIFY_DIR/edge-click.json"
  arrived="$(probe "snapshot()")"
  echo "$arrived" >"$VERIFY_DIR/edge-arrived.json"
  ab wait --fn "window.__archiveOcellusProbe.snapshot().tick >= $(json tick <<<"$arrived") + ${EDGE_HOLD_TICKS}" --timeout 15000 >/dev/null
  probe "snapshot()" >"$VERIFY_DIR/edge.json"
  ab screenshot "$VERIFY_DIR/edge.png" >/dev/null || { log "edge screenshot failed"; return 1; }
}

drive_lead_in() {
  fight_tick_at_least 0 90000 || { log "the boss never took its first P4 step"; return 1; }
  ab screenshot "$VERIFY_DIR/hidden.png" >/dev/null || { log "lead-in screenshot failed"; return 1; }
  probe "snapshot()" >"$VERIFY_DIR/hidden.json"
}

drive_flood_shot() {
  local box cx cy
  fight_tick_at_least "$FLOOD_DAMAGE_TICK" 90000 || { log "the flood never reached P4 tick ${FLOOD_DAMAGE_TICK}"; return 1; }
  box="$(ab --json get box "#world")"
  cx=$(( $(json data.x <<<"$box") + $(json data.width <<<"$box") / 2 ))
  cy=$(( $(json data.y <<<"$box") + $(json data.height <<<"$box") / 2 ))
  echo "{\"x\":$((cx + BOSS_CLICK_RIGHT_PX)),\"y\":$((cy - BOSS_CLICK_UP_PX))}" >"$VERIFY_DIR/attack-click.json"
  click_at $((cx + BOSS_CLICK_RIGHT_PX)) $((cy - BOSS_CLICK_UP_PX)) || return 1
  ab wait --fn "window.__archiveOcellusProbe.log().rows.some((row) => row.tick >= ${FLOOD_DAMAGE_TICK} && row.combatDraws > 0)" \
    --timeout 15000 >/dev/null || log "the bow never fired across the flood"
  echo "{\"x\":$((cx + RING_CLICK_RIGHT_PX)),\"y\":$((cy - RING_CLICK_UP_PX))}" >"$VERIFY_DIR/ring-click.json"
  click_at $((cx + RING_CLICK_RIGHT_PX)) $((cy - RING_CLICK_UP_PX)) || return 1
  fight_tick_at_least "$FLOOD_RING_SCREENSHOT_TICK" 30000 || { log "the boss never stepped to P4 tick ${FLOOD_RING_SCREENSHOT_TICK}"; return 1; }
  ab screenshot "$VERIFY_DIR/flood-ring.png" >/dev/null || { log "flood screenshot failed"; return 1; }
}

drive_cycle() {
  local cx cy
  fight_tick_at_least 12 30000 || { log "the boss never stepped to P4 tick 12"; return 1; }
  ab screenshot "$VERIFY_DIR/boss.png" >/dev/null || { log "boss screenshot failed"; return 1; }
  canvas_centre || { log "canvas box unreadable"; return 1; }
  step_south_and_back_on_marks $EXPLOSION_INNER_MARKS || { log "the steps on the inner explosion marks were not clicked"; return 1; }
  click_after_tick "$SPECIAL_PRAY_TICK" "$PROTECT_MAGIC_RIGHT_PX" "$PROTECT_DOWN_PX" || { log "Protect from Magic was not clicked before the vortex"; return 1; }
  fight_tick_at_least "$CYCLE_RING_TICK" 60000 || { log "the boss never stepped to P4 tick ${CYCLE_RING_TICK}"; return 1; }
  cx=$((CX + RING_CLICK_RIGHT_PX))
  cy=$((CY - RING_CLICK_UP_PX))
  echo "{\"x\":${cx},\"y\":${cy}}" >"$VERIFY_DIR/cycle-ring-click.json"
  click_at "$cx" "$cy" || return 1
  step_on_marks "$STEP_CLICK_SIDE_PX" $EXPLOSION_OUTER_MARKS || { log "the steps on the outer explosion marks were not clicked"; return 1; }
  click_after_tick "$SPECIAL_RANGE_PRAY_TICK" "$PROTECT_RANGE_RIGHT_PX" "$PROTECT_DOWN_PX" || { log "Protect from Range was not clicked before the spike disk"; return 1; }
  fight_tick_at_least "$CYCLE_LAST_TICK" 90000 || { log "the boss never stepped to P4 tick ${CYCLE_LAST_TICK}"; return 1; }
  probe "snapshot()" >"$VERIFY_DIR/cycle-snapshot.json"
  probe "log()" >"$VERIFY_DIR/cycle.json"
  ab console >"$VERIFY_DIR/console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/page-errors.json" || { log "page error capture failed"; return 1; }
}

choose_focus() {
  ab select "#focus" "$1" >/dev/null || { log "focus control did not accept $1"; return 1; }
  ab wait --fn "new URLSearchParams(location.search).get('focus') === '$1'" --timeout 30000 >/dev/null || { log "choosing $1 did not load focus=$1 without Restart"; return 1; }
}

drive_focus() {
  choose_focus "$FOCUS_DRILL" || return 1
  fight_tick_at_least "$FOCUS_LAST_TICK" 120000 || { log "the reloaded boss never stepped to P4 tick ${FOCUS_LAST_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/focus.json"
  ab screenshot "$VERIFY_DIR/focus.png" >/dev/null || { log "focus screenshot failed"; return 1; }
  ab console >"$VERIFY_DIR/focus-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/focus-page-errors.json" || { log "page error capture failed"; return 1; }
}

drive_void_shot() {
  local box
  ab open "${URL}?seed=1&focus=${VOID_DRILL}" >/dev/null || return 1
  ab wait --fn "window.__archiveOcellusProbe?.snapshot().ticking === true && window.__archiveOcellusProbe.snapshot().tick >= 8" \
    --timeout 90000 >/dev/null || { log "the reloaded ${VOID_DRILL} drill never started ticking"; return 1; }
  box="$(ab --json get box "#world")"
  click_at $(( $(json data.x <<<"$box") + $(json data.width <<<"$box") / 2 - WALK_CLICK_LEFT_PX )) \
    $(( $(json data.y <<<"$box") + $(json data.height <<<"$box") / 2 - WALK_CLICK_UP_PX )) || return 1
  ab wait --fn "(() => { const p = window.__archiveOcellusProbe.snapshot().player, t = ${WALK_TARGET_TILE}; return p.x === t.x && p.y === t.y; })()" \
    --timeout 15000 >/dev/null || log "the player did not reach the walk target on the reloaded drill"
  ab wait 1200 >/dev/null
  click_past_the_edge || return 1
  drive_flood_shot || return 1
  fight_tick_at_least "$FLOOD_LAST_TICK" 30000 || { log "the reloaded drill never stepped to P4 tick ${FLOOD_LAST_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/void-shot.json"
  ab console >"$VERIFY_DIR/void-shot-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/void-shot-page-errors.json" || { log "page error capture failed"; return 1; }
}

click_at() {
  ab mouse move "$1" "$2" >/dev/null && ab mouse down left >/dev/null && ab mouse up left >/dev/null
}

click_inventory_slot() {
  click_at $((LOADOUT_SLOT_X + $1 % 4 * LOADOUT_SLOT_DX)) $((LOADOUT_SLOT_Y + $1 / 4 * LOADOUT_SLOT_DY))
}

drive_loadouts() {
  local slot box
  ab open "${URL}${LOADOUT_QUERY}" >/dev/null || return 1
  fight_tick_at_least 9 120000 || { log "the loadout drill never stepped to P4 tick 9"; return 1; }
  probe "snapshot().fight" >"$VERIFY_DIR/loadout-before.json"
  click_at "$LOADOUT_INVENTORY_TAB_X" "$LOADOUT_INVENTORY_TAB_Y" || return 1
  ab wait 600 >/dev/null
  ab screenshot "$VERIFY_DIR/loadout-ranged.png" >/dev/null || { log "ranged setup screenshot failed"; return 1; }

  for slot in $(seq $((LOADOUT_SPECIAL_SLOT + 1)) "$LOADOUT_SWITCHES"); do
    click_inventory_slot "$slot" || return 1
    ab wait 150 >/dev/null
  done
  ab wait 1200 >/dev/null
  probe "snapshot().fight" >"$VERIFY_DIR/loadout-after.json"
  ab screenshot "$VERIFY_DIR/loadout-melee.png" >/dev/null || { log "switched setup screenshot failed"; return 1; }

  click_inventory_slot "$LOADOUT_SPECIAL_SLOT" || return 1
  ab wait 700 >/dev/null
  click_at "$LOADOUT_SPECIAL_ORB_X" "$LOADOUT_SPECIAL_ORB_Y" || return 1
  box="$(ab --json get box "#world")"
  click_at $(( $(json data.x <<<"$box") + $(json data.width <<<"$box") / 2 + LOADOUT_BOSS_CLICK_RIGHT_PX )) \
    $(( $(json data.y <<<"$box") + $(json data.height <<<"$box") / 2 + LOADOUT_BOSS_CLICK_DOWN_PX )) || return 1
  ab wait --fn "window.__archiveOcellusProbe.snapshot().fight.player.specialEnergy < 100" --timeout 15000 >/dev/null || log "the special attack was not spent"
  ab wait --fn "window.__archiveOcellusProbe.log().rows.flatMap((row) => row.events).filter((event) => event.kind === 'player-hit-judged').length >= 2" \
    --timeout 15000 >/dev/null || log "the glaives never landed"
  probe "snapshot().fight" >"$VERIFY_DIR/loadout-spec.json"
  ab wait 1200 >/dev/null
  ab screenshot "$VERIFY_DIR/loadout-spec.png" >/dev/null || { log "special attack screenshot failed"; return 1; }
  ab console >"$VERIFY_DIR/loadout-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/loadout-page-errors.json" || { log "page error capture failed"; return 1; }

  ab select "#setup" melee >/dev/null && ab click "#restart" >/dev/null || { log "setup control did not accept melee"; return 1; }
  ab wait --fn "new URLSearchParams(location.search).get('setup') === 'melee'" --timeout 30000 >/dev/null || { log "restart did not load setup=melee"; return 1; }
  fight_tick_at_least 1 120000 || { log "the reloaded melee drill never stepped to P4 tick 1"; return 1; }
  probe "snapshot().fight" >"$VERIFY_DIR/loadout-selector.json"
  ab --json errors | json data.errors >"$VERIFY_DIR/loadout-selector-page-errors.json" || { log "page error capture failed"; return 1; }
}

drive_void_floor() {
  choose_focus "$VOID_DRILL" || return 1
  fight_tick_at_least "$VOID_INNER_SHOT_TICK" 120000 || { log "the reloaded boss never stepped to P4 tick ${VOID_INNER_SHOT_TICK}"; return 1; }
  ab screenshot "$VERIFY_DIR/void-inner.png" >/dev/null || { log "inner void screenshot failed"; return 1; }
  fight_tick_at_least "$VOID_FLOOD_SHOT_TICK" 60000 || { log "the reloaded boss never stepped to P4 tick ${VOID_FLOOD_SHOT_TICK}"; return 1; }
  ab screenshot "$VERIFY_DIR/void-flood.png" >/dev/null || { log "flood screenshot failed"; return 1; }
  ab wait --fn "window.__archiveOcellusProbe.snapshot().fight?.run.kind === 'ended'" --timeout 60000 >/dev/null || { log "the player standing on the flood never died"; return 1; }
  probe "log()" >"$VERIFY_DIR/void-floor.json"
  ab console >"$VERIFY_DIR/void-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/void-page-errors.json" || { log "page error capture failed"; return 1; }
}

drive_lifeforce_orb() {
  local box ox oy frame
  choose_focus "$ORB_DRILL" || return 1
  fight_tick_at_least 12 120000 || { log "the orb drill never reached the lifeforce hit"; return 1; }
  ab screenshot "$VERIFY_DIR/orb-hit.png" >/dev/null || { log "lifeforce hit screenshot failed"; return 1; }
  box="$(ab --json get box "#world")"
  ox=$(( $(json data.x <<<"$box") + $(json data.width <<<"$box") / 2 + ORB_CLICK_RIGHT_PX ))
  oy=$(( $(json data.y <<<"$box") + $(json data.height <<<"$box") / 2 - ORB_CLICK_UP_PX ))
  # The orb's teal pulses within a tick, so each look is a burst of frames. The player stays on spawn until the glow burst, because on the orb it hides the glow.
  fight_tick_at_least "$ORB_DORMANT_TICK" 30000 || { log "the boss never stepped to P4 tick ${ORB_DORMANT_TICK}"; return 1; }
  for frame in $(seq 1 "$ORB_FRAMES"); do
    ab screenshot "$VERIFY_DIR/orb-dormant-${frame}.png" >/dev/null || { log "dormant orb screenshot failed"; return 1; }
  done
  fight_tick_at_least "$ORB_GLOW_TICK" 30000 || { log "the boss never stepped to P4 tick ${ORB_GLOW_TICK}"; return 1; }
  for frame in $(seq 1 "$ORB_FRAMES"); do
    ab screenshot "$VERIFY_DIR/orb-glow-${frame}.png" >/dev/null || { log "glowing orb screenshot failed"; return 1; }
  done
  click_at "$ox" "$oy" || return 1
  ab wait --fn "(() => { const d = window.__archiveOcellusProbe.snapshot().destination, spawn = ${SPAWN_TILE}; return d !== null && (d.x !== spawn.x || d.y !== spawn.y); })()" \
    --timeout 5000 >/dev/null || log "the orb click set no new destination"
  echo "{\"x\":${ox},\"y\":${oy},\"snapshot\":$(probe "snapshot()")}" >"$VERIFY_DIR/orb-click.json"
  fight_tick_at_least "$ORB_LAST_TICK" 30000 || { log "the boss never stepped to P4 tick ${ORB_LAST_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/orb.json"
  ab console >"$VERIFY_DIR/orb-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/orb-page-errors.json" || { log "page error capture failed"; return 1; }

  ab open "${URL}?seed=1&focus=${ORB_DRILL}" >/dev/null || return 1
  fight_tick_at_least "$ORB_SKIP_LAST_TICK" 120000 || { log "the orb-skipping drill never stepped to P4 tick ${ORB_SKIP_LAST_TICK}"; return 1; }
  ab screenshot "$VERIFY_DIR/orb-skip.png" >/dev/null || { log "skipped orb screenshot failed"; return 1; }
  probe "log()" >"$VERIFY_DIR/orb-skip.json"
  ab console >"$VERIFY_DIR/orb-skip-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/orb-skip-page-errors.json" || { log "page error capture failed"; return 1; }
}

drive_explosions() {
  local inner=($EXPLOSION_INNER_MARKS) outer=($EXPLOSION_OUTER_MARKS)
  save_sound_settings true || { log "the sound settings were not saved"; return 1; }
  choose_focus "$EXPLOSION_DRILL" || return 1
  fight_tick_at_least 0 120000 || { log "the explosions drill never started"; return 1; }
  record_audio_starts || { log "the audio probe was not installed"; return 1; }
  canvas_centre || { log "canvas box unreadable"; return 1; }
  click_after_tick $((inner[0] - 1)) "$DODGE_CLICK_SIDE_PX" "$STEP_CLICK_DOWN_PX" || { log "the first dodge was not clicked"; return 1; }
  shot_after_tick "${inner[0]}" "$MARKER_SHOT_DELAY_MS" explosion-left.png || { log "left marker screenshot failed"; return 1; }
  step_on_marks "-$DODGE_CLICK_SIDE_PX" "${inner[@]:1}" || { log "the other dodges were not clicked"; return 1; }
  printf '[["wait","--fn","(window.__archiveOcellusProbe?.snapshot().fight?.run.tick ?? -1) >= %d","--timeout","60000"],["mouse","move","%d","%d"],["mouse","down","left"],["mouse","up","left"],["wait","200"],["screenshot","%s"]]' \
    "${outer[0]}" $((CX + DODGE_CLICK_SIDE_PX)) $((CY + STEP_CLICK_DOWN_PX)) "$VERIFY_DIR/explosion-standing.png" | ab batch --bail >/dev/null || { log "the late step was not clicked"; return 1; }
  fight_tick_at_least "$EXPLOSION_LAST_TICK" 30000 || { log "the explosions drill never stepped to P4 tick ${EXPLOSION_LAST_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/explosions.json"
  ab --json eval "window.__cueAudio" | json data.result >"$VERIFY_DIR/explosion-audio.json" || { log "audio capture failed"; return 1; }
  ab console >"$VERIFY_DIR/explosion-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/explosion-page-errors.json" || { log "page error capture failed"; return 1; }
  save_sound_settings false || { log "the sound settings were not restored"; return 1; }

  ab open "${URL}?seed=1&focus=${EXPLOSION_DRILL}" >/dev/null || return 1
  canvas_centre || { log "canvas box unreadable"; return 1; }
  click_after_tick 0 0 "-$UNDER_BOSS_CLICK_UP_PX" || { log "the walk under the hidden boss was not clicked"; return 1; }
  shot_after_tick "${inner[0]}" "$MARKER_SHOT_DELAY_MS" explosion-under.png || { log "under-boss screenshot failed"; return 1; }
  fight_tick_at_least "$EXPLOSION_UNDER_LAST_TICK" 30000 || { log "the camping drill never stepped to P4 tick ${EXPLOSION_UNDER_LAST_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/explosions-under.json"
  ab console >"$VERIFY_DIR/explosion-under-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/explosion-under-page-errors.json" || { log "page error capture failed"; return 1; }
}

drive_transition_attack() {
  ab open "${URL}${SPECIAL_QUERY}" >/dev/null || return 1
  canvas_centre || { log "canvas box unreadable"; return 1; }
  shot_after_tick "$SPECIAL_BEFORE_SHOT_TICK" 0 special-before.png || { log "pre-tell screenshot failed"; return 1; }
  click_after_tick "$SPECIAL_PRAY_TICK" "$PROTECT_MAGIC_RIGHT_PX" "$PROTECT_DOWN_PX" || { log "Protect from Magic was not clicked before the landing"; return 1; }
  shot_after_tick "$SPECIAL_VORTEX_SHOT_TICK" 0 special-vortex.png || { log "vortex screenshot failed"; return 1; }
  fight_tick_at_least $((SPECIAL_HIT_TICK + 1)) 30000 || { log "the transition drill never stepped past the landing at P4 tick ${SPECIAL_HIT_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/special.json"
  ab console >"$VERIFY_DIR/special-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/special-page-errors.json" || { log "page error capture failed"; return 1; }

  save_sound_settings true || { log "the sound settings were not saved"; return 1; }
  ab click "#restart" >/dev/null || { log "Restart was not clicked"; return 1; }
  ab wait --fn "new URLSearchParams(location.search).has('setup')" --timeout 30000 >/dev/null || { log "Restart did not reload the transition drill"; return 1; }
  fight_tick_at_least 0 120000 || { log "the late-prayer drill never started"; return 1; }
  record_audio_starts || { log "the audio probe was not installed"; return 1; }
  click_after_tick "$SPECIAL_HIT_TICK" "$PROTECT_MAGIC_RIGHT_PX" "$PROTECT_DOWN_PX" || { log "the late Protect from Magic was not clicked"; return 1; }
  shot_after_tick "$SPECIAL_SPIKE_SHOT_TICK" 0 special-spike-disk.png || { log "spike disk screenshot failed"; return 1; }
  shot_after_tick "$SPECIAL_SEMICIRCLE_SHOT_TICK" 0 special-semicircle.png || { log "semicircle screenshot failed"; return 1; }
  shot_after_tick "$SPECIAL_BLACK_SHOT_TICK" 0 special-black-disk.png || { log "black disk screenshot failed"; return 1; }
  ab wait --fn "window.__archiveOcellusProbe.snapshot().fight?.run.kind === 'ended'" --timeout 60000 >/dev/null || { log "the player who prayed late never died"; return 1; }
  ab wait 1000 >/dev/null
  probe "log()" >"$VERIFY_DIR/special-late.json"
  ab --json eval "window.__cueAudio" | json data.result >"$VERIFY_DIR/special-audio.json" || { log "audio capture failed"; return 1; }
  ab console >"$VERIFY_DIR/special-late-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/special-late-page-errors.json" || { log "page error capture failed"; return 1; }
  save_sound_settings false || { log "the sound settings were not restored"; return 1; }
}

drive() {
  ab set viewport 1280 800 >/dev/null || return 1
  # A new browser's first screenshot takes about 10 s, longer than the hidden lead-in, so it goes to a blank page.
  ab open about:blank >/dev/null && ab screenshot "$VERIFY_DIR/warm-up.png" >/dev/null || { log "warm-up screenshot failed"; return 1; }
  ab open "${URL}${DRILL_QUERY}" >/dev/null || return 1
  drive_lead_in || return 1
  ab wait --fn "window.__archiveOcellusProbe?.snapshot().ticking === true && window.__archiveOcellusProbe.snapshot().tick >= 8" \
    --timeout 90000 >/dev/null || { log "trainer never started ticking"; return 1; }
  drive_walk && drive_edge && drive_cycle && drive_focus && drive_void_floor && drive_void_shot && drive_lifeforce_orb && drive_explosions && drive_transition_attack && drive_loadouts || return 1

  local capture
  for capture in hidden.json hidden.png before.json before.png after.json after.png edge-click.json edge-arrived.json edge.json edge.png boss.png cycle-ring-click.json cycle-snapshot.json cycle.json console.log page-errors.json focus.json focus.png focus-console.log focus-page-errors.json \
    void-inner.png void-flood.png void-floor.json void-console.log void-page-errors.json \
    attack-click.json ring-click.json flood-ring.png void-shot.json void-shot-console.log void-shot-page-errors.json \
    orb-hit.png $(seq -f "orb-dormant-%g.png" 1 "$ORB_FRAMES") $(seq -f "orb-glow-%g.png" 1 "$ORB_FRAMES") orb-click.json orb.json orb-console.log orb-page-errors.json orb-skip.png orb-skip.json orb-skip-console.log orb-skip-page-errors.json \
    explosion-left.png explosion-standing.png explosions.json explosion-audio.json explosion-console.log explosion-page-errors.json explosion-under.png explosions-under.json explosion-under-console.log explosion-under-page-errors.json \
    special-before.png special-vortex.png special-spike-disk.png special-semicircle.png special-black-disk.png special.json special-console.log special-page-errors.json special-late.json special-audio.json special-late-console.log special-late-page-errors.json \
    loadout-before.json loadout-ranged.png loadout-after.json loadout-melee.png loadout-spec.json loadout-spec.png \
    loadout-console.log loadout-page-errors.json loadout-selector.json loadout-selector-page-errors.json; do
    [[ -s "$VERIFY_DIR/$capture" ]] || { log "required capture ${capture} is missing or empty"; return 1; }
  done

  node -e '
    const [dir, spawn, target, edgeOrder, edgeStop, holdTicks, bossNpc, lastHiddenTick, lastTick, stages, overheads, specials, focusKey, focusBeats, square, floodDamage, floodLast, voidHits, voidEnd, voidPixel, rangedWorn, meleeWorn, drain, orbExpected, orbBox, orbFrames,
      innerMarks, lateMark, explosionPixel, explosionExpected, soundSamples, explosionSounds, centreX, centreY, tellBox, specialExpected,
      tellCentreBox, transitionSamples, landingSounds, landingWindows, styleSounds, styleWindows, soundTolerance] = process.argv.slice(1);
    const fs = require("fs");
    const read = (file) => JSON.parse(fs.readFileSync(`${dir}/${file}`, "utf8"));
    const [hidden, before, after, edgeArrived, edge, errors, cycle, snapshot, focus, focusErrors, voidLog, voidErrors, shot, shotErrors] =
      ["hidden.json", "before.json", "after.json", "edge-arrived.json", "edge.json", "page-errors.json", "cycle.json", "cycle-snapshot.json", "focus.json", "focus-page-errors.json", "void-floor.json", "void-page-errors.json", "void-shot.json", "void-shot-page-errors.json"].map(read);
    const [dressed, switched, spec, selector, loadoutErrors, selectorErrors] =
      ["loadout-before.json", "loadout-after.json", "loadout-spec.json", "loadout-selector.json", "loadout-page-errors.json", "loadout-selector-page-errors.json"].map(read);
    const [orbLog, orbClick, orbErrors, orbSkip, orbSkipErrors] = ["orb.json", "orb-click.json", "orb-page-errors.json", "orb-skip.json", "orb-skip-page-errors.json"].map(read);
    const [explosionLog, explosionAudio, explosionErrors, underLog, underErrors] = ["explosions.json", "explosion-audio.json", "explosion-page-errors.json", "explosions-under.json", "explosion-under-page-errors.json"].map(read);
    const [specialLog, specialErrors, lateLog, lateErrors, transitionAudio] = ["special.json", "special-page-errors.json", "special-late.json", "special-late-page-errors.json", "special-audio.json"].map(read);
    const [spawnTile, targetTile, edgeOrderTile, edgeStopTile, nearSquare] = [spawn, target, edgeOrder, edgeStop, square].map((tile) => JSON.parse(tile));
    const same = (a, b) => a?.x === b.x && a?.y === b.y;
    const inSquare = (t) => t.x >= nearSquare.minX && t.x <= nearSquare.maxX && t.y >= nearSquare.minY && t.y <= nearSquare.maxY;
    const upTo = (rows, last) => rows.filter((row) => row.tick <= last);
    const between = (rows, from, to) => rows.filter((row) => row.tick >= Number(from) && row.tick <= Number(to));
    const events = (rows, kind, pick) => upTo(rows, Number(lastTick)).flatMap((row) => row.events.filter((e) => e.kind === kind).map(pick));
    const rowAt = (rows, t) => rows.find((row) => row.tick === Number(t));
    function decode(file) {
      const zlib = require("zlib");
      const buf = fs.readFileSync(`${dir}/${file}`);
      let pos = 8, width = 0, height = 0, channels = 0;
      const idat = [];
      while (pos < buf.length) {
        const len = buf.readUInt32BE(pos), type = buf.toString("ascii", pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
        if (type === "IHDR") [width, height, channels] = [data.readUInt32BE(0), data.readUInt32BE(4), { 2: 3, 6: 4 }[data[9]]];
        if (type === "IDAT") idat.push(data);
        pos += 12 + len;
      }
      const raw = zlib.inflateSync(Buffer.concat(idat)), stride = width * channels, px = Buffer.alloc(height * stride);
      for (let y = 0; y < height; y++) {
        for (let i = 0; i < stride; i++) {
          const a = i >= channels ? px[y * stride + i - channels] : 0, b = y ? px[(y - 1) * stride + i] : 0, c = y && i >= channels ? px[(y - 1) * stride + i - channels] : 0;
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          px[y * stride + i] = (raw[y * (stride + 1) + 1 + i] + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][raw[y * (stride + 1)]]) & 255;
        }
      }
      return { width, height, channels, px };
    }
    function pixelShare(file, matches, area) {
      const { width, height, channels, px } = decode(file);
      const { minX, maxX, minY, maxY } = area ?? { minX: 0, maxX: width - 1, minY: 0, maxY: height - 1 };
      let hits = 0;
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const i = (y * width + x) * channels;
          if (matches(px[i], px[i + 1], px[i + 2])) hits++;
        }
      }
      return Math.round((100000 * hits) / ((maxX - minX + 1) * (maxY - minY + 1))) / 1000;
    }
    const shardRgb = [1, 3, 5].map((i) => parseInt(explosionPixel.slice(i, i + 2), 16));
    function shards(file) {
      const { width, height, channels, px } = decode(file);
      const [x0, x1, y0, y1] = [Math.floor(width * 0.4), Math.ceil(width * 0.6), Math.floor(height * 0.45), Math.ceil(height * 0.6)];
      let hits = 0, sumX = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * channels;
          if (shardRgb.every((v, c) => Math.abs(px[i + c] - v) <= 12)) [hits, sumX] = [hits + 1, sumX + x];
        }
      }
      return { share: Math.round((100000 * hits) / ((x1 - x0) * (y1 - y0))) / 1000, dx: hits ? Math.round((1000 * (sumX / hits - (width - 1) / 2)) / width) / 1000 : null };
    }
    const want = [1, 3, 5].map((i) => parseInt(voidPixel.slice(i, i + 2), 16));
    const voidShare = (file) => pixelShare(file, (...rgb) => want.every((v, c) => Math.abs(rgb[c] - v) <= 10));
    const offset = JSON.parse(orbBox);
    const around = { minX: orbClick.x + offset.minX, maxX: orbClick.x + offset.maxX, minY: orbClick.y + offset.minY, maxY: orbClick.y + offset.maxY };
    const orbTeal = (look) => Array.from({ length: Number(orbFrames) }, (_, i) => pixelShare(`orb-${look}-${i + 1}.png`, (r, g, b) => g >= 120 && g - r >= 60 && b - r >= 30, around));
    const expectedOrb = JSON.parse(orbExpected);
    const kindOf = (rows, kind) => rows.flatMap((row) => row.events.filter((e) => e.kind === kind));
    const orbTile = expectedOrb.spawned[0][1];
    const flood = between(shot.rows, floodDamage, floodLast);
    const floorHit = (row) => row.events.some((e) => e.kind === "floor-hit" && same(e.tile, row.playerAtBossStep.tile));
    const launch = flood.find((row) => row.combatDraws > 0);
    const landing = flood.flatMap((row) => row.events.filter((e) => e.kind === "player-hit-judged" && e.style === "ranged").map((e) => ({ ...e, bossHp: row.bossHp })))[0];
    const expectedExplosions = JSON.parse(explosionExpected);
    const stepped = (rows, t) => rowAt(rows, t)?.inputs.some((input) => input.kind === "walk-ordered") ?? false;
    const markedAt = (rows, t) => kindOf(rows, "explosion-marked").find((e) => e.at === t);
    const resolvedAt = (rows, t) => kindOf(rows, "explosion-resolved").find((e) => e.at === t);
    const late = Number(lateMark);
    const fromCentre = (box) => { const o = JSON.parse(box); return { minX: Number(centreX) + o.minX, maxX: Number(centreX) + o.maxX, minY: Number(centreY) + o.minY, maxY: Number(centreY) + o.maxY }; };
    const [tellArea, centreArea] = [fromCentre(tellBox), fromCentre(tellCentreBox)];
    const tellShare = (file) => pixelShare(file, (r, g, b) => b >= 150 && r >= 90 && g <= 90 && b - g >= 100, tellArea);
    const centreShares = (file) => ({ white: pixelShare(file, (r, g, b) => r >= 235 && g >= 235 && b >= 235, centreArea), black: pixelShare(file, (r, g, b) => Math.max(r, g, b) <= 40, centreArea) });
    const samplesOf = JSON.parse(transitionSamples);
    const timed = (list) => JSON.parse(list).map(([at, id]) => [at, samplesOf[id]]);
    const heardIn = (windows, expected) => {
      const lengths = new Set(expected.map(([, samples]) => samples));
      return transitionAudio
        .filter((s) => s.rate === 22050 && s.tick !== null && lengths.has(s.samples) && JSON.parse(windows).some(([from, to]) => s.tick + s.phase >= from && s.tick + s.phase < to))
        .map((s) => [Math.round((s.tick + s.phase) * 100) / 100, s.samples]);
    };
    const onSchedule = (heard, expected) => heard.length === expected.length && heard.every(([at, samples], i) => samples === expected[i][1] && Math.abs(at - expected[i][0]) <= Number(soundTolerance));
    const [landingExpected, styleExpected] = [timed(landingSounds), timed(styleSounds)];
    const prayedAt = (rows) => rows.find((row) => row.inputs.some((input) => input.kind === "prayer-published" && input.prayer === "magic"))?.tick ?? null;
    const hitsOf = (rows) => kindOf(rows, "special-hit").map((e) => [e.at, e.style, e.receipt]);
    const expectedSpecial = JSON.parse(specialExpected);
    const soundBySamples = Object.fromEntries(Object.entries(JSON.parse(soundSamples)).map(([id, samples]) => [samples, Number(id)]));
    const observed = {
      firstWalkOrders: cycle.rows.flatMap((row) => row.inputs.filter((i) => i.kind === "walk-ordered").map((i) => i.destination)).slice(0, 2),
      edge: { arrived: [edgeArrived.tick, edgeArrived.player], held: [edge.tick, edge.player] },
      stageEntries: events(cycle.rows, "stage-entered", (e) => [e.at, e.stage]),
      overheadSwitches: events(cycle.rows, "overhead-switched", (e) => [e.at, e.overhead]),
      specialHits: upTo(cycle.rows, Number(lastTick)).flatMap((row) => row.beats.filter((b) => b.kind === "special-hit").map((b) => [row.tick, b.variant])),
      focusBeats: [...new Set(focus.rows.flatMap((row) => row.beats.map((b) => b.kind)))].sort(),
      floodShot: {
        launch: launch && { at: launch.tick, startedOn: launch.playerAtBossStep.tile, firedFrom: launch.playerAtPostTick.tile, floorHitOnStart: floorHit(launch) },
        landing: landing && { at: landing.at, style: landing.style, outcome: landing.outcome, damage: landing.requested, bossHp: [landing.bossHp.atBossStep, landing.bossHp.atPostTick] },
        walk: flood.flatMap((row) => row.inputs.filter((i) => i.kind === "walk-ordered").map((i) => [row.tick, i.destination])),
      },
      floodRows: flood.map((row) => [row.tick, row.playerAtBossStep.tile, floorHit(row)]),
      voidHits: voidLog.rows.flatMap((row) => row.events.filter((e) => e.kind === "floor-hit").map((e) => [e.at, e.receipt.applied])),
      voidHitTiles: [...new Set(voidLog.rows.flatMap((row) => row.events.filter((e) => e.kind === "floor-hit").map((e) => JSON.stringify(e.tile))))],
      voidRunEnd: voidLog.rows.flatMap((row) => row.events.filter((e) => e.kind === "run-ended").map((e) => [e.at, e.reason])),
      voidPixelShare: { "before.png": voidShare("before.png"), "void-inner.png": voidShare("void-inner.png"), "void-flood.png": voidShare("void-flood.png"), "flood-ring.png": voidShare("flood-ring.png") },
      loadout: {
        worn: [dressed.player.equipped, switched.player.equipped, selector.player.equipped],
        specialEnergy: [switched.player.specialEnergy, spec.player.specialEnergy],
        bossDefence: [switched.boss.defence, spec.boss.defence],
      },
      orb: {
        told: kindOf(orbLog.rows, "lifeforce-told").map((e) => [e.at, e.void]),
        drained: kindOf(orbLog.rows, "lifeforce-drained").map((e) => [e.at, e.receipt.applied, e.receipt.afterHp]),
        spawned: kindOf(orbLog.rows, "orb-spawned").map((e) => [e.at, e.tile, e.credit]),
        clicked: orbClick.snapshot?.destination ?? null,
        arrivedAt: orbLog.rows.find((row) => same(row.playerAtPostTick.tile, orbTile))?.tick ?? null,
        matured: kindOf(orbLog.rows, "orb-matured").map((e) => [e.at, e.tile]),
        returned: kindOf(orbLog.rows, "orb-returned").map((e) => [e.at, e.receipt]),
        skipExpired: kindOf(orbSkip.rows, "orb-expired").map((e) => [e.at, e.void]),
        skipHeal: kindOf(orbSkip.rows, "boss-healed").map((e) => [e.at, e.cause, e.receipt]),
        skipReturned: kindOf(orbSkip.rows, "orb-returned").length,
        tealShare: { box: around, dormant: orbTeal("dormant"), glow: orbTeal("glow") },
      },
      explosions: {
        dodges: JSON.parse(innerMarks).map((t) => ({ mark: t, stepped: stepped(explosionLog.rows, t), tile: markedAt(explosionLog.rows, t)?.tile ?? null, outcome: resolvedAt(explosionLog.rows, t + 1)?.outcome.kind ?? null })),
        late: {
          standing: rowAt(explosionLog.rows, late)?.playerAtBossStep.tile ?? null,
          marked: markedAt(explosionLog.rows, late)?.tile ?? null,
          steppedOnMark: stepped(explosionLog.rows, late),
          steppedOnImpact: stepped(explosionLog.rows, late + 1),
          resolved: resolvedAt(explosionLog.rows, late + 1) ?? null,
          endTile: rowAt(explosionLog.rows, late + 1)?.playerAtPostTick.tile ?? null,
        },
        under: kindOf(underLog.rows, "explosion-resolved").map((e) => [e.at, e.tile, e.underBoss, e.outcome.kind, e.outcome.receipt?.afterHp ?? null]),
        shards: { "explosion-left.png": shards("explosion-left.png"), "explosion-standing.png": shards("explosion-standing.png") },
        sounds: {
          heard: explosionAudio.filter((s) => s.rate === 22050 && soundBySamples[s.samples] !== undefined).map((s) => [s.tick, soundBySamples[s.samples]]),
          contexts: [...new Set(explosionAudio.map((s) => s.state))],
          starts: explosionAudio.length,
        },
      },
      special: {
        prayedAt: prayedAt(specialLog.rows),
        hits: hitsOf(specialLog.rows),
        latePrayedAt: prayedAt(lateLog.rows),
        lateHits: hitsOf(lateLog.rows),
        lateRunEnd: kindOf(lateLog.rows, "run-ended").map((e) => [e.at, e.reason]),
        told: kindOf(lateLog.rows, "special-told").map((e) => [e.at, e.variant, e.style]),
        tellShare: { box: tellArea, ...Object.fromEntries(["special-before.png", "special-vortex.png", "special-spike-disk.png", "special-semicircle.png"].map((file) => [file, tellShare(file)])) },
        centreShares: { box: centreArea, ...Object.fromEntries(["special-vortex.png", "special-spike-disk.png", "special-black-disk.png"].map((file) => [file, centreShares(file)])) },
        landingSounds: heardIn(landingWindows, landingExpected),
        styleSounds: heardIn(styleWindows, styleExpected),
        contexts: [...new Set(transitionAudio.map((s) => s.state))],
      },
    };
    const sameJson = (a, b) => require("util").isDeepStrictEqual(a, JSON.parse(b));
    const share = observed.voidPixelShare;
    const orb = observed.orb;
    const { dodges, late: lateStep, under, shards: shardSpots, sounds } = observed.explosions;
    const [left, standing] = [shardSpots["explosion-left.png"], shardSpots["explosion-standing.png"]];
    const special = observed.special;
    const readyAt = Math.max(orb.arrivedAt ?? Infinity, orb.matured[0]?.[0] ?? Infinity);
    const checks = {
      spawnedOnSpawnTile: same(before.player, spawnTile),
      clickTargetedExpectedTile: same(after.destination, targetTile),
      arrivedAtExpectedTile: same(after.player, targetTile),
      worldTicked: after.tick > before.tick,
      edgeClickOrderedOffThePlatform: require("util").isDeepStrictEqual(observed.firstWalkOrders, [targetTile, edgeOrderTile]),
      stoppedAtTheEdge: same(edgeArrived.player, edgeStopTile) && same(edge.player, edgeStopTile) && edge.tick - edgeArrived.tick >= Number(holdTicks),
      bossIsExpectedNpc: snapshot.fight?.boss.npcId === Number(bossNpc),
      bossHiddenInLeadIn: hidden.fight?.run.kind === "running" && hidden.fight.run.tick <= Number(lastHiddenTick) && hidden.fight.boss.visible === false,
      bossDrawnOncePresent: snapshot.fight?.boss.visible === true,
      logHasEveryTick: cycle.rows.every((row, index) => row.tick === index) && cycle.rows.length > Number(lastTick),
      stagesOnSchedule: sameJson(observed.stageEntries, stages),
      overheadsOnSchedule: sameJson(observed.overheadSwitches, overheads),
      transitionAttacksReplayed: sameJson(observed.specialHits, specials),
      focusApplied: focus.header.choices.focus.key === focusKey && sameJson(observed.focusBeats, focusBeats),
      rangedShotFromTheFlood: launch !== undefined && !inSquare(edgeStopTile) && same(launch.playerAtBossStep.tile, edgeStopTile) && same(launch.playerAtPostTick.tile, edgeStopTile) && floorHit(launch),
      rangedShotLanded: launch !== undefined && landing !== undefined && landing.at > launch.tick && landing.outcome === "passed" && landing.requested > 0 &&
        landing.bossHp.atBossStep - landing.bossHp.atPostTick === landing.requested,
      ringSparedInFlood: flood.length === Number(floodLast) - Number(floodDamage) + 1 && flood.every((row) => floorHit(row) === !inSquare(row.playerAtBossStep.tile)) &&
        flood.some(floorHit) && inSquare(flood[flood.length - 1].playerAtBossStep.tile),
      floodHitsStandingStill: sameJson(observed.voidHits, voidHits) && sameJson(observed.voidHitTiles, JSON.stringify([JSON.stringify(spawnTile)])) && sameJson(observed.voidRunEnd, voidEnd),
      noVoidBeforeTheFight: share["before.png"] < 0.3,
      innerVoidDrawn: share["void-inner.png"] > 0.6 && share["void-inner.png"] < 3,
      floodDrawn: share["void-flood.png"] > 3 && share["flood-ring.png"] > 3,
      rangedSetupWorn: sameJson(dressed.player.equipped, rangedWorn),
      switchesWornByClick: sameJson(switched.player.equipped, meleeWorn),
      divisionSpentHalfTheBar: switched.player.specialEnergy === 100 && spec.player.specialEnergy === 50,
      divisionDrainedBossDefence: switched.boss.defence - spec.boss.defence === Number(drain),
      setupSelectorApplied: sameJson(selector.player.equipped, meleeWorn),
      orbToldAndDrained: sameJson(orb.told, JSON.stringify(expectedOrb.told)) && sameJson(orb.drained, JSON.stringify(expectedOrb.drained)),
      orbSpawnedDormant: sameJson(orb.spawned, JSON.stringify(expectedOrb.spawned)),
      orbClickTargetedOrb: same(orb.clicked, orbTile),
      orbGlowsOnSchedule: sameJson(orb.matured, JSON.stringify(expectedOrb.matured)),
      orbReturnedTickAfterArrival: orb.returned.length === 1 && orb.returned[0][0] === readyAt + 1 && sameJson(orb.returned[0][1], JSON.stringify(expectedOrb.returned)),
      orbGlowDrawn: Math.max(...orb.tealShare.glow) - Math.max(...orb.tealShare.dormant) >= 7,
      skippedOrbHealsBoss: sameJson(orb.skipExpired, JSON.stringify(expectedOrb.skipExpired)) && sameJson(orb.skipHeal, JSON.stringify(expectedOrb.skipHeal)) && orb.skipReturned === 0,
      explosionsDodgedOnMarkTicks: dodges.every((d) => d.stepped && d.outcome === "avoided") && same(dodges[0].tile, spawnTile),
      lateStepHitOnMarkedTile: lateStep.standing !== null && lateStep.resolved?.outcome.kind === "hit" && sameJson(lateStep.resolved.outcome.receipt, JSON.stringify(expectedExplosions.lateHit)) &&
        same(lateStep.marked, lateStep.standing) && same(lateStep.resolved.tile, lateStep.standing) && !lateStep.steppedOnMark && lateStep.steppedOnImpact && !same(lateStep.endTile, lateStep.standing),
      campingUnderBossHit: sameJson(under, JSON.stringify(expectedExplosions.under)),
      explosionSoundsOnSchedule: sameJson(sounds.heard, explosionSounds) && sameJson(sounds.contexts, JSON.stringify(["running"])),
      markerStaysOnCapturedTile: left.share >= 0.1 && left.dx !== null && left.dx <= -0.01 && standing.share >= 0.1 && standing.dx !== null && Math.abs(standing.dx) <= 0.016,
      prayerBeforeLandingProtects: special.prayedAt !== null && special.prayedAt < expectedSpecial.protected[0] && sameJson(special.hits, JSON.stringify([expectedSpecial.protected])),
      lateClickTakesFullHit: special.latePrayedAt !== null && special.latePrayedAt > expectedSpecial.late[0] && sameJson(special.lateHits[0], JSON.stringify(expectedSpecial.late)),
      tellsToldOnSchedule: sameJson(special.told, JSON.stringify(expectedSpecial.told)),
      tellsDrawn: special.tellShare["special-before.png"] < 0.3 && ["special-vortex.png", "special-spike-disk.png", "special-semicircle.png"].every((file) => special.tellShare[file] >= 1),
      tellCentresDark: ["special-vortex.png", "special-spike-disk.png", "special-black-disk.png"].every((file) => special.centreShares[file].white < 1),
      landingSoundsOnSchedule: onSchedule(special.landingSounds, landingExpected) && sameJson(special.contexts, JSON.stringify(["running"])),
      styleSoundsOnSchedule: onSchedule(special.styleSounds, styleExpected) && sameJson(special.contexts, JSON.stringify(["running"])),
      noPageErrors: [errors, focusErrors, voidErrors, shotErrors, orbErrors, orbSkipErrors, explosionErrors, underErrors, specialErrors, lateErrors, loadoutErrors, selectorErrors].every((list) => list.length === 0),
    };
    if (!checks.clickTargetedExpectedTile) {
      console.error(`verify: the click resolved to ${JSON.stringify(after.destination)}, not ${JSON.stringify(targetTile)}; the click-to-tile mapping for this viewport and camera changed`);
    }
    console.log(JSON.stringify({ hidden, before, after, target: targetTile, edge: { order: edgeOrderTile, stop: edgeStopTile }, observed, checks }, null, 2));
    process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
  ' "$VERIFY_DIR" "$SPAWN_TILE" "$WALK_TARGET_TILE" "$EDGE_ORDER_TILE" "$EDGE_STOP_TILE" "$EDGE_HOLD_TICKS" "$BOSS_NPC" "$CYCLE_LAST_HIDDEN_TICK" "$CYCLE_LAST_TICK" "$CYCLE_STAGE_ENTRIES" "$CYCLE_OVERHEAD_SWITCHES" "$CYCLE_SPECIAL_HITS" "$FOCUS_DRILL" "$FOCUS_BEATS" \
    "$NEAR_SQUARE" "$FLOOD_DAMAGE_TICK" "$FLOOD_LAST_TICK" "$VOID_FLOOR_HITS" "$VOID_RUN_END" "$VOID_PIXEL" \
    "$LOADOUT_RANGED_WORN" "$LOADOUT_MELEE_WORN" "$LOADOUT_DIVISION_DRAIN" "$ORB_EXPECTED" "$ORB_BOX" "$ORB_FRAMES" \
    "[${EXPLOSION_INNER_MARKS// /,}]" "${EXPLOSION_OUTER_MARKS%% *}" "$EXPLOSION_PIXEL" "$EXPLOSION_EXPECTED" "$SOUND_SAMPLES" "$EXPLOSION_SOUNDS" "$CX" "$CY" "$TELL_BOX" "$SPECIAL_EXPECTED" \
    "$TELL_CENTRE_BOX" "$TRANSITION_SOUND_SAMPLES" "$LANDING_SOUNDS" "$LANDING_WINDOWS" "$STYLE_SOUNDS" "$STYLE_WINDOWS" "$SOUND_TOLERANCE_TICKS" >"$VERIFY_DIR/observed.json"
  local verdict=$?
  cat "$VERIFY_DIR/observed.json"
  return $verdict
}

release_browser() {
  ab close >/dev/null 2>&1
  [[ -n "$LAUNCHED_PID" && -f "$STATE_FILE" && "$(state pid)" == "$LAUNCHED_PID" ]] || return 0
  stop
}

stage_browser() {
  BROWSER_SESSION="archive-ocellus-verify-$(basename "$VERIFY_DIR")"
  LAUNCHED_PID=
  local result=1
  trap 'release_browser; exit 130' INT TERM
  if serve && doctor; then
    drive
    result=$?
  fi
  release_browser || result=1
  trap - INT TERM
  return $result
}

case "${1:-}" in
  serve) mkdir -p "$VERIFY_DIR" && ensure_deps && serve && doctor && log "drive ${URL}; evidence in ${VERIFY_DIR}; stop with scripts/verify.sh stop"; exit $? ;;
  doctor) doctor; exit $? ;;
  stop) stop; exit $? ;;
esac

stages=("$@")
[[ ${#stages[@]} -gt 0 ]] || stages=(build types test assets browser)
for stage in "${stages[@]}"; do
  case "$stage" in build | types | test | assets | browser) ;; *) log "unknown stage: ${stage}"; exit 2 ;; esac
done

mkdir -p "$VERIFY_DIR"
ensure_deps || { echo "FAIL deps" | tee "$VERIFY_DIR/summary.txt"; exit 1; }
log "evidence: ${VERIFY_DIR}"
failed=0
: >"$VERIFY_DIR/summary.txt"
for stage in "${stages[@]}"; do
  if "stage_$stage"; then
    echo "PASS $stage" | tee -a "$VERIFY_DIR/summary.txt"
  else
    echo "FAIL $stage" | tee -a "$VERIFY_DIR/summary.txt"
    failed=1
  fi
done
exit $failed
