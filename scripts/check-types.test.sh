#!/usr/bin/env bash
set -uo pipefail

CHECK="$(cd "$(dirname "$0")" && pwd)/check-types.mjs"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

clean_tree() {
  T="$(mktemp -d "$WORK/case.XXXXXX")"
  mkdir -p "$T/src/content/ocellus/js/p4" "$T/src/content/ocellus/tests" "$T/test"
  cat >"$T/src/content/ocellus/js/P4Types.ts" <<'EOF'
export type Tick = number & { readonly brand: "tick" };
export const STAGES = ["inner-void", "outer-void"] as const;
EOF
  cat >"$T/src/content/ocellus/js/p4/schedule.ts" <<'EOF'
import type { Tick } from "../P4Types";
export const first = { at: 0 } satisfies { at: number };
export function later(t: Tick): number { return t + 1; }
EOF
  cat >"$T/src/content/ocellus/js/OcellusRegion.ts" <<'EOF'
import { later } from "./p4/schedule";
export const region = later;
EOF
  cat >"$T/src/content/ocellus/tests/cycle.test.ts" <<'EOF'
import { region } from "../js/OcellusRegion";
import type { Tick } from "../js/P4Types";
export const used: [typeof region, Tick | null] = [region, null];
EOF
  cat >"$T/src/content/ocellus/tests/public-forms.test.ts" <<'EOF'
import region = require("../js/OcellusRegion");
export const load = () => import("../js/OcellusRegion");
export type Region = typeof import("../js/OcellusRegion").region;
export const types = require("../js/P4Types");
export const used = region;
EOF
  cat >"$T/src/content/ocellus/tests/public-forms.js" <<'EOF'
export { region } from "../js/OcellusRegion";
EOF
  cat >"$T/test/setupFiles.ts" <<'EOF'
export const canvas = {} as unknown as HTMLCanvasElement;
EOF
}

plant() {
  mkdir -p "$(dirname "$T/$1")"
  printf '%s\n' "${2//@ROOT@/$T}" >"$T/$1"
}

expect_clean() {
  clean_tree
  node "$CHECK" "$T" >"$T/out.txt" 2>&1 || { cat "$T/out.txt"; return 1; }
  grep -q "check-types: 0 finding(s)" "$T/out.txt" || { cat "$T/out.txt"; return 1; }
}

expect_finding() {
  local file="$1" body="$2" rule="$3"
  clean_tree
  plant "$file" "$body"
  if node "$CHECK" "$T" >"$T/out.txt" 2>&1; then
    echo "check passed although ${file} contains: ${body}"
    return 1
  fi
  grep -q "^${file}:[0-9]*:[0-9]* ${rule}" "$T/out.txt" || { echo "missing '${rule}' finding for ${file}"; cat "$T/out.txt"; return 1; }
}

clean_tree_passes() { expect_clean; }
explicit_any_fails() { expect_finding src/content/ocellus/js/p4/roll.ts 'export const x: any = 1;' "explicit any"; }
as_cast_fails() { expect_finding src/content/ocellus/js/p4/roll.ts 'export const x = (1 as number);' "type assertion with as"; }
double_cast_fails() { expect_finding src/App.tsx 'export const x = ("1" as unknown as number);' "type assertion with as"; }
angle_bracket_cast_fails() { expect_finding src/content/ocellus/js/p4/roll.ts 'export const x = <number>(1);' "angle-bracket type assertion"; }
non_null_fails() { expect_finding src/content/ocellus/js/p4/roll.ts 'export const f = (s?: string) => s!.length;' "non-null assertion"; }
definite_assignment_fails() { expect_finding src/content/ocellus/js/p4/roll.ts 'export class C { n!: number; }' "definite assignment assertion"; }
ts_ignore_fails() { expect_finding src/content/ocellus/js/p4/roll.ts $'// @ts-ignore\nexport const x: number = "1";' "compiler suppression comment"; }
ts_expect_error_fails() { expect_finding src/content/ocellus/tests/roll.test.ts $'/* @ts-expect-error */\nexport const x: number = "1";' "compiler suppression comment"; }
ts_nocheck_fails() { expect_finding src/assets.ts $'// @ts-nocheck\nexport const x = 1;' "compiler suppression comment"; }
test_import_of_internal_fails() { expect_finding src/content/ocellus/tests/schedule.test.ts 'import { later } from "../js/p4/schedule";' "import of fight internal src/content/ocellus/js/p4/schedule.ts"; }
app_import_of_internal_fails() { expect_finding src/DrillControls.tsx 'export { later } from "./content/ocellus/js/p4/schedule";' "import of fight internal src/content/ocellus/js/p4/schedule.ts"; }
test_helper_import_of_internal_fails() { expect_finding test/helper.ts 'import { later } from "../src/content/ocellus/js/p4/schedule";' "import of fight internal src/content/ocellus/js/p4/schedule.ts"; }
import_equals_of_internal_fails() { expect_finding src/content/ocellus/tests/schedule.test.ts 'import schedule = require("../js/p4/schedule");' "import of fight internal src/content/ocellus/js/p4/schedule.ts"; }
dynamic_import_of_internal_fails() { expect_finding src/content/ocellus/tests/schedule.test.ts 'export const load = () => import("../js/p4/schedule");' "import of fight internal src/content/ocellus/js/p4/schedule.ts"; }
import_type_of_internal_fails() { expect_finding src/content/ocellus/tests/schedule.test.ts 'export type Later = typeof import("../js/p4/schedule").later;' "import of fight internal src/content/ocellus/js/p4/schedule.ts"; }
require_of_internal_fails() { expect_finding src/content/ocellus/tests/schedule.test.ts 'export const schedule = require("../js/p4/schedule");' "import of fight internal src/content/ocellus/js/p4/schedule.ts"; }
js_reexport_of_internal_fails() { expect_finding src/content/ocellus/tests/helper.js 'export { later } from "../js/p4/schedule";' "import of fight internal src/content/ocellus/js/p4/schedule.ts"; }
declaration_file_import_of_internal_fails() { expect_finding src/globals.d.ts 'export type Later = typeof import("./content/ocellus/js/p4/schedule").later;' "import of fight internal src/content/ocellus/js/p4/schedule.ts"; }
absolute_import_of_internal_fails() { expect_finding src/App.tsx 'export { later } from "@ROOT@/src/content/ocellus/js/p4/schedule";' "import of fight internal src/content/ocellus/js/p4/schedule.ts"; }

failed=0
for t in \
  clean_tree_passes \
  explicit_any_fails \
  as_cast_fails \
  double_cast_fails \
  angle_bracket_cast_fails \
  non_null_fails \
  definite_assignment_fails \
  ts_ignore_fails \
  ts_expect_error_fails \
  ts_nocheck_fails \
  test_import_of_internal_fails \
  app_import_of_internal_fails \
  test_helper_import_of_internal_fails \
  import_equals_of_internal_fails \
  dynamic_import_of_internal_fails \
  import_type_of_internal_fails \
  require_of_internal_fails \
  js_reexport_of_internal_fails \
  declaration_file_import_of_internal_fails \
  absolute_import_of_internal_fails; do
  if ("$t") >"$WORK/$t.log" 2>&1; then
    echo "PASS $t"
  else
    echo "FAIL $t"
    sed 's/^/  /' "$WORK/$t.log"
    failed=1
  fi
done
exit $failed
