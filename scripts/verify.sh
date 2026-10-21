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
SPAWN_TILE='{"x":10,"y":10}'
WALK_CLICK_RIGHT_PX=160
WALK_CLICK_DOWN_PX=50
WALK_TARGET_TILE='{"x":13,"y":11}'
CYCLE_LAST_HIDDEN_TICK=3
CYCLE_LAST_TICK=70
CYCLE_STAGE_ENTRIES='[[0,"lead-in"],[8,"inner-void"],[30,"after-inner"],[39,"outer-void"],[59,"after-outer"],[68,"inner-void"]]'
CYCLE_OVERHEAD_SWITCHES='[[8,"deflect-melee"],[33,"soul-split"],[39,"deflect-range"],[61,"soul-split"],[68,"deflect-melee"]]'
CYCLE_SPECIAL_HITS='[[37,"vortex"],[65,"spike-disk"]]'
FOCUS_DRILL="transition-attacks"
FOCUS_LAST_TICK=40
FOCUS_BEATS='["boss-shouts","soul-split-heal","special-hit","special-tell"]'
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
  [[ -f "$MANIFEST" ]] && node -e '
    const m = require(process.argv[1]);
    process.exit(m.cache?.source === "openrs2:2746" && m.assets?.[`npc-${process.argv[2]}`] ? 0 : 1);
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
    log "assets: manifest already has npc-${BOSS_NPC} from openrs2:2746, skipping rebuild" | tee "$VERIFY_DIR/assets.log"
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

