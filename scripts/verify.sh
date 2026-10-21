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
SPAWN_TILE='{"x":10,"y":10}'
WALK_TARGET_TILE='{"x":13,"y":11}'
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
    process.exit(m.cache?.source === "openrs2:2746" && m.assets?.["npc-16673"] ? 0 : 1);
  ' "$MANIFEST"
}

stage_build() {
  npm run build >"$VERIFY_DIR/build.log" 2>&1
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
    log "assets: manifest already has npc-16673 from openrs2:2746, skipping rebuild" | tee "$VERIFY_DIR/assets.log"
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
  if ! curl -sf "http://127.0.0.1:$(state port)/osrs-assets/manifest.json" | grep -q '"npc-16673"'; then
    log "doctor: served manifest has no npc-16673"
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

snapshot() {
  ab --json eval "window.__archiveOcellus.snapshot()" | json data.result
}

drive() {
  ab set viewport 1280 800 >/dev/null || return 1
  ab open "$URL" >/dev/null || return 1
  ab wait --fn "window.__archiveOcellus?.snapshot().ticking === true && window.__archiveOcellus.snapshot().tick >= 8" \
    --timeout 90000 >/dev/null || { log "trainer never started ticking"; return 1; }

  local before after box cx cy credit
  before="$(snapshot)"
  echo "$before" >"$VERIFY_DIR/before.json"
  ab screenshot "$VERIFY_DIR/before.png" >/dev/null || { log "before screenshot failed"; return 1; }

  credit="$(ab --json get text "#credit_line" | json data.text)"
  [[ "$credit" == "$CREDIT_LINE" ]] || { log "credit line text differs: ${credit}"; return 1; }
  [[ "$(ab --json is visible "#credit_line" | json data.visible)" == "true" ]] || { log "credit line is not visible"; return 1; }

  box="$(ab --json get box "#world")"
  cx=$(( $(json data.x <<<"$box") + $(json data.width <<<"$box") / 2 + 160 ))
  cy=$(( $(json data.y <<<"$box") + $(json data.height <<<"$box") / 2 + 50 ))
  echo "{\"x\":${cx},\"y\":${cy}}" >"$VERIFY_DIR/click.json"
  ab mouse move "$cx" "$cy" >/dev/null && ab mouse down left >/dev/null && ab mouse up left >/dev/null || return 1

  ab wait --fn "(() => { const s = window.__archiveOcellus.snapshot(), spawn = ${SPAWN_TILE}; return (s.player.x !== spawn.x || s.player.y !== spawn.y) && s.player.x === s.destination.x && s.player.y === s.destination.y; })()" \
    --timeout 15000 >/dev/null || log "player did not settle on a new tile after the click"
  after="$(snapshot)"
  echo "$after" >"$VERIFY_DIR/after.json"
  ab wait 1200 >/dev/null
  ab screenshot "$VERIFY_DIR/after.png" >/dev/null || { log "after screenshot failed"; return 1; }

  ab console >"$VERIFY_DIR/console.log" 2>&1 || { log "console capture failed"; return 1; }
  ab --json errors | json data.errors >"$VERIFY_DIR/page-errors.json" || { log "page error capture failed"; return 1; }

  local capture
  for capture in before.json before.png after.json after.png console.log page-errors.json; do
    [[ -s "$VERIFY_DIR/$capture" ]] || { log "required capture ${capture} is missing or empty"; return 1; }
  done

  node -e '
    const [before, after, errors, spawn, target] = process.argv.slice(1).map((s) => JSON.parse(s));
    const same = (a, b) => a?.x === b.x && a?.y === b.y;
    const checks = {
      spawnedOnSpawnTile: same(before.player, spawn),
      clickTargetedExpectedTile: same(after.destination, target),
      arrivedAtExpectedTile: same(after.player, target),
      worldTicked: after.tick > before.tick,
      noPageErrors: errors.length === 0,
    };
    if (!checks.clickTargetedExpectedTile) {
      console.error(`verify: the click resolved to ${JSON.stringify(after.destination)}, not ${JSON.stringify(target)}; the click-to-tile mapping for this viewport and camera changed`);
    }
    console.log(JSON.stringify({ before, after, target, checks }, null, 2));
    process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
  ' "$before" "$after" "$(cat "$VERIFY_DIR/page-errors.json")" "$SPAWN_TILE" "$WALK_TARGET_TILE" >"$VERIFY_DIR/observed.json"
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
[[ ${#stages[@]} -gt 0 ]] || stages=(build test assets browser)
for stage in "${stages[@]}"; do
  case "$stage" in build | test | assets | browser) ;; *) log "unknown stage: ${stage}"; exit 2 ;; esac
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
