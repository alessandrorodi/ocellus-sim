#!/usr/bin/env bash
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/verify.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

eval "$(grep -E '^(SPAWN_TILE|WALK_TARGET_TILE|CREDIT_LINE)=' "$SCRIPT")"
for fn in json process_start serve state doctor stop snapshot drive release_browser stage_browser; do
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

fake_browser() {
  FINAL_TILE="$1"
  SCREENSHOT="${2:-ok}"
  ab() {
    case "$*" in
      "--json eval "*)
        local n tile='{"x":10,"y":10}' tick=8
        n=$(($(cat "$T/evals" 2>/dev/null || echo 0) + 1))
        echo "$n" >"$T/evals"
        [[ "$n" -eq 1 ]] || { tile="$FINAL_TILE"; tick=12; }
        printf '{"data":{"result":{"ticking":true,"tick":%s,"player":%s,"destination":%s}}}\n' "$tick" "$tile" "$tile"
        ;;
      "--json get text "*) printf '{"data":{"text":"%s"}}\n' "$CREDIT_LINE" ;;
      "--json is visible "*) echo '{"data":{"visible":true}}' ;;
      "--json get box "*) echo '{"data":{"x":0,"y":0,"width":1280,"height":800}}' ;;
      "--json errors") echo '{"data":{"errors":[]}}' ;;
      "screenshot "*)
        case "$SCREENSHOT" in
          ok) echo png >"$2" ;;
          fail) return 1 ;;
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

failed=0
for t in \
  refused_serve_does_not_stop_the_recorded_instance \
  own_instance_is_stopped \
  interrupt_stops_own_instance \
  interrupt_leaves_the_recorded_instance \
  walk_to_the_documented_tile_passes \
  walk_to_a_wrong_tile_fails \
  failed_screenshot_fails \
  missing_screenshot_fails; do
  if ("$t") >"$WORK/$t.log" 2>&1; then
    echo "PASS $t"
  else
    echo "FAIL $t"
    sed 's/^/  /' "$WORK/$t.log"
    failed=1
  fi
done
exit $failed
