#!/usr/bin/env sh
# Capture the README and gallery screenshots from exampleSite.
#
#   sh scripts/screenshots.sh
#
# One build per palette with paletteAuto off and the boot sequence disabled,
# so every shot is the finished screen rather than whatever frame the loader
# happened to be on. Needs hugo, python3 and a headless browser; it is never
# part of a site build, and the PNGs it writes are committed.
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/images"
WORK=${TMPDIR:-/tmp}/c64-shots.$$
PORT=${PORT:-8765}
BROWSER=${BROWSER:-firefox}
PALETTES="nice-city c64 paper nice-night oled scene green amber"

DEFAULT=nice-city

mkdir -p "$OUT" "$WORK"
trap 'rm -rf "$WORK"' EXIT INT TERM

# A fresh profile and --no-remote, or the capture is handed to whatever
# Firefox the developer already has open. The exit status is unreliable in
# headless screenshot mode, so the file is the test, not the status.
shoot() {
  rm -rf "$WORK/profile"
  mkdir -p "$WORK/profile"
  "$BROWSER" --headless --no-remote --profile "$WORK/profile" \
    --window-size="$1,$2" --screenshot="$3" \
    "http://127.0.0.1:$PORT/" >/dev/null 2>&1 || true
  [ -s "$3" ] || { echo "no capture at $1x$2" >&2; exit 1; }
}

for palette in $PALETTES; do
  echo "building $palette"
  # An override config rather than HUGO_PARAMS_*: an environment variable
  # arrives as a string, and the string "false" is not false.
  cat > "$WORK/$palette.toml" <<EOF
[params]
  palette = "$palette"
  paletteAuto = false
  [params.boot]
    enabled = false
EOF
  hugo --source "$ROOT/exampleSite" --themesDir "$ROOT/.." \
       --config "$ROOT/exampleSite/hugo.toml,$WORK/$palette.toml" \
       --destination "$WORK/$palette" --baseURL "http://localhost:$PORT/" \
       --gc --minify --quiet
done

if ! python3 -c "import socket,sys; s=socket.socket(); sys.exit(0 if s.connect_ex(('127.0.0.1',$PORT)) else 1)"; then
  echo "port $PORT is already in use; run again with PORT=<free port>" >&2
  exit 1
fi

for palette in $PALETTES; do
  # --directory, not a subshell cd: $! has to be the server itself, or the
  # kill below leaves it holding the port and every later shot is taken
  # through a server pointing at a directory that no longer exists.
  python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$WORK/$palette" \
    >/dev/null 2>&1 &
  server=$!
  # Wait for the port instead of sleeping blind.
  until python3 -c "import socket,sys; s=socket.socket(); sys.exit(s.connect_ex(('127.0.0.1',$PORT)))" 2>/dev/null; do
    sleep 0.2
  done
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/")
  if [ "$code" != "200" ]; then
    echo "server for $palette answered $code, not 200" >&2
    kill "$server" 2>/dev/null || true
    exit 1
  fi
  echo "shooting $palette"
  # Every size is captured at its final width. Downscaling an 8x8 pixel face
  # destroys exactly the thing the screenshot is meant to show.
  shoot 1280 800 "$WORK/$palette-1280.png"
  if [ "$palette" = "$DEFAULT" ]; then
    shoot 1500 1000 "$WORK/$palette-1500.png"
    shoot 900 600 "$WORK/$palette-900.png"
  fi
  kill "$server" 2>/dev/null || true
  wait "$server" 2>/dev/null || true
done

python3 "$ROOT/scripts/crop-screenshots.py" "$WORK" "$OUT" $PALETTES
