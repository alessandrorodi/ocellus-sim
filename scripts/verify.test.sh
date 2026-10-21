#!/usr/bin/env bash
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/verify.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

eval "$(grep -E '^(DRILL_QUERY|BOSS_NPC|SPAWN_TILE|WALK_CLICK_RIGHT_PX|WALK_CLICK_DOWN_PX|WALK_TARGET_TILE|CYCLE_[A-Z_]+|FOCUS_[A-Z_]+|CREDIT_LINE)=' "$SCRIPT")"
for fn in json process_start serve state doctor stop probe fight_tick_at_least drive_lead_in drive_walk drive_cycle drive_focus drive release_browser stage_browser; do
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
  local inner_void_tick="$1" focus="$2"
  command node -e '
    const [dir, innerVoid, focus] = process.argv.slice(1);
    const stages = { 0: "lead-in", [innerVoid]: "inner-void", 30: "after-inner", 39: "outer-void", 59: "after-outer", 68: "inner-void" };
    const overheads = { 8: "deflect-melee", 33: "soul-split", 39: "deflect-range", 61: "soul-split", 68: "deflect-melee" };
    const specials = { 37: "vortex", 65: "spike-disk" };
    const cycle = Array.from({ length: 71 }, (_, t) => ({
      tick: t,
      beats: specials[t] ? [{ kind: "special-hit", variant: specials[t] }] : [],
      events: [
        ...(stages[t] ? [{ kind: "stage-entered", at: t, stage: stages[t] }] : []),
        ...(overheads[t] ? [{ kind: "overhead-switched", at: t, overhead: overheads[t] }] : []),
      ],
    }));
    const focusBeats = { 5: "boss-shouts", 32: "special-tell", 37: "special-hit", 39: "soul-split-heal" };
    const focused = Array.from({ length: 41 }, (_, t) => ({ tick: t, beats: focusBeats[t] ? [{ kind: focusBeats[t] }] : [], events: [] }));
    const fs = require("fs");
    fs.writeFileSync(`${dir}/cycle-log.json`, JSON.stringify({ data: { result: { header: { choices: { focus: { key: "full-fight" } } }, rows: cycle } } }));
    fs.writeFileSync(`${dir}/focus-log.json`, JSON.stringify({ data: { result: { header: { choices: { focus: { key: focus } } }, rows: focused } } }));
  ' "$T" "$inner_void_tick" "$focus"
}

fake_browser() {
  FINAL_TILE="$1"
  SCREENSHOT="${2:-ok}"
  fixture_logs "${3:-8}" "${4:-$FOCUS_DRILL}"
  LEAD_IN_FIGHT="${5:-}" PRESENT_FIGHT="${6:-}"
  [[ -n "$LEAD_IN_FIGHT" ]] || LEAD_IN_FIGHT='{"run":{"kind":"running","tick":1},"boss":{"npcId":16677,"visible":false}}'
  [[ -n "$PRESENT_FIGHT" ]] || PRESENT_FIGHT='{"run":{"kind":"running","tick":70},"boss":{"npcId":16677,"visible":true}}'
  ab() {
    case "$*" in
      "--json eval window.__archiveOcellusProbe.snapshot()")
        local n tile='{"x":10,"y":10}' tick=8 fight="$LEAD_IN_FIGHT"
        n=$(($(cat "$T/evals" 2>/dev/null || echo 0) + 1))
        echo "$n" >"$T/evals"
        [[ "$n" -ne 1 ]] || tick=6
        [[ "$n" -lt 3 ]] || { tile="$FINAL_TILE"; tick=12; fight="$PRESENT_FIGHT"; }
        printf '{"data":{"result":{"ticking":true,"tick":%s,"player":%s,"destination":%s,"fight":%s}}}\n' "$tick" "$tile" "$tile" "$fight"
        ;;
      "--json eval window.__archiveOcellusProbe.log()")
        if [[ -e "$T/restarted" ]]; then cat "$T/focus-log.json"; else cat "$T/cycle-log.json"; fi
        ;;
      "click #restart") : >"$T/restarted" ;;
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

boss_never_drawn_fails() {
  setup
  fake_browser '{"x":13,"y":11}' ok 8 "$FOCUS_DRILL" '' '{"run":{"kind":"running","tick":70},"boss":{"npcId":16677,"visible":false}}'
  if drive >"$T/drive.log" 2>&1; then echo "drive passed although the boss was never drawn"; return 1; fi
  grep -q '"bossDrawnOncePresent": false' "$T/drive.log" || { echo "the presence check did not name the failure"; cat "$T/drive.log"; return 1; }
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
  boss_never_drawn_fails; do
  if ("$t") >"$WORK/$t.log" 2>&1; then
    echo "PASS $t"
  else
    echo "FAIL $t"
    sed 's/^/  /' "$WORK/$t.log"
    failed=1
  fi
done
exit $failed