drive_walk() {
  local before after box cx cy credit
  before="$(probe "snapshot()")"
  echo "$before" >"$VERIFY_DIR/before.json"
  ab screenshot "$VERIFY_DIR/before.png" >/dev/null || { log "before screenshot failed"; return 1; }

  credit="$(ab --json get text "#credit_line" | json data.text)"
  [[ "$credit" == "$CREDIT_LINE" ]] || { log "credit line text differs: ${credit}"; return 1; }
  [[ "$(ab --json is visible "#credit_line" | json data.visible)" == "true" ]] || { log "credit line is not visible"; return 1; }

  box="$(ab --json get box "#world")"
  cx=$(( $(json data.x <<<"$box") + $(json data.width <<<"$box") / 2 + WALK_CLICK_RIGHT_PX ))
  cy=$(( $(json data.y <<<"$box") + $(json data.height <<<"$box") / 2 + WALK_CLICK_DOWN_PX ))
  echo "{\"x\":${cx},\"y\":${cy}}" >"$VERIFY_DIR/click.json"
  ab mouse move "$cx" "$cy" >/dev/null && ab mouse down left >/dev/null && ab mouse up left >/dev/null || return 1

  ab wait --fn "(() => { const s = window.__archiveOcellusProbe.snapshot(), spawn = ${SPAWN_TILE}; return (s.player.x !== spawn.x || s.player.y !== spawn.y) && s.player.x === s.destination.x && s.player.y === s.destination.y; })()" \
    --timeout 15000 >/dev/null || log "player did not settle on a new tile after the click"
  after="$(probe "snapshot()")"
  echo "$after" >"$VERIFY_DIR/after.json"
  ab wait 1200 >/dev/null
  ab screenshot "$VERIFY_DIR/after.png" >/dev/null || { log "after screenshot failed"; return 1; }
}

drive_lead_in() {
  fight_tick_at_least 0 90000 || { log "the boss never took its first P4 step"; return 1; }
  ab screenshot "$VERIFY_DIR/hidden.png" >/dev/null || { log "lead-in screenshot failed"; return 1; }
  probe "snapshot()" >"$VERIFY_DIR/hidden.json"
}

drive_cycle() {
  fight_tick_at_least 12 30000 || { log "the boss never stepped to P4 tick 12"; return 1; }
  ab screenshot "$VERIFY_DIR/boss.png" >/dev/null || { log "boss screenshot failed"; return 1; }
  fight_tick_at_least "$CYCLE_LAST_TICK" 90000 || { log "the boss never stepped to P4 tick ${CYCLE_LAST_TICK}"; return 1; }
  probe "snapshot()" >"$VERIFY_DIR/cycle-snapshot.json"
  probe "log()" >"$VERIFY_DIR/cycle.json"
  ab console >"$VERIFY_DIR/console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/page-errors.json" || { log "page error capture failed"; return 1; }
}

drive_focus() {
  ab select "#focus" "$FOCUS_DRILL" >/dev/null && ab click "#restart" >/dev/null || { log "focus control did not accept ${FOCUS_DRILL}"; return 1; }
  ab wait --fn "new URLSearchParams(location.search).get('focus') === '${FOCUS_DRILL}'" --timeout 30000 >/dev/null || { log "restart did not load focus=${FOCUS_DRILL}"; return 1; }
  fight_tick_at_least "$FOCUS_LAST_TICK" 120000 || { log "the reloaded boss never stepped to P4 tick ${FOCUS_LAST_TICK}"; return 1; }
  probe "log()" >"$VERIFY_DIR/focus.json"
  ab screenshot "$VERIFY_DIR/focus.png" >/dev/null || { log "focus screenshot failed"; return 1; }
  ab console >"$VERIFY_DIR/focus-console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/focus-page-errors.json" || { log "page error capture failed"; return 1; }
}

drive() {
  ab set viewport 1280 800 >/dev/null || return 1
  # A new browser's first screenshot takes about 10 s, longer than the hidden lead-in, so it goes to a blank page.
  ab open about:blank >/dev/null && ab screenshot "$VERIFY_DIR/warm-up.png" >/dev/null || { log "warm-up screenshot failed"; return 1; }
  ab open "${URL}${DRILL_QUERY}" >/dev/null || return 1
  drive_lead_in || return 1
  ab wait --fn "window.__archiveOcellusProbe?.snapshot().ticking === true && window.__archiveOcellusProbe.snapshot().tick >= 8" \
    --timeout 90000 >/dev/null || { log "trainer never started ticking"; return 1; }
  drive_walk && drive_cycle && drive_focus || return 1

  local capture
  for capture in hidden.json hidden.png before.json before.png after.json after.png boss.png cycle-snapshot.json cycle.json console.log page-errors.json focus.json focus.png focus-console.log focus-page-errors.json; do
    [[ -s "$VERIFY_DIR/$capture" ]] || { log "required capture ${capture} is missing or empty"; return 1; }
  done

  node -e '
    const [dir, spawn, target, bossNpc, lastHiddenTick, lastTick, stages, overheads, specials, focusKey, focusBeats] = process.argv.slice(1);
    const read = (file) => JSON.parse(require("fs").readFileSync(`${dir}/${file}`, "utf8"));
    const [hidden, before, after, errors, cycle, snapshot, focus, focusErrors] =
      ["hidden.json", "before.json", "after.json", "page-errors.json", "cycle.json", "cycle-snapshot.json", "focus.json", "focus-page-errors.json"].map(read);
    const [spawnTile, targetTile] = [JSON.parse(spawn), JSON.parse(target)];
    const same = (a, b) => a?.x === b.x && a?.y === b.y;
    const upTo = (rows, last) => rows.filter((row) => row.tick <= last);
    const events = (rows, kind, pick) => upTo(rows, Number(lastTick)).flatMap((row) => row.events.filter((e) => e.kind === kind).map(pick));
    const observed = {
      stageEntries: events(cycle.rows, "stage-entered", (e) => [e.at, e.stage]),
      overheadSwitches: events(cycle.rows, "overhead-switched", (e) => [e.at, e.overhead]),
      specialHits: upTo(cycle.rows, Number(lastTick)).flatMap((row) => row.beats.filter((b) => b.kind === "special-hit").map((b) => [row.tick, b.variant])),
      focusBeats: [...new Set(focus.rows.flatMap((row) => row.beats.map((b) => b.kind)))].sort(),
    };
    const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(JSON.parse(b));
    const checks = {
      spawnedOnSpawnTile: same(before.player, spawnTile),
      clickTargetedExpectedTile: same(after.destination, targetTile),
      arrivedAtExpectedTile: same(after.player, targetTile),
      worldTicked: after.tick > before.tick,
      bossIsExpectedNpc: snapshot.fight?.boss.npcId === Number(bossNpc),
      bossHiddenInLeadIn: hidden.fight?.run.kind === "running" && hidden.fight.run.tick <= Number(lastHiddenTick) && hidden.fight.boss.visible === false,
      bossDrawnOncePresent: snapshot.fight?.boss.visible === true,
      logHasEveryTick: cycle.rows.every((row, index) => row.tick === index) && cycle.rows.length > Number(lastTick),
      stagesOnSchedule: sameJson(observed.stageEntries, stages),
      overheadsOnSchedule: sameJson(observed.overheadSwitches, overheads),
      transitionAttacksReplayed: sameJson(observed.specialHits, specials),
      focusApplied: focus.header.choices.focus.key === focusKey && sameJson(observed.focusBeats, focusBeats),
      noPageErrors: errors.length === 0 && focusErrors.length === 0,
    };
    if (!checks.clickTargetedExpectedTile) {
      console.error(`verify: the click resolved to ${JSON.stringify(after.destination)}, not ${JSON.stringify(targetTile)}; the click-to-tile mapping for this viewport and camera changed`);
    }
    console.log(JSON.stringify({ hidden, before, after, target: targetTile, observed, checks }, null, 2));
    process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
  ' "$VERIFY_DIR" "$SPAWN_TILE" "$WALK_TARGET_TILE" "$BOSS_NPC" "$CYCLE_LAST_HIDDEN_TICK" "$CYCLE_LAST_TICK" "$CYCLE_STAGE_ENTRIES" "$CYCLE_OVERHEAD_SWITCHES" "$CYCLE_SPECIAL_HITS" "$FOCUS_DRILL" "$FOCUS_BEATS" >"$VERIFY_DIR/observed.json"
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
