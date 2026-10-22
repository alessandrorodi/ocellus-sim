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
CYCLE_OVERHEAD_SWITCHES='[[8,"deflect-melee"],[33,"soul-split"],[38,null],[39,"deflect-range"],[61,"soul-split"],[67,null],[68,"deflect-melee"]]'
CYCLE_SPECIAL_HITS='[[37,"vortex"],[65,"spike-disk"]]'
FOCUS_DRILL="transition-attacks"
FOCUS_LAST_TICK=40
FOCUS_BEATS='["boss-landing-starts","boss-shouts","soul-split-heal","special-hit","special-sound","special-tell"]'
LOADOUT_QUERY="?seed=6&setup=ranged"
LOADOUT_RANGED_WORN='{"weapon":20997,"offhand":null,"helmet":27235,"chest":27238,"legs":27241,"gloves":26235,"cape":28951,"necklace":33639,"feet":31097,"ring":28310,"ammo":11212}'
LOADOUT_MELEE_WORN='{"weapon":22325,"offhand":null,"helmet":24419,"chest":24420,"legs":24421,"gloves":22981,"cape":21295,"necklace":29801,"feet":31097,"ring":25485,"ammo":11212}'
LOADOUT_INVENTORY_TAB_X=1164
LOADOUT_INVENTORY_TAB_Y=745
LOADOUT_SLOT_X=1125
LOADOUT_SLOT_Y=508
LOADOUT_SLOT_DX=39
LOADOUT_SLOT_DY=32
LOADOUT_SPECIAL_SLOT=0
LOADOUT_SWITCHES=8
LOADOUT_SPECIAL_ORB_X=1140
LOADOUT_SPECIAL_ORB_Y=157
RISEN_BOSS_CLICK_RIGHT_PX=-10
RISEN_BOSS_CLICK_DOWN_PX=-160
LOADOUT_DIVISION_DRAIN=37
LOADOUT_EQUIPMENT_TAB_X=1197
LOADOUT_EQUIPMENT_TAB_Y=745
LOADOUT_TRAINER_ICONS='{"24419":"27x30","24420":"32x24","24421":"16x31","26235":"30x22","27235":"19x27","27238":"30x23","27241":"13x26","28922":"31x28"}'
DEFENCE_FLOOR_QUERY="?seed=20&setup=ranged"
DEFENCE_FLOOR_STEPS="[250,176,150]"
SUPPLY_QUERY="?seed=1&setup=ranged"
SUPPLY_INVENTORY='[28922,22325,24419,24420,24421,22981,21295,29801,25485,12695,22461,6685,3024,12695,22461,6685,3024,6685,6685,6685,3024,6685,6685,6685,3024,6685,6685,3024]'
SUPPLY_NAMED_SLOT=0
SUPPLY_NAMED_MENU='["Equip Tonalztics of Ralos","Drop Tonalztics of Ralos","Examine Tonalztics of Ralos"]'
SUPPLY_BREW_SLOT=11
SUPPLY_HP_AFTER_BREW=115
SUPPLY_HOVER_NAME_PIXEL="#ff911f"
KEYBIND_INVENTORY_BUTTON_X=1130
KEYBIND_INVENTORY_BUTTON_Y=650
KEYBIND_DEFAULT_KEY=F4
KEYBIND_NEW_KEY=F6
WALKWAY_QUERY="?seed=1&focus=${FOCUS_DRILL}"
WALKWAY_CLICK_LEFT_PX=400
WALKWAY_ORDER_TILE='{"x":13,"y":2}'
WALKWAY_STOP_TILE='{"x":11,"y":2}'
WALKWAY_PIXEL="#6b6c40"
WALKWAY_MIN_SHARE=1
CORNER_QUERY="?seed=2&focus=${FOCUS_DRILL}"
CORNER_HOLE_CLICK_RIGHT_PX=60
CORNER_HOLE_CLICK_UP_PX=155
CORNER_HOLE_TILE='{"x":3,"y":8}'
CORNER_NUB_CLICK_RIGHT_PX=40
CORNER_NUB_CLICK_UP_PX=170
CORNER_NUB_TILE='{"x":4,"y":9}'
CORNER_VIEW_CLICK_RIGHT_PX=150
CORNER_VIEW_CLICK_UP_PX=20
CORNER_VIEW_TILE='{"x":2,"y":2}'
CORNER_VIEW_DRAG_LEFT_PX=95
HOLES_QUERY="?seed=1&focus=floor-holes"
HOLE_LAYOUT='{"key":"v1-turn","tiles":[{"x":1,"y":5},{"x":1,"y":6},{"x":2,"y":8},{"x":2,"y":9},{"x":4,"y":9},{"x":8,"y":5}]}'
HOLE_PIXELS='[[{"x":8,"y":5},-128,-95],[{"x":1,"y":5},170,-95],[{"x":1,"y":6},161,-115],[{"x":2,"y":8},108,-151],[{"x":2,"y":9},102,-167]]'
HOLE_FREE_PIXELS='[[{"x":2,"y":5},127,-95],[{"x":2,"y":6},117,-116]]'
HOLE_BOX_HALF_PX=8
HOLE_MIN_DARK_SHARE=30
HOLE_MAX_DARK_SHARE=5
HOLE_FLOOD_SHOT_TICK=45
HOLE_CLICK_LEFT_PX=128
HOLE_CLICK_UP_PX=95
HOLE_TILE='{"x":8,"y":5}'
HOLE_HITS=3
HOLE_DAMAGE='{"min":9,"max":11}'
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
ORB_CLICK_RIGHT_PX=-195
ORB_CLICK_UP_PX=78
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
ORB_EXPECTED='{"told":[[11,"inner-void"]],"drained":[[12,49,50]],"spawned":[[12,{"x":9,"y":4},49]],"matured":[[24,{"x":9,"y":4}]],"returned":{"requested":49,"applied":49,"beforeHp":50,"afterHp":99},"skipExpired":[[30,"inner-void"],[61,"outer-void"]],"skipHeal":[[62,{"kind":"unclaimed-orb"},{"requested":25,"applied":25,"beforeHp":1355,"afterHp":1380}]]}'
RIFT_QUERY="?seed=1&focus=rifts"
OVERHEAD_SHOT_TICKS="5 31 35 45"
OVERHEAD_GAP_DRAWS='{"37":["440-11"],"38":[],"39":["440-16"],"66":["440-11"],"67":[],"68":["440-15"]}'
ICON_BOX='{"minX":-40,"maxX":40,"minY":-290,"maxY":-190}'
RIFT_CLICK_TICK=68
NORTH_EAST_RIFT_CLICK_LEFT_PX=325
NORTH_EAST_RIFT_CLICK_UP_PX=52
RIFT_BURST_TICK=78
CHAT_POLL_WAIT_MS=600
DEFLECT_QUERY="?seed=1&focus=rifts&setup=melee"
DEFLECT_CLICK_TICK=12
DEFLECT_HOVER_SHOT_TICK=20
DEFLECT_HOVER_TILE='{"x":5,"y":3}'
DEFLECT_HOVER_TICKS='[14,29]'
DEFLECT_FIRST_MELEE_TICK=31
DEFLECT_BLOCKED_SHOT_TICK=31
DEFLECT_LAST_TICK=46
SOUL_SPLIT_HEAL_TICK=39
RIFT_EXPECTED='{"spawned":[[67,"rift-67-0",{"x":2,"y":2}],[67,"rift-67-1",{"x":11,"y":2}]],"destroyed":"rift-67-1","bursts":[[78,"rift-67-0",{"requested":14,"applied":14,"beforeHp":99,"afterHp":85,"prayer":null}]]}'
SOUL_SPLIT_EXPECTED='[[39,{"kind":"soul-split","ordinal":0},{"requested":49,"applied":49,"beforeHp":1355,"afterHp":1404}],[67,{"kind":"soul-split","ordinal":1},{"requested":47,"applied":47,"beforeHp":1404,"afterHp":1451}]]'
KILL_CHAT="Destroying the void rift empowers you!"
RIFT_SOUND_SAMPLES='{"12640":11025,"12641":14332,"12642":26460,"12643":7717}'
RIFT_SPAWN_SOUNDS='[[67.2,12643],[67.2,12643]]'
RIFT_KILL_SOUND='[0.27,12640]'
RIFT_BURST_SOUNDS='[[78.13,12641],[78.93,12642]]'
RIFT_SOUND_WINDOW='[66,80]'
CUE_QUERY="?seed=1&focus=${ORB_DRILL}"
CUE_TOGGLE_TICK=6
CUE_CHAT_BEFORE_TICK=10
CUE_CHAT_TICK=11
CUE_LAST_TICK=50
CUE_SOUND_SAMPLES='{"12490":7717,"12497":66150,"12621":12127,"12622":12127,"12623":12127,"12624":9922}'
CUE_SOUNDS='[[5,12490],[12.4,12624],[15.87,12621],[19.8,12622],[22.8,12623],[39,12497],[43.1,12624],[44.7,12621],[46.8,12622],[48.3,12623]]'
CUE_SOUND_WINDOW='[4,50]'
CUE_CHAT="Ocellus manipulates your lifeforce!"
AUTOPLAY_POLICY_JS='(() => { const Native = window.AudioContext; if (!Native) return; const made = []; window.__audioContexts = made; window.AudioContext = class extends Native { constructor(...args) { super(...args); made.push(this); void this.suspend(); } }; })();'
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
    const npcs = Object.values(assets.npcs).every(({ id }) => m.assets?.[`npc-${id}`]);
    const items = Object.values(assets.items).every(({ id }) => m.playerItems?.[`item:${id}`]);
    const spotAnims = Object.values(assets.spotAnims).every(({ id }) => m.spotAnims?.[id]);
    const models = Object.values(assets.models).every(({ id }) => m.assets?.[`model-${id}`]);
    const pack = m.soundEffects && join(dirname(process.argv[1]), m.soundEffects.file);
    const bytes = pack && existsSync(pack) ? readFileSync(pack) : Buffer.alloc(6);
    const packed = new Set();
    for (let at = 6, n = 0; n < bytes.readUInt16BE(4); n++, at += 4 + bytes.readUInt16BE(at + 2)) packed.add(bytes.readUInt16BE(at));
    const sounds = Object.values(assets.sounds).every(({ id }) => packed.has(id));
    process.exit(m.cache?.source === "openrs2:2746" && npcs && items && spotAnims && models && sounds ? 0 : 1);
  ' "$MANIFEST" && node scripts/extract-sprites.mjs --check
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
  local flags=(--cache-dir "$OSRS_CACHE_DIR" --reader-path "$OSRS_CACHE_READER")
  if manifest_ready; then
    log "assets: manifest already has every configured npc, model, item, spotanim and sound from openrs2:2746, and every sprite, skipping the model rebuild" | tee "$VERIFY_DIR/assets.log"
    npm run item-icons -- "${flags[@]}" >>"$VERIFY_DIR/assets.log" 2>&1
    return
  fi
  npm run assets -- "${flags[@]}" >"$VERIFY_DIR/assets.log" 2>&1 && manifest_ready
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
  local pid page manifest problems=0
  pid="$(state pid)"
  if [[ "$(process_start "$pid")" != "$(state started)" ]]; then
    log "doctor: recorded PID ${pid} is not running (or the PID was reused)"
    problems=1
  fi
  if [[ "$(port_listener)" != "$pid" ]]; then
    log "doctor: port $(state port) is held by '$(port_listener)', not the recorded PID ${pid}"
    problems=1
  fi
  if ! page="$(curl -sf "http://127.0.0.1:$(state port)/")"; then
    log "doctor: page request failed"
    problems=1
  elif ! grep -q "<title>Archive Ocellus Trainer</title>" <<<"$page"; then
    log "doctor: page title is not Archive Ocellus Trainer"
    problems=1
  fi
  if ! manifest="$(curl -sf "http://127.0.0.1:$(state port)/osrs-assets/manifest.json")"; then
    log "doctor: manifest request failed"
    problems=1
  elif ! grep -q "\"npc-${BOSS_NPC}\"" <<<"$manifest"; then
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
      if (t !== null && seen[t] === undefined) seen[t] = Math.min(performance.now(), (seen[t - 1] ?? Infinity) + 600);
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

