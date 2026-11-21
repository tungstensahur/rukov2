#!/bin/sh
# Rebuilds Ruko Studio's C++ core and embeds the compiled module into the loader the page loads.
# Needs Zig (https://ziglang.org/download) on PATH and python3; nothing else, no root.
set -e
cd "$(dirname "$0")"
zig c++ -target wasm32-freestanding -O2 -fno-exceptions -fno-rtti -nostdlib \
  -Wl,--no-entry -Wl,--export-memory -o studio.wasm studio.cpp
python3 - <<'PY'
import base64, io, re
b = base64.b64encode(open('studio.wasm', 'rb').read()).decode()
p = '../ruko-online/public/js/43-studio-cpp.js'
s = io.open(p, encoding='utf-8').read()
s = re.sub(r"WASM_B64 = '[^']*'", "WASM_B64 = '%s'" % b, s, count=1)
io.open(p, 'w', encoding='utf-8').write(s)
PY
echo "built studio.wasm and embedded it into public/js/43-studio-cpp.js"
