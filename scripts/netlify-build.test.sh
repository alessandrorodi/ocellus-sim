#!/usr/bin/env bash
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/netlify-build.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# git and npm are the build's external commands. The application install marks that the reader step finished and fails, so the build stops there.
mkdir "$WORK/bin"
cat >"$WORK/bin/git" <<'EOF'
#!/usr/bin/env bash
case "$1" in
  init) mkdir -p "$3" ;;
  -C) [[ "$3" != fetch ]] || echo fetch >>"$T/fetches" ;;
esac
EOF
cat >"$WORK/bin/npm" <<'EOF'
#!/usr/bin/env bash
if [[ "$PWD" != "$NETLIFY_CACHE_DIR"/* ]]; then
  : >"$T/reached-app-install"
  exit 1
fi
[[ ! -e "$T/npm-fails" ]] || exit 1
mkdir node_modules
EOF
chmod +x "$WORK/bin/git" "$WORK/bin/npm"

setup() {
  T="$(mktemp -d "$WORK/case.XXXXXX")"
  CACHE_ROOT="$T/cache/archive-ocellus"
  READER="${CACHE_ROOT}/osrscachereader-1111111111111111111111111111111111111111"
}

build() {
  rm -f "$T/reached-app-install"
  T="$T" PATH="$WORK/bin:$PATH" NETLIFY_CACHE_DIR="$T/cache" \
    OSRS_CACHE_READER_REPO="https://example.invalid/osrscachereader.git" \
    OSRS_CACHE_READER_COMMIT="1111111111111111111111111111111111111111" \
    bash "$SCRIPT"
  [[ -e "$T/reached-app-install" ]]
}

failed_install_is_not_reused() {
  setup
  : >"$T/npm-fails"
  if build; then echo "build continued although the reader's npm ci failed"; return 1; fi
  [[ ! -e "$READER" ]] || { echo "a failed install left $READER"; return 1; }
  rm "$T/npm-fails"
  build || { echo "retry failed"; return 1; }
  [[ -d "$READER/node_modules" ]] || { echo "retry did not install the reader"; return 1; }
  [[ "$(ls "$CACHE_ROOT")" == "osrscachereader-1111111111111111111111111111111111111111" ]] || { echo "cache root holds: $(ls "$CACHE_ROOT" | tr '\n' ' ')"; return 1; }
}

installed_reader_is_reused() {
  setup
  build || { echo "first build failed"; return 1; }
  build || { echo "second build failed"; return 1; }
  local fetched
  fetched="$(wc -l <"$T/fetches" | tr -d ' ')"
  [[ "$fetched" == 1 ]] || { echo "fetched $fetched times, expected 1"; return 1; }
}

changed_pin_removes_the_old_reader() {
  setup
  mkdir -p "$CACHE_ROOT/osrscachereader-0000000000000000000000000000000000000000" "$CACHE_ROOT/openrs2/2746"
  build || { echo "build failed"; return 1; }
  [[ "$(ls "$CACHE_ROOT" | tr '\n' ' ')" == "openrs2 osrscachereader-1111111111111111111111111111111111111111 " ]] || { echo "cache root holds: $(ls "$CACHE_ROOT" | tr '\n' ' ')"; return 1; }
}

failed=0
for t in \
  failed_install_is_not_reused \
  installed_reader_is_reused \
  changed_pin_removes_the_old_reader; do
  if ("$t") >"$WORK/$t.log" 2>&1; then
    echo "PASS $t"
  else
    echo "FAIL $t"
    sed 's/^/  /' "$WORK/$t.log"
    failed=1
  fi
done
exit $failed