record_overhead_draws() {
  ab eval '(() => {
    const draws = {};
    window.__overheadDraws = draws;
    const tick = () => {
      const run = window.__archiveOcellusProbe?.snapshot().fight?.run;
      return run?.kind === "running" ? run.tick : null;
    };
    const at = (t) => (draws[t] ??= { frames: 0, sprites: [] });
    for (const context of [CanvasRenderingContext2D, OffscreenCanvasRenderingContext2D]) {
      const drawImage = context.prototype.drawImage;
      context.prototype.drawImage = function (image, ...rest) {
        const sprite = /\/sprites\/(\d+-\d+)\.png$/.exec(image?.src ?? "")?.[1];
        const t = sprite === undefined ? null : tick();
        if (t !== null && !at(t).sprites.includes(sprite)) at(t).sprites.push(sprite);
        return drawImage.call(this, image, ...rest);
      };
    }
    const frame = () => {
      const t = tick();
      if (t !== null) at(t).frames++;
      requestAnimationFrame(frame);
    };
    frame();
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

keep_seed() {
  ab fill "#seed" "$(ab --json get value "#seed" | json data.value)" >/dev/null || { log "the seed box did not take the run's own seed"; return 1; }
}

choose_focus() {
  keep_seed || return 1
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
  ab open "${URL}?seed=4&deflect=none&focus=${VOID_DRILL}" >/dev/null || return 1
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

glaives_landed() {
  ab wait --fn "window.__archiveOcellusProbe.log().rows.flatMap((row) => row.events).filter((event) => event.kind === 'player-hit-judged').length >= $1" \
    --timeout 15000 >/dev/null
}

drive_loadouts() {
  local slot box
  ab open "${URL}${LOADOUT_QUERY}" >/dev/null || return 1
  fight_tick_at_least 9 120000 || { log "the loadout drill never stepped to P4 tick 9"; return 1; }
  probe "snapshot().fight" >"$VERIFY_DIR/loadout-before.json"
  click_at "$LOADOUT_INVENTORY_TAB_X" "$LOADOUT_INVENTORY_TAB_Y" || return 1
  ab wait 600 >/dev/null
  ab screenshot "$VERIFY_DIR/loadout-ranged.png" >/dev/null || { log "ranged setup screenshot failed"; return 1; }
  probe "snapshot().icons" >"$VERIFY_DIR/icons.json"
  click_at "$LOADOUT_EQUIPMENT_TAB_X" "$LOADOUT_EQUIPMENT_TAB_Y" || return 1
  ab wait 600 >/dev/null
  ab screenshot "$VERIFY_DIR/equipment-ranged.png" >/dev/null || { log "ranged equipment tab screenshot failed"; return 1; }
  click_at "$LOADOUT_INVENTORY_TAB_X" "$LOADOUT_INVENTORY_TAB_Y" || return 1
  ab wait 600 >/dev/null

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
  click_at $(( $(json data.x <<<"$box") + $(json data.width <<<"$box") / 2 + RISEN_BOSS_CLICK_RIGHT_PX )) \
    $(( $(json data.y <<<"$box") + $(json data.height <<<"$box") / 2 + RISEN_BOSS_CLICK_DOWN_PX )) || return 1
  ab wait --fn "window.__archiveOcellusProbe.snapshot().fight.player.specialEnergy < 100" --timeout 15000 >/dev/null || log "the special attack was not spent"
  glaives_landed 2 || log "the glaives never landed"
  probe "snapshot().fight" >"$VERIFY_DIR/loadout-spec.json"
  ab wait 1200 >/dev/null
  ab screenshot "$VERIFY_DIR/loadout-spec.png" >/dev/null || { log "special attack screenshot failed"; return 1; }
  click_at "$LOADOUT_EQUIPMENT_TAB_X" "$LOADOUT_EQUIPMENT_TAB_Y" || return 1
  ab wait 600 >/dev/null
  ab screenshot "$VERIFY_DIR/equipment-melee.png" >/dev/null || { log "equipment tab screenshot failed"; return 1; }
  ab console >"$VERIFY_DIR/loadout-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/loadout-page-errors.json" || { log "page error capture failed"; return 1; }

  keep_seed && ab select "#setup" melee >/dev/null && ab click "#restart" >/dev/null || { log "setup control did not accept melee"; return 1; }
  ab wait --fn "new URLSearchParams(location.search).get('setup') === 'melee'" --timeout 30000 >/dev/null || { log "restart did not load setup=melee"; return 1; }
  fight_tick_at_least 1 120000 || { log "the reloaded melee drill never stepped to P4 tick 1"; return 1; }
  probe "snapshot().fight" >"$VERIFY_DIR/loadout-selector.json"
  ab --json errors | json data.errors >"$VERIFY_DIR/loadout-selector-page-errors.json" || { log "page error capture failed"; return 1; }
}

drive_defence_floor() {
  local box
  ab open "${URL}${DEFENCE_FLOOR_QUERY}" >/dev/null || return 1
  fight_tick_at_least 9 120000 || { log "the defence floor drill never stepped to P4 tick 9"; return 1; }
  probe "snapshot().fight" >"$VERIFY_DIR/defence-floor-start.json"
  click_at "$LOADOUT_INVENTORY_TAB_X" "$LOADOUT_INVENTORY_TAB_Y" || return 1
  ab wait 600 >/dev/null
  click_inventory_slot "$LOADOUT_SPECIAL_SLOT" || return 1
  ab wait 700 >/dev/null
  click_at "$LOADOUT_SPECIAL_ORB_X" "$LOADOUT_SPECIAL_ORB_Y" || return 1
  box="$(ab --json get box "#world")"
  click_at $(( $(json data.x <<<"$box") + $(json data.width <<<"$box") / 2 + RISEN_BOSS_CLICK_RIGHT_PX )) \
    $(( $(json data.y <<<"$box") + $(json data.height <<<"$box") / 2 + RISEN_BOSS_CLICK_DOWN_PX )) || return 1
  ab wait --fn "window.__archiveOcellusProbe.snapshot().fight.player.specialEnergy === 50" --timeout 15000 >/dev/null || log "the first Division was not spent"
  click_at "$LOADOUT_SPECIAL_ORB_X" "$LOADOUT_SPECIAL_ORB_Y" || return 1
  glaives_landed 2 || log "the first Division's glaives never landed"
  probe "snapshot().fight" >"$VERIFY_DIR/defence-floor-first.json"
  glaives_landed 4 || log "the second Division's glaives never landed"
  probe "snapshot().fight" >"$VERIFY_DIR/defence-floor.json"
  probe "log()" >"$VERIFY_DIR/defence-floor-log.json"
  ab screenshot "$VERIFY_DIR/defence-floor.png" >/dev/null || { log "defence floor screenshot failed"; return 1; }
  ab console >"$VERIFY_DIR/defence-floor-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/defence-floor-page-errors.json" || { log "page error capture failed"; return 1; }
}

right_click_inventory_slot() {
  ab mouse move $((LOADOUT_SLOT_X + $1 % 4 * LOADOUT_SLOT_DX)) $((LOADOUT_SLOT_Y + $1 / 4 * LOADOUT_SLOT_DY)) >/dev/null && ab mouse down right >/dev/null && ab mouse up right >/dev/null
}

drive_supplies() {
  ab open "${URL}${SUPPLY_QUERY}" >/dev/null || return 1
  fight_tick_at_least 1 120000 || { log "the supplies drill never stepped to P4 tick 1"; return 1; }
  click_at "$LOADOUT_INVENTORY_TAB_X" "$LOADOUT_INVENTORY_TAB_Y" || return 1
  ab wait 600 >/dev/null
  probe "snapshot().fight.player.inventory" >"$VERIFY_DIR/supplies-inventory.json"
  right_click_inventory_slot "$SUPPLY_NAMED_SLOT" || return 1
  ab wait 300 >/dev/null
  probe "snapshot().menu" >"$VERIFY_DIR/item-menu.json"
  ab screenshot "$VERIFY_DIR/item-menu.png" >/dev/null || { log "item menu screenshot failed"; return 1; }
  canvas_centre || { log "canvas box unreadable"; return 1; }
  ab mouse move "$CX" "$CY" >/dev/null && ab wait 200 >/dev/null || return 1
  probe "snapshot().menu" >"$VERIFY_DIR/item-menu-closed.json"
  probe "snapshot().fight.run.tick" >"$VERIFY_DIR/brew-click.json"
  click_inventory_slot "$SUPPLY_BREW_SLOT" || return 1
  ab wait --fn "window.__archiveOcellusProbe.log().rows.some((row) => row.playerAtPostTick.hp > 99)" --timeout 15000 >/dev/null || log "the brew never raised the player's hitpoints"
  probe "log().rows.map((row) => [row.tick, row.playerAtPostTick.hp])" >"$VERIFY_DIR/brew-hp.json"
  ab wait 600 >/dev/null
  ab screenshot "$VERIFY_DIR/brew-heal.png" >/dev/null || { log "brew screenshot failed"; return 1; }
  ab console >"$VERIFY_DIR/supplies-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/supplies-page-errors.json" || { log "page error capture failed"; return 1; }
}

bind_inventory_key() {
  ab click "#keybinds" >/dev/null && ab wait 300 >/dev/null && click_at "$KEYBIND_INVENTORY_BUTTON_X" "$KEYBIND_INVENTORY_BUTTON_Y" && ab press "$1" >/dev/null && ab wait 300 >/dev/null
}

drive_keybinds() {
  ab click "#keybinds" >/dev/null && ab wait 300 >/dev/null || { log "the Keybinds button did not respond"; return 1; }
  probe "snapshot().panel" >"$VERIFY_DIR/keybinds-open.json"
  ab screenshot "$VERIFY_DIR/keybinds.png" >/dev/null || { log "key bindings screenshot failed"; return 1; }
  bind_inventory_key "$KEYBIND_NEW_KEY" || { log "the inventory key was not bound"; return 1; }
  probe "snapshot().panel" >"$VERIFY_DIR/keybinds-bound.json"
  ab --json eval "localStorage.getItem('${SOUND_SETTINGS_KEY}')" | json data.result >"$VERIFY_DIR/keybinds-saved.json" || { log "saved settings capture failed"; return 1; }
  ab open "${URL}${SUPPLY_QUERY}" >/dev/null || return 1
  fight_tick_at_least 1 120000 || { log "the reloaded drill never stepped to P4 tick 1"; return 1; }
  ab press "$KEYBIND_DEFAULT_KEY" >/dev/null && ab wait 300 >/dev/null || return 1
  probe "snapshot().panel" >"$VERIFY_DIR/keybinds-old-key.json"
  ab press "$KEYBIND_NEW_KEY" >/dev/null && ab wait 300 >/dev/null || return 1
  probe "snapshot().panel" >"$VERIFY_DIR/keybinds-reloaded.json"
  ab screenshot "$VERIFY_DIR/keybinds-reloaded.png" >/dev/null || { log "reloaded key screenshot failed"; return 1; }
  bind_inventory_key "$KEYBIND_DEFAULT_KEY" || { log "the default inventory key was not restored"; return 1; }
  probe "snapshot().panel" >"$VERIFY_DIR/keybinds-restored.json"
  ab console >"$VERIFY_DIR/keybinds-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/keybinds-page-errors.json" || { log "page error capture failed"; return 1; }
}

seed_run() {
  local box seed search
  box="$(ab --json get value "#seed" | json data.value)" || return 1
  seed="$(probe "log().header.seed")" || return 1
  search="$(ab --json eval "location.search" | json data.result)" || return 1
  node -e 'console.log(JSON.stringify({ box: process.argv[1], seed: Number(process.argv[2]), search: process.argv[3] }))' "$box" "$seed" "$search"
}

restart_run() {
  local loaded
  loaded="$(ab --json eval "performance.timeOrigin" | json data.result)" || return 1
  ab click "#restart" >/dev/null || return 1
  ab wait --fn "performance.timeOrigin !== ${loaded} && (window.__archiveOcellusProbe?.snapshot().fight?.run.tick ?? -1) >= 0" --timeout 120000 >/dev/null || { log "Restart never loaded a new run"; return 1; }
}

drive_seed() {
  local fresh restarted typed
  ab open "$URL" >/dev/null || return 1
  fight_tick_at_least 0 120000 || { log "the unseeded run never took its first P4 step"; return 1; }
  fresh="$(seed_run)" || return 1
  ab screenshot "$VERIFY_DIR/seed-fresh.png" >/dev/null || { log "fresh seed screenshot failed"; return 1; }
  restart_run || return 1
  restarted="$(seed_run)" || return 1
  ab fill "#seed" "$(json box <<<"$fresh")" >/dev/null || { log "the seed box did not take the typed seed"; return 1; }
  restart_run || return 1
  typed="$(seed_run)" || return 1
  echo "{\"fresh\":${fresh},\"restarted\":${restarted},\"typed\":${typed}}" >"$VERIFY_DIR/seed.json"
  ab screenshot "$VERIFY_DIR/seed.png" >/dev/null || { log "typed seed screenshot failed"; return 1; }
  ab console >"$VERIFY_DIR/seed-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/seed-page-errors.json" || { log "page error capture failed"; return 1; }
}

wait_until_ticking() {
  ab wait --fn "window.__archiveOcellusProbe?.snapshot().ticking === true && window.__archiveOcellusProbe.snapshot().tick >= 8" --timeout 90000 >/dev/null || { log "the drill never started ticking"; return 1; }
}

walk_by_click() {
  click_at "$1" "$2" || return 1
  ab wait --fn "(() => { const s = window.__archiveOcellusProbe.snapshot(), to = $3; return s.player.x === to.x && s.player.y === to.y; })()" \
    --timeout 15000 >/dev/null || log "player never stood on $3"
}

drive_walkway() {
  local arrived
  ab open "${URL}${WALKWAY_QUERY}" >/dev/null && wait_until_ticking && canvas_centre || return 1
  echo "{\"x\":$((CX - WALKWAY_CLICK_LEFT_PX)),\"y\":${CY}}" >"$VERIFY_DIR/walkway-click.json"
  walk_by_click $((CX - WALKWAY_CLICK_LEFT_PX)) "$CY" "$WALKWAY_STOP_TILE" || return 1
  arrived="$(probe "snapshot()")"
  echo "$arrived" >"$VERIFY_DIR/walkway-arrived.json"
  ab wait --fn "window.__archiveOcellusProbe.snapshot().tick >= $(json tick <<<"$arrived") + ${EDGE_HOLD_TICKS}" --timeout 15000 >/dev/null
  probe "snapshot()" >"$VERIFY_DIR/walkway.json"
  probe "log()" >"$VERIFY_DIR/walkway-log.json"
  ab screenshot "$VERIFY_DIR/walkway.png" >/dev/null || { log "walkway screenshot failed"; return 1; }
  ab console >"$VERIFY_DIR/walkway-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/walkway-page-errors.json" || { log "page error capture failed"; return 1; }
}

drive_corner() {
  local step
  ab open "${URL}${CORNER_QUERY}" >/dev/null && wait_until_ticking && canvas_centre || return 1
  walk_by_click $((CX + CORNER_HOLE_CLICK_RIGHT_PX)) $((CY - CORNER_HOLE_CLICK_UP_PX)) "$CORNER_HOLE_TILE" || return 1
  probe "snapshot()" >"$VERIFY_DIR/corner-hole.json"
  probe "log()" >"$VERIFY_DIR/corner-hole-log.json"
  ab wait 1000 >/dev/null && ab screenshot "$VERIFY_DIR/corner-hole.png" >/dev/null || { log "corner screenshot failed"; return 1; }
  ab open "${URL}${CORNER_QUERY}" >/dev/null && wait_until_ticking || return 1
  walk_by_click $((CX + CORNER_NUB_CLICK_RIGHT_PX)) $((CY - CORNER_NUB_CLICK_UP_PX)) "$CORNER_NUB_TILE" || return 1
  probe "snapshot()" >"$VERIFY_DIR/corner-nub.json"
  probe "log()" >"$VERIFY_DIR/corner-nub-log.json"
  ab console >"$VERIFY_DIR/corner-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/corner-page-errors.json" || { log "page error capture failed"; return 1; }
  ab open "${URL}${CORNER_QUERY}" >/dev/null && wait_until_ticking || return 1
  walk_by_click $((CX + CORNER_VIEW_CLICK_RIGHT_PX)) $((CY - CORNER_VIEW_CLICK_UP_PX)) "$CORNER_VIEW_TILE" || return 1
  ab mouse move "$CX" $((CY + 100)) >/dev/null && ab mouse down middle >/dev/null || return 1
  for step in 1 2 3 4 5; do
    ab mouse move $((CX - step * CORNER_VIEW_DRAG_LEFT_PX / 5)) $((CY + 100)) >/dev/null || return 1
  done
  ab mouse up middle >/dev/null && ab wait 1500 >/dev/null || return 1
  ab screenshot "$VERIFY_DIR/corner-view.png" >/dev/null || { log "corner view screenshot failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/corner-view-page-errors.json" || { log "page error capture failed"; return 1; }
}

drive_floor_holes() {
  ab open "${URL}${HOLES_QUERY}" >/dev/null && wait_until_ticking && canvas_centre || return 1
  ab wait 1200 >/dev/null && ab screenshot "$VERIFY_DIR/holes-drawn.png" >/dev/null || { log "holes screenshot failed"; return 1; }
  shot_after_tick "$HOLE_FLOOD_SHOT_TICK" 300 holes-flood.png || { log "the holes drill never reached P4 tick ${HOLE_FLOOD_SHOT_TICK}"; return 1; }
  echo "{\"x\":$((CX - HOLE_CLICK_LEFT_PX)),\"y\":$((CY - HOLE_CLICK_UP_PX))}" >"$VERIFY_DIR/hole-click.json"
  walk_by_click $((CX - HOLE_CLICK_LEFT_PX)) $((CY - HOLE_CLICK_UP_PX)) "$HOLE_TILE" || return 1
  ab wait --fn "window.__archiveOcellusProbe.log().rows.flatMap((row) => row.events).filter((e) => e.kind === 'hole-hit').length >= ${HOLE_HITS}" \
    --timeout 15000 >/dev/null || log "the player on the hole never took ${HOLE_HITS} hits"
  ab screenshot "$VERIFY_DIR/hole-hit.png" >/dev/null || { log "hole hit screenshot failed"; return 1; }
  probe "log()" >"$VERIFY_DIR/holes.json"
  ab console >"$VERIFY_DIR/holes-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/holes-page-errors.json" || { log "page error capture failed"; return 1; }
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
  fight_tick_at_least "$SOUL_SPLIT_HEAL_TICK" 30000 || { log "the transition drill never stepped to the Soul Split heal at P4 tick ${SOUL_SPLIT_HEAL_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/special.json"
  ab console >"$VERIFY_DIR/special-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/special-page-errors.json" || { log "page error capture failed"; return 1; }

  save_sound_settings true || { log "the sound settings were not saved"; return 1; }
  keep_seed && ab click "#restart" >/dev/null || { log "Restart was not clicked"; return 1; }
  ab wait --fn "new URLSearchParams(location.search).has('setup')" --timeout 30000 >/dev/null || { log "Restart did not reload the transition drill"; return 1; }
  fight_tick_at_least 0 120000 || { log "the late-prayer drill never started"; return 1; }
  record_audio_starts || { log "the audio probe was not installed"; return 1; }
  click_after_tick "$SPECIAL_HIT_TICK" "$PROTECT_MAGIC_RIGHT_PX" "$PROTECT_DOWN_PX" || { log "the late Protect from Magic was not clicked"; return 1; }
  shot_after_tick "$SOUL_SPLIT_HEAL_TICK" 0 special-heal.png || { log "Soul Split heal screenshot failed"; return 1; }
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

drive_overheads_rifts() {
  local shot
  ab open "${URL}${RIFT_QUERY}" >/dev/null || return 1
  fight_tick_at_least 0 120000 || { log "the rifts drill never loaded"; return 1; }
  save_sound_settings true || { log "the sound settings were not saved"; return 1; }
  keep_seed && ab click "#restart" >/dev/null || { log "Restart was not clicked"; return 1; }
  ab wait --fn "new URLSearchParams(location.search).has('setup')" --timeout 30000 >/dev/null || { log "Restart did not reload the rifts drill"; return 1; }
  fight_tick_at_least 0 120000 || { log "the rifts drill never started"; return 1; }
  record_audio_starts || { log "the audio probe was not installed"; return 1; }
  record_overhead_draws || { log "the overhead draw probe was not installed"; return 1; }
  canvas_centre || { log "canvas box unreadable"; return 1; }
  for shot in $OVERHEAD_SHOT_TICKS; do
    shot_after_tick "$shot" 0 "overhead-${shot}.png" || { log "overhead screenshot at P4 tick ${shot} failed"; return 1; }
  done
  shot_after_tick "$RIFT_CLICK_TICK" 0 rift-spawned.png || { log "rift spawn screenshot failed"; return 1; }
  click_after_tick "$RIFT_CLICK_TICK" "-$NORTH_EAST_RIFT_CLICK_LEFT_PX" "-$NORTH_EAST_RIFT_CLICK_UP_PX" || { log "the north-east rift was not clicked"; return 1; }
  ab wait --fn "window.__archiveOcellusProbe.log().rows.some((row) => row.events.some((e) => e.kind === 'rift-destroyed'))" --timeout 30000 >/dev/null || { log "no rift was destroyed after the click"; return 1; }
  ab wait "$CHAT_POLL_WAIT_MS" >/dev/null
  ab screenshot "$VERIFY_DIR/rift-destroyed.png" >/dev/null || { log "rift kill screenshot failed"; return 1; }
  ab --json get text "#game_chat" >"$VERIFY_DIR/rift-chat.json" || { log "chat text capture failed"; return 1; }
  shot_after_tick "$RIFT_BURST_TICK" 0 rift-burst.png || { log "rift burst screenshot failed"; return 1; }
  fight_tick_at_least $((RIFT_BURST_TICK + 1)) 30000 || { log "the rifts drill never stepped past the burst at P4 tick ${RIFT_BURST_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/rifts.json"
  ab --json eval "window.__cueAudio" | json data.result >"$VERIFY_DIR/rift-audio.json" || { log "audio capture failed"; return 1; }
  ab --json eval "window.__overheadDraws" | json data.result >"$VERIFY_DIR/overhead-draws.json" || { log "overhead draw capture failed"; return 1; }
  ab console >"$VERIFY_DIR/rift-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/rift-page-errors.json" || { log "page error capture failed"; return 1; }
  save_sound_settings false || { log "the sound settings were not restored"; return 1; }

  ab open "${URL}${DEFLECT_QUERY}" >/dev/null || return 1
  canvas_centre || { log "canvas box unreadable"; return 1; }
  click_after_tick "$DEFLECT_CLICK_TICK" "$RISEN_BOSS_CLICK_RIGHT_PX" "$RISEN_BOSS_CLICK_DOWN_PX" || { log "the risen boss was not clicked"; return 1; }
  shot_after_tick "$DEFLECT_HOVER_SHOT_TICK" 0 hover-out-of-reach.png || { log "hovering boss screenshot failed"; return 1; }
  shot_after_tick "$DEFLECT_BLOCKED_SHOT_TICK" 0 deflect-blocked.png || { log "deflected attack screenshot failed"; return 1; }
  fight_tick_at_least "$DEFLECT_LAST_TICK" 60000 || { log "the deflect drill never stepped to P4 tick ${DEFLECT_LAST_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/deflect.json"
  ab console >"$VERIFY_DIR/deflect-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/deflect-page-errors.json" || { log "page error capture failed"; return 1; }
}

audio_contexts() {
  ab --json eval "(window.__audioContexts ?? []).map((context) => context.state)" | json data.result
}

sound_toggles() {
  printf '{"sound":{"visible":%s,"checked":%s},"areaSound":{"visible":%s,"checked":%s}}\n' \
    "$(ab --json is visible "#sound" | json data.visible)" "$(ab --json is checked "#sound" | json data.checked)" \
    "$(ab --json is visible "#area_sound" | json data.visible)" "$(ab --json is checked "#area_sound" | json data.checked)"
}

audio_resumed() {
  ab wait --fn "(window.__audioContexts ?? []).length > 0 && window.__audioContexts.every((context) => context.state === 'running')" --timeout 5000 >/dev/null
}

drive_cues() {
  local BROWSER_SESSION="${BROWSER_SESSION}-autoplay"
  echo "$AUTOPLAY_POLICY_JS" >"$VERIFY_DIR/autoplay-policy.js"
  ab --init-script "$VERIFY_DIR/autoplay-policy.js" set viewport 1280 800 >/dev/null || { log "the autoplay session did not start"; return 1; }
  ab open "${URL}${CUE_QUERY}" >/dev/null || return 1
  fight_tick_at_least 0 120000 || { log "the cue drill never started"; return 1; }
  record_audio_starts || { log "the audio probe was not installed"; return 1; }
  probe "snapshot().fight.run.tick" >"$VERIFY_DIR/cue-recording-from.json"
  audio_contexts >"$VERIFY_DIR/cue-contexts-loaded.json" || { log "audio context capture failed"; return 1; }
  sound_toggles >"$VERIFY_DIR/cue-toggles-off.json" || { log "sound toggle capture failed"; return 1; }
  fight_tick_at_least "$CUE_TOGGLE_TICK" 30000 || { log "the cue drill never stepped to P4 tick ${CUE_TOGGLE_TICK}"; return 1; }
  ab click "#area_sound" >/dev/null && ab click "#sound" >/dev/null || { log "the sound toggles were not clicked"; return 1; }
  probe "snapshot().fight.run.tick" >"$VERIFY_DIR/cue-toggle-click.json"
  audio_resumed || log "the audio context did not resume after the toggle click"
  audio_contexts >"$VERIFY_DIR/cue-contexts-toggled.json" || { log "audio context capture failed"; return 1; }
  sound_toggles >"$VERIFY_DIR/cue-toggles-on.json" || { log "sound toggle capture failed"; return 1; }
  ab --json eval "localStorage.getItem('${SOUND_SETTINGS_KEY}')" | json data.result >"$VERIFY_DIR/cue-sound-saved.json" || { log "saved settings capture failed"; return 1; }
  fight_tick_at_least "$CUE_LAST_TICK" 60000 || { log "the cue drill never stepped to P4 tick ${CUE_LAST_TICK}"; return 1; }
  ab --json eval "window.__cueAudio" | json data.result >"$VERIFY_DIR/cue-toggle-audio.json" || { log "audio capture failed"; return 1; }
  ab console >"$VERIFY_DIR/cue-toggle-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/cue-toggle-page-errors.json" || { log "page error capture failed"; return 1; }

  keep_seed && ab click "#restart" >/dev/null || { log "Restart was not clicked"; return 1; }
  ab wait --fn "new URLSearchParams(location.search).has('setup')" --timeout 30000 >/dev/null || { log "Restart did not reload the cue drill"; return 1; }
  fight_tick_at_least 0 120000 || { log "the reloaded cue drill never started"; return 1; }
  record_audio_starts || { log "the audio probe was not installed"; return 1; }
  audio_contexts >"$VERIFY_DIR/cue-contexts-reloaded.json" || { log "audio context capture failed"; return 1; }
  sound_toggles >"$VERIFY_DIR/cue-toggles-reloaded.json" || { log "sound toggle capture failed"; return 1; }
  canvas_centre || { log "canvas box unreadable"; return 1; }
  click_after_tick 0 0 0 || { log "the canvas was not clicked"; return 1; }
  audio_resumed || log "the audio context did not resume after the canvas click"
  audio_contexts >"$VERIFY_DIR/cue-contexts-clicked.json" || { log "audio context capture failed"; return 1; }
  fight_tick_at_least "$CUE_CHAT_BEFORE_TICK" 30000 || { log "the cue drill never stepped to P4 tick ${CUE_CHAT_BEFORE_TICK}"; return 1; }
  ab --json get text "#game_chat" >"$VERIFY_DIR/cue-chat-before.json" || { log "chat text capture failed"; return 1; }
  fight_tick_at_least "$CUE_CHAT_TICK" 30000 || { log "the cue drill never stepped to the lifeforce tell at P4 tick ${CUE_CHAT_TICK}"; return 1; }
  ab wait "$CHAT_POLL_WAIT_MS" >/dev/null
  ab --json get text "#game_chat" >"$VERIFY_DIR/cue-chat.json" || { log "chat text capture failed"; return 1; }
  fight_tick_at_least "$CUE_LAST_TICK" 60000 || { log "the reloaded cue drill never stepped to P4 tick ${CUE_LAST_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/cues.json"
  ab --json eval "window.__cueAudio" | json data.result >"$VERIFY_DIR/cue-audio.json" || { log "audio capture failed"; return 1; }
  ab console >"$VERIFY_DIR/cue-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/cue-page-errors.json" || { log "page error capture failed"; return 1; }
  ab close >/dev/null 2>&1
}

drive() {
  ab set viewport 1280 800 >/dev/null || return 1
  # A new browser's first screenshot takes about 10 s, longer than the hidden lead-in, so it goes to a blank page.
  ab open about:blank >/dev/null && ab screenshot "$VERIFY_DIR/warm-up.png" >/dev/null || { log "warm-up screenshot failed"; return 1; }
  ab open "${URL}${DRILL_QUERY}" >/dev/null || return 1
  drive_lead_in || return 1
  ab wait --fn "window.__archiveOcellusProbe?.snapshot().ticking === true && window.__archiveOcellusProbe.snapshot().tick >= 8" \
    --timeout 90000 >/dev/null || { log "trainer never started ticking"; return 1; }
  drive_walk && drive_edge && drive_cycle && drive_focus && drive_void_floor && drive_lifeforce_orb && drive_explosions && drive_void_shot && drive_transition_attack && drive_loadouts && drive_defence_floor && drive_supplies && drive_keybinds && drive_overheads_rifts && drive_seed && drive_floor_holes && drive_walkway && drive_corner && drive_cues || return 1

  local capture
  for capture in hidden.json hidden.png before.json before.png after.json after.png edge-click.json edge-arrived.json edge.json edge.png boss.png cycle-ring-click.json cycle-snapshot.json cycle.json console.log page-errors.json focus.json focus.png focus-console.log focus-page-errors.json \
    void-inner.png void-flood.png void-floor.json void-console.log void-page-errors.json \
    attack-click.json ring-click.json flood-ring.png void-shot.json void-shot-console.log void-shot-page-errors.json \
    orb-hit.png $(seq -f "orb-dormant-%g.png" 1 "$ORB_FRAMES") $(seq -f "orb-glow-%g.png" 1 "$ORB_FRAMES") orb-click.json orb.json orb-console.log orb-page-errors.json orb-skip.png orb-skip.json orb-skip-console.log orb-skip-page-errors.json \
    explosion-left.png explosion-standing.png explosions.json explosion-audio.json explosion-console.log explosion-page-errors.json explosion-under.png explosions-under.json explosion-under-console.log explosion-under-page-errors.json \
    special-before.png special-vortex.png special-spike-disk.png special-semicircle.png special-black-disk.png special.json special-console.log special-page-errors.json special-late.json special-audio.json special-late-console.log special-late-page-errors.json \
    loadout-before.json loadout-ranged.png icons.json equipment-ranged.png loadout-after.json loadout-melee.png loadout-spec.json loadout-spec.png equipment-melee.png \
    loadout-console.log loadout-page-errors.json loadout-selector.json loadout-selector-page-errors.json \
    defence-floor-start.json defence-floor-first.json defence-floor.json defence-floor-log.json defence-floor.png defence-floor-console.log defence-floor-page-errors.json \
    supplies-inventory.json item-menu.json item-menu.png item-menu-closed.json brew-click.json brew-hp.json brew-heal.png supplies-console.log supplies-page-errors.json \
    keybinds-open.json keybinds.png keybinds-bound.json keybinds-saved.json keybinds-old-key.json keybinds-reloaded.json keybinds-reloaded.png keybinds-restored.json keybinds-console.log keybinds-page-errors.json special-heal.png \
    $(printf 'overhead-%s.png ' $OVERHEAD_SHOT_TICKS) overhead-draws.json rift-spawned.png rift-destroyed.png rift-chat.json rift-burst.png rifts.json rift-audio.json rift-console.log rift-page-errors.json \
    hover-out-of-reach.png deflect-blocked.png deflect.json deflect-console.log deflect-page-errors.json \
    seed-fresh.png seed.json seed.png seed-console.log seed-page-errors.json \
    holes-drawn.png holes-flood.png hole-click.json hole-hit.png holes.json holes-console.log holes-page-errors.json \
    walkway-click.json walkway-arrived.json walkway.json walkway-log.json walkway.png walkway-console.log walkway-page-errors.json \
    corner-hole.json corner-hole-log.json corner-hole.png corner-nub.json corner-nub-log.json corner-console.log corner-page-errors.json corner-view.png corner-view-page-errors.json \
    autoplay-policy.js cue-recording-from.json cue-contexts-loaded.json cue-toggles-off.json cue-toggle-click.json cue-contexts-toggled.json cue-toggles-on.json cue-sound-saved.json cue-toggle-audio.json cue-toggle-console.log cue-toggle-page-errors.json \
    cue-contexts-reloaded.json cue-toggles-reloaded.json cue-contexts-clicked.json cue-chat-before.json cue-chat.json cues.json cue-audio.json cue-console.log cue-page-errors.json; do
    [[ -s "$VERIFY_DIR/$capture" ]] || { log "required capture ${capture} is missing or empty"; return 1; }
  done

  node -e '
    const [dir, spawn, target, edgeOrder, edgeStop, holdTicks, bossNpc, lastHiddenTick, lastTick, stages, overheads, specials, focusKey, focusBeats, square, floodDamage, floodLast, voidHits, voidEnd, voidPixel, rangedWorn, meleeWorn, drain, orbExpected, orbBox, orbFrames,
      innerMarks, lateMark, explosionPixel, explosionExpected, soundSamples, explosionSounds, centreX, centreY, tellBox, specialExpected,
      tellCentreBox, transitionSamples, landingSounds, landingWindows, styleSounds, styleWindows, soundTolerance,
      supplyInventory, namedMenu, hpAfterBrew, defaultKey, newKey, trainerIcons, brewY, hoverNamePixel, overheadShots, iconBox, riftExpected, burstTick, soulSplitExpected, killChat,
      riftSoundSamples, riftSpawnSounds, riftKillSound, riftBurstSounds, riftSoundWindow, gapDraws, hoverTile, hoverTicks, firstMeleeTick,
      walkwayOrder, walkwayStop, walkwayPixel, walkwayMinShare, cornerHole, cornerNub,
      holeLayout, holePixels, holeFreePixels, holeBoxHalf, holeMinDark, holeMaxDark, holeTile, holeHits, holeDamage,
      cueSoundSamples, cueSounds, cueSoundWindow, cueChat, floorSteps] = process.argv.slice(1);
    const fs = require("fs");
    const read = (file) => JSON.parse(fs.readFileSync(`${dir}/${file}`, "utf8"));
    const [hidden, before, after, edgeArrived, edge, errors, cycle, snapshot, focus, focusErrors, voidLog, voidErrors, shot, shotErrors] =
      ["hidden.json", "before.json", "after.json", "edge-arrived.json", "edge.json", "page-errors.json", "cycle.json", "cycle-snapshot.json", "focus.json", "focus-page-errors.json", "void-floor.json", "void-page-errors.json", "void-shot.json", "void-shot-page-errors.json"].map(read);
    const [dressed, switched, spec, selector, loadoutErrors, selectorErrors] =
      ["loadout-before.json", "loadout-after.json", "loadout-spec.json", "loadout-selector.json", "loadout-page-errors.json", "loadout-selector-page-errors.json"].map(read);
    const [orbLog, orbClick, orbErrors, orbSkip, orbSkipErrors] = ["orb.json", "orb-click.json", "orb-page-errors.json", "orb-skip.json", "orb-skip-page-errors.json"].map(read);
    const [explosionLog, explosionAudio, explosionErrors, underLog, underErrors] = ["explosions.json", "explosion-audio.json", "explosion-page-errors.json", "explosions-under.json", "explosion-under-page-errors.json"].map(read);
    const [specialLog, specialErrors, lateLog, lateErrors, transitionAudio] = ["special.json", "special-page-errors.json", "special-late.json", "special-late-page-errors.json", "special-audio.json"].map(read);
    const [carried, itemMenu, itemMenuClosed, brewClick, brewHp, suppliesErrors] = ["supplies-inventory.json", "item-menu.json", "item-menu-closed.json", "brew-click.json", "brew-hp.json", "supplies-page-errors.json"].map(read);
    const icons = read("icons.json");
    const seeds = read("seed.json");
    const [walkwayArrived, walkwayHeld, walkwayLog, cornerAtHole, cornerHoleLog, cornerAtNub, cornerNubLog] =
      ["walkway-arrived.json", "walkway.json", "walkway-log.json", "corner-hole.json", "corner-hole-log.json", "corner-nub.json", "corner-nub-log.json"].map(read);
    const [seedErrors, walkwayErrors, cornerErrors, cornerViewErrors] = ["seed-page-errors.json", "walkway-page-errors.json", "corner-page-errors.json", "corner-view-page-errors.json"].map(read);
    const [holesLog, holesErrors] = ["holes.json", "holes-page-errors.json"].map(read);
    const [floorStart, floorFirst, floorLast, floorLog, floorErrors] = ["defence-floor-start.json", "defence-floor-first.json", "defence-floor.json", "defence-floor-log.json", "defence-floor-page-errors.json"].map(read);
    const floorGlaives = floorLog.rows.flatMap((row) => row.events.filter((event) => event.kind === "player-hit-judged")).slice(0, 4);
    const [keysOpen, keysBound, keysSaved, keysOldKey, keysReloaded, keysRestored, keybindsErrors] = ["keybinds-open.json", "keybinds-bound.json", "keybinds-saved.json", "keybinds-old-key.json", "keybinds-reloaded.json", "keybinds-restored.json", "keybinds-page-errors.json"].map(read);
    const [riftLog, riftChat, riftAudio, riftErrors, deflectLog, deflectErrors, overheadDraws] = ["rifts.json", "rift-chat.json", "rift-audio.json", "rift-page-errors.json", "deflect.json", "deflect-page-errors.json", "overhead-draws.json"].map(read);
    const [cueLog, cueToggleAudio, cueAudio, cueToggleErrors, cueErrors, cueSaved, cueChatBefore, cueChatAfter] =
      ["cues.json", "cue-toggle-audio.json", "cue-audio.json", "cue-toggle-page-errors.json", "cue-page-errors.json", "cue-sound-saved.json", "cue-chat-before.json", "cue-chat.json"].map(read);
    const [recordingFrom, toggledAt] = ["cue-recording-from.json", "cue-toggle-click.json"].map(read);
    const contexts = Object.fromEntries(["loaded", "toggled", "reloaded", "clicked"].map((when) => [when, read(`cue-contexts-${when}.json`)]));
    const toggles = Object.fromEntries(["off", "on", "reloaded"].map((when) => [when, read(`cue-toggles-${when}.json`)]));
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
    const nameRgb = [1, 3, 5].map((i) => parseInt(hoverNamePixel.slice(i, i + 2), 16));
    function hoverText(file) {
      const { width, channels, px } = decode(file);
      const columns = (rgb) => {
        const xs = [];
        for (let y = Number(brewY) + 19; y <= Number(brewY) + 40; y++) {
          for (let x = 0; x < width; x++) if (rgb.every((v, c) => px[(y * width + x) * channels + c] === v)) xs.push(x);
        }
        return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
      };
      return { width, action: columns([255, 255, 255]), name: columns(nameRgb) };
    }
    const readsInFull = (text) => text.action !== null && text.name !== null && text.action[1] < text.name[0] && text.name[1] <= text.width - 5;
    const want = [1, 3, 5].map((i) => parseInt(voidPixel.slice(i, i + 2), 16));
    const voidShare = (file) => pixelShare(file, (...rgb) => want.every((v, c) => Math.abs(rgb[c] - v) <= 10));
    const walkwayRgb = [1, 3, 5].map((i) => parseInt(walkwayPixel.slice(i, i + 2), 16));
    const walkOrders = (log) => log.rows.flatMap((row) => row.inputs.filter((i) => i.kind === "walk-ordered").map((i) => i.destination));
    const seedInUrl = (run) => new URLSearchParams(run.search).get("seed");
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
    const iconArea = fromCentre(iconBox);
    const iconColours = {
      blue: (r, g, b) => r <= 80 && g <= 190 && b >= 200,
      red: (r, g, b) => r >= 150 && r <= 240 && g <= 80 && b <= 80,
      orange: (r, g, b) => r >= 170 && g >= 100 && g <= 165 && b <= 100,
    };
    function iconIn(file) {
      const share = Object.fromEntries(Object.entries(iconColours).map(([name, matches]) => [name, pixelShare(file, matches, iconArea)]));
      const icon = share.blue >= 0.2 ? (share.red >= 0.2 ? "deflect-melee" : share.orange >= 0.06 ? "deflect-range" : "unknown") : share.red >= 0.2 ? "soul-split" : null;
      return { ...share, icon };
    }
    const overheadAt = (rows, t) => rowAt(rows, t)?.phase.overhead;
    const expectedRifts = JSON.parse(riftExpected);
    const riftSamplesOf = JSON.parse(riftSoundSamples);
    const [riftFrom, riftTo] = JSON.parse(riftSoundWindow);
    const riftTimed = (list) => list.map(([at, id]) => [at, riftSamplesOf[id]]);
    const riftHeard = (ids) => {
      const lengths = new Set(ids.map((id) => riftSamplesOf[id]));
      return riftAudio
        .filter((s) => s.rate === 22050 && s.tick !== null && lengths.has(s.samples) && s.tick + s.phase >= riftFrom && s.tick + s.phase < riftTo)
        .map((s) => [Math.round((s.tick + s.phase) * 100) / 100, s.samples]);
    };
    const [killOffset, killId] = JSON.parse(riftKillSound);
    const destroyedAt = kindOf(riftLog.rows, "rift-destroyed")[0]?.at ?? null;
    const riftExpectedSounds = {
      spawn: riftTimed(JSON.parse(riftSpawnSounds)),
      kill: destroyedAt === null ? [] : riftTimed([[destroyedAt + killOffset, killId]]),
      burst: riftTimed(JSON.parse(riftBurstSounds)),
    };
    const holeTiles = JSON.parse(holeLayout).tiles;
    const onHole = (tile) => holeTiles.some((hole) => same(tile, hole));
    const darkAround = (file, [, dx, dy]) => {
      const half = Number(holeBoxHalf), x = Number(centreX) + dx, y = Number(centreY) + dy;
      return pixelShare(file, (r, g, b) => Math.max(r, g, b) <= 30, { minX: x - half, maxX: x + half, minY: y - half, maxY: y + half });
    };
    const cueSamplesOf = JSON.parse(cueSoundSamples);
    const cueLengths = new Set(Object.values(cueSamplesOf));
    const [cueFrom, cueTo] = JSON.parse(cueSoundWindow);
    const cueHeard = (audio) => audio
      .filter((s) => s.rate === 22050 && s.tick !== null && cueLengths.has(s.samples) && s.tick + s.phase >= cueFrom && s.tick + s.phase < cueTo)
      .map((s) => [Math.round((s.tick + s.phase) * 100) / 100, s.samples, s.state]);
    const cueExpected = JSON.parse(cueSounds).map(([at, id]) => [at, cueSamplesOf[id]]);
    const savedSound = cueSaved?.values ?? {};
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
      defenceFloor: {
        bossDefence: [floorStart.boss.defence, floorFirst.boss.defence, floorLast.boss.defence],
        glaives: floorGlaives.map((event) => [event.at, event.outcome, event.requested]),
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
      supplies: {
        carried,
        itemMenu: [itemMenu, itemMenuClosed],
        brew: { clickedAt: brewClick, hp: brewHp.filter(([tick]) => tick >= brewClick - 1 && tick <= brewClick + 3) },
      },
      icons: Object.fromEntries(Object.keys(JSON.parse(trainerIcons)).map((id) => [id, icons[id] ?? null])),
      hoverText: { "brew-heal.png": hoverText("brew-heal.png"), "keybinds.png": hoverText("keybinds.png") },
      seeds,
      walkway: {
        orders: walkOrders(walkwayLog),
        arrived: [walkwayArrived.tick, walkwayArrived.player],
        held: [walkwayHeld.tick, walkwayHeld.player],
        share: pixelShare("walkway.png", (...rgb) => walkwayRgb.every((v, c) => Math.abs(rgb[c] - v) <= 4)),
      },
      corner: { orders: [...walkOrders(cornerHoleLog), ...walkOrders(cornerNubLog)], stood: [cornerAtHole.player, cornerAtNub.player] },
      holes: {
        layout: { key: holesLog.header.choices.floorHoleLayout.key, tiles: holesLog.header.choices.floorHoleLayout.option.value },
        darkShare: JSON.parse(holePixels).map((box) => ({ tile: box[0], drawn: darkAround("holes-drawn.png", box), flood: darkAround("holes-flood.png", box) })),
        freeDarkShare: JSON.parse(holeFreePixels).map((box) => ({ tile: box[0], drawn: darkAround("holes-drawn.png", box) })),
        rows: holesLog.rows.map((row) => ({
          tick: row.tick,
          stage: row.phase.stage,
          startedOn: row.playerAtBossStep.tile,
          hits: row.events.filter((e) => e.kind === "hole-hit").map((e) => ({ at: e.at, tile: e.tile, requested: e.receipt.requested })),
        })),
      },
      keybinds: {
        tabs: [keysOpen.tab, keysBound.tab, keysOldKey.tab, keysReloaded.tab],
        inventoryKey: [keysOpen.keys.inventory, keysBound.keys.inventory, keysSaved.values?.inventory_key ?? null, keysReloaded.keys.inventory, keysRestored.keys.inventory],
      },
      overheads: {
        box: iconArea,
        shots: overheadShots.split(" ").map(Number).map((t) => ({ tick: t, logged: [overheadAt(riftLog.rows, t), overheadAt(riftLog.rows, t + 1)], ...iconIn(`overhead-${t}.png`) })),
        gapDraws: Object.keys(JSON.parse(gapDraws)).map((t) => ({ tick: Number(t), logged: overheadAt(riftLog.rows, t) ?? null, frames: overheadDraws[t]?.frames ?? 0, sprites: [...(overheadDraws[t]?.sprites ?? [])].sort() })),
        hover: {
          standsOn: [...new Set(between(deflectLog.rows, ...JSON.parse(hoverTicks)).map((row) => JSON.stringify(row.playerAtPostTick.tile)))].map((tile) => JSON.parse(tile)),
          bossHp: [rowAt(deflectLog.rows, JSON.parse(hoverTicks)[0])?.bossHp.atBossStep, rowAt(deflectLog.rows, Number(firstMeleeTick) - 1)?.bossHp.atPostTick],
        },
        meleeJudged: kindOf(deflectLog.rows, "player-hit-judged").filter((e) => e.style === "melee").map((e) => {
          const hp = rowAt(deflectLog.rows, e.at)?.bossHp;
          return { at: e.at, overhead: overheadAt(deflectLog.rows, e.at), outcome: e.outcome, taken: hp ? hp.atBossStep - hp.atPostTick : null };
        }),
      },
      soulSplit: {
        protectedRunReached: rowAt(specialLog.rows, expectedSpecial.protected[0] + 2) !== undefined,
        protectedHeals: kindOf(specialLog.rows, "boss-healed").map((e) => [e.at, e.cause, e.receipt]),
        lateHeals: kindOf(lateLog.rows, "boss-healed").map((e) => [e.at, e.cause, e.receipt]),
      },
      rifts: {
        spawned: kindOf(riftLog.rows, "rift-spawned").map((e) => [e.at, e.rift, e.tile]),
        destroyed: kindOf(riftLog.rows, "rift-destroyed").map((e) => [e.at, e.rift]),
        bursts: kindOf(riftLog.rows, "rift-burst").map((e) => [e.at, e.rift, e.receipt]),
        chat: riftChat.data?.text ?? null,
        sounds: {
          spawn: riftHeard(JSON.parse(riftSpawnSounds).map(([, id]) => id)),
          kill: riftHeard([killId]),
          burst: riftHeard(JSON.parse(riftBurstSounds).map(([, id]) => id)),
          contexts: [...new Set(riftAudio.map((s) => s.state))],
        },
      },
      cues: {
        toggles,
        saved: { playsAudio: savedSound.playsAudio ?? null, playsAreaAudio: savedSound.playsAreaAudio ?? null },
        contexts,
        recordingFrom,
        toggledAt,
        beforeToggle: cueHeard(cueToggleAudio).filter(([at]) => at < toggledAt),
        afterToggle: cueHeard(cueToggleAudio).filter(([at]) => at >= toggledAt),
        heard: cueHeard(cueAudio),
        chat: [cueChatBefore.data?.text ?? null, cueChatAfter.data?.text ?? null],
        told: kindOf(cueLog.rows, "lifeforce-told").map((e) => e.at),
        spawned: kindOf(cueLog.rows, "orb-spawned").map((e) => [e.at, e.void, e.tile]),
      },
    };
    const sameJson = (a, b) => require("util").isDeepStrictEqual(a, JSON.parse(b));
    const share = observed.voidPixelShare;
    const orb = observed.orb;
    const { dodges, late: lateStep, under, shards: shardSpots, sounds } = observed.explosions;
    const [left, standing] = [shardSpots["explosion-left.png"], shardSpots["explosion-standing.png"]];
    const special = observed.special;
    const { shots: iconShots, gapDraws: drawnAroundGaps, hover, meleeJudged } = observed.overheads;
    const { soulSplit, rifts, cues } = observed;
    const allIn = (states, state) => states.length > 0 && states.every((s) => s === state);
    const timedOnly = (heard) => heard.map(([at, samples]) => [at, samples]);
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
      divisionStopsAtDefenceFloor: sameJson(observed.defenceFloor.bossDefence, floorSteps) && floorGlaives.length === 4 && floorGlaives.every((event) => event.outcome === "passed" && event.requested > 0),
      orbToldAndDrained: sameJson(orb.told, JSON.stringify(expectedOrb.told)) && sameJson(orb.drained, JSON.stringify(expectedOrb.drained)),
      orbSpawnedDormant: sameJson(orb.spawned, JSON.stringify(expectedOrb.spawned)),
      orbClickTargetedOrb: same(orb.clicked, orbTile),
      orbGlowsOnSchedule: sameJson(orb.matured, JSON.stringify(expectedOrb.matured)),
      orbReturnedTickAfterArrival: orb.returned.length === 1 && orb.returned[0][0] === readyAt + 1 && sameJson(orb.returned[0][1], JSON.stringify(expectedOrb.returned)),
      orbGlowDrawn: Math.max(...orb.tealShare.glow) - Math.max(...orb.tealShare.dormant) >= 3,
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
      itemNamedInMenu: sameJson(itemMenu, namedMenu) && itemMenuClosed === null,
      suppliesCarried: sameJson(carried, supplyInventory),
      brewHealedNextTick: (() => {
        const healed = brewHp.find(([, hp]) => hp !== 99);
        return healed !== undefined && healed[1] === Number(hpAfterBrew) && healed[0] > brewClick && healed[0] <= brewClick + 2;
      })(),
      keybindsButtonOpensSettings: keysOpen.tab === "SETTINGS" && keysOpen.keys.inventory === defaultKey,
      keyBoundAndSaved: keysBound.keys.inventory === newKey && keysSaved.values?.inventory_key === newKey,
      boundKeyOpensTabAfterReload: keysOldKey.tab === "PRAYER" && keysReloaded.tab === "INVENTORY" && keysReloaded.keys.inventory === newKey,
      defaultKeyRestored: keysRestored.keys.inventory === defaultKey,
      trainerItemsShowCacheIcons: Object.entries(JSON.parse(trainerIcons)).every(([id, size]) => icons[id]?.path === `/osrs-assets/item-icons/${id}.png` && icons[id].size === size),
      hoverTextOnCanvas: readsInFull(observed.hoverText["brew-heal.png"]) &&
        (readsInFull(observed.hoverText["keybinds.png"]) || (observed.hoverText["keybinds.png"].action === null && observed.hoverText["keybinds.png"].name === null)),
      overheadIconsDrawn: iconShots.every((shot) => shot.logged[0] !== undefined && shot.logged[0] === shot.logged[1] && shot.icon === shot.logged[0]),
      overheadDroppedBeforeEachVoid: drawnAroundGaps.every(({ tick, frames, sprites }) => frames > 0 && sameJson(sprites, JSON.stringify(JSON.parse(gapDraws)[tick]))) &&
        drawnAroundGaps.filter(({ sprites }) => sprites.length === 0).every(({ logged }) => logged === null),
      meleeCannotReachHoveringBoss: sameJson(hover.standsOn, `[${hoverTile}]`) && hover.bossHp[0] !== undefined && hover.bossHp[0] === hover.bossHp[1] &&
        meleeJudged.length > 0 && meleeJudged[0].at === Number(firstMeleeTick) && meleeJudged.every((e) => e.at >= Number(firstMeleeTick)),
      deflectBlocksMeleeUntilSoulSplit: meleeJudged.filter((e) => e.outcome === "blocked").length >= 2 && meleeJudged.filter((e) => e.outcome === "passed").length >= 2 &&
        meleeJudged.every((e) => e.outcome === (e.overhead === "deflect-melee" ? "blocked" : "passed") && (e.outcome === "passed" || e.taken === 0)) &&
        meleeJudged.reduce((sum, e) => sum + (e.outcome === "passed" ? e.taken : 0), 0) > 0,
      soulSplitHealsUnprotected: soulSplit.protectedRunReached && soulSplit.protectedHeals.length === 0 && sameJson(soulSplit.lateHeals, soulSplitExpected),
      riftsSpawnBesideBoss: sameJson(rifts.spawned, JSON.stringify(expectedRifts.spawned)),
      riftKilledByClick: rifts.destroyed.length === 1 && rifts.destroyed[0][1] === expectedRifts.destroyed && rifts.destroyed[0][0] <= Number(burstTick),
      killChatShown: rifts.chat === killChat,
      standingRiftBursts: sameJson(rifts.bursts, JSON.stringify(expectedRifts.bursts)),
      riftSpawnSoundsOnFrame: onSchedule(rifts.sounds.spawn, riftExpectedSounds.spawn) && sameJson(rifts.sounds.contexts, JSON.stringify(["running"])),
      riftKillSoundOnFrame: riftExpectedSounds.kill.length === 1 && onSchedule(rifts.sounds.kill, riftExpectedSounds.kill) && sameJson(rifts.sounds.contexts, JSON.stringify(["running"])),
      riftBurstSoundsOnFrames: onSchedule(rifts.sounds.burst, riftExpectedSounds.burst) && sameJson(rifts.sounds.contexts, JSON.stringify(["running"])),
      seedFreshAndShown: /^\d+$/.test(seeds.fresh.box) && Number(seeds.fresh.box) === seeds.fresh.seed && seeds.fresh.seed !== 1 && seedInUrl(seeds.fresh) === null,
      restartDrawsFreshSeed: seedInUrl(seeds.restarted) === null && seeds.restarted.seed !== seeds.fresh.seed && Number(seeds.restarted.box) === seeds.restarted.seed,
      typedSeedReplays: seedInUrl(seeds.typed) === seeds.fresh.box && seeds.typed.seed === seeds.fresh.seed && seeds.typed.box === seeds.fresh.box,
      walkwayClickStaysOnFloor: sameJson(observed.walkway.orders, `[${walkwayOrder}]`) && same(walkwayArrived.player, JSON.parse(walkwayStop)) && same(walkwayHeld.player, JSON.parse(walkwayStop)) &&
        walkwayHeld.tick - walkwayArrived.tick >= Number(holdTicks),
      walkwayDrawn: observed.walkway.share >= Number(walkwayMinShare),
      cornerFilled: sameJson(observed.corner.orders, `[${cornerHole},${cornerNub}]`) && sameJson(observed.corner.stood, `[${cornerHole},${cornerNub}]`),
      holesDrawnOnLayout: sameJson(observed.holes.layout, holeLayout) && observed.holes.darkShare.every((box) => onHole(box.tile) && box.drawn >= Number(holeMinDark)) &&
        observed.holes.freeDarkShare.every((box) => !onHole(box.tile) && box.drawn <= Number(holeMaxDark)),
      holesHiddenUnderFlood: observed.holes.darkShare.every((box) => box.flood <= Number(holeMaxDark)),
      holeHitsStandingOnIt: (() => {
        const { rows } = observed.holes, hits = rows.flatMap((row) => row.hits), damage = JSON.parse(holeDamage);
        return rows.every((row) => row.hits.length === (onHole(row.startedOn) ? 1 : 0) && row.hits.every((hit) => hit.at === row.tick)) && rows.some((row) => !onHole(row.startedOn)) &&
          hits.length >= Number(holeHits) && hits.every((hit) => same(hit.tile, JSON.parse(holeTile)) && hit.requested >= damage.min && hit.requested <= damage.max);
      })(),
      soundTogglesShownOff: cues.toggles.off.sound.visible && cues.toggles.off.areaSound.visible && !cues.toggles.off.sound.checked && !cues.toggles.off.areaSound.checked,
      soundTogglesTurnOnCues: recordingFrom < 5 && cues.beforeToggle.length === 0 && cues.toggles.on.sound.checked && cues.toggles.on.areaSound.checked &&
        onSchedule(timedOnly(cues.afterToggle), cueExpected.filter(([at]) => at >= toggledAt)) && cues.afterToggle.every(([, , state]) => state === "running"),
      soundChoiceSaved: cues.saved.playsAudio === true && cues.saved.playsAreaAudio === true && cues.toggles.reloaded.sound.checked && cues.toggles.reloaded.areaSound.checked,
      audioResumesOnFirstPointerdown: allIn(cues.contexts.loaded, "suspended") && allIn(cues.contexts.toggled, "running") && allIn(cues.contexts.reloaded, "suspended") && allIn(cues.contexts.clicked, "running"),
      cueSoundsOnSchedule: onSchedule(timedOnly(cues.heard), cueExpected) && cues.heard.every(([, , state]) => state === "running"),
      lifeforceChatOnTell: cues.chat[0] === "" && cues.chat[1] === cueChat && sameJson(cues.told, "[11,42]"),
      noPageErrors: [errors, focusErrors, voidErrors, shotErrors, orbErrors, orbSkipErrors, explosionErrors, underErrors, specialErrors, lateErrors, loadoutErrors, selectorErrors, floorErrors, suppliesErrors, keybindsErrors, riftErrors, deflectErrors, seedErrors, holesErrors, walkwayErrors, cornerErrors, cornerViewErrors, cueToggleErrors, cueErrors].every((list) => list.length === 0),
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
    "$TELL_CENTRE_BOX" "$TRANSITION_SOUND_SAMPLES" "$LANDING_SOUNDS" "$LANDING_WINDOWS" "$STYLE_SOUNDS" "$STYLE_WINDOWS" "$SOUND_TOLERANCE_TICKS" \
    "$SUPPLY_INVENTORY" "$SUPPLY_NAMED_MENU" "$SUPPLY_HP_AFTER_BREW" "$KEYBIND_DEFAULT_KEY" "$KEYBIND_NEW_KEY" \
    "$LOADOUT_TRAINER_ICONS" "$((LOADOUT_SLOT_Y + SUPPLY_BREW_SLOT / 4 * LOADOUT_SLOT_DY))" "$SUPPLY_HOVER_NAME_PIXEL" \
    "$OVERHEAD_SHOT_TICKS" "$ICON_BOX" "$RIFT_EXPECTED" "$RIFT_BURST_TICK" "$SOUL_SPLIT_EXPECTED" "$KILL_CHAT" \
    "$RIFT_SOUND_SAMPLES" "$RIFT_SPAWN_SOUNDS" "$RIFT_KILL_SOUND" "$RIFT_BURST_SOUNDS" "$RIFT_SOUND_WINDOW" "$OVERHEAD_GAP_DRAWS" \
    "$DEFLECT_HOVER_TILE" "$DEFLECT_HOVER_TICKS" "$DEFLECT_FIRST_MELEE_TICK" \
    "$WALKWAY_ORDER_TILE" "$WALKWAY_STOP_TILE" "$WALKWAY_PIXEL" "$WALKWAY_MIN_SHARE" "$CORNER_HOLE_TILE" "$CORNER_NUB_TILE" \
    "$HOLE_LAYOUT" "$HOLE_PIXELS" "$HOLE_FREE_PIXELS" "$HOLE_BOX_HALF_PX" "$HOLE_MIN_DARK_SHARE" "$HOLE_MAX_DARK_SHARE" "$HOLE_TILE" "$HOLE_HITS" "$HOLE_DAMAGE" \
    "$CUE_SOUND_SAMPLES" "$CUE_SOUNDS" "$CUE_SOUND_WINDOW" "$CUE_CHAT" "$DEFENCE_FLOOR_STEPS" >"$VERIFY_DIR/observed.json"
  local verdict=$?
  cat "$VERIFY_DIR/observed.json"
  return $verdict
}

release_browser() {
  ab close >/dev/null 2>&1
  agent-browser --session "${BROWSER_SESSION}-autoplay" close >/dev/null 2>&1
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
