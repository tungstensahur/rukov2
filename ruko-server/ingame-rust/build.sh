#!/bin/sh
# Builds the in-game movement core and embeds it into public/js/44-ingame-rust.js.
# Needs only a Rust toolchain with the wasm32-unknown-unknown target:
#   rustup target add wasm32-unknown-unknown
set -e
cd "$(dirname "$0")"
export PATH="$HOME/.cargo/bin:$PATH"
cargo build --release --target wasm32-unknown-unknown
python3 - <<'PY'
import base64, io, re
b = base64.b64encode(open('target/wasm32-unknown-unknown/release/ruko_ingame.wasm', 'rb').read()).decode()
p = '../ruko-online/public/js/44-ingame-rust.js'
s = io.open(p, encoding='utf-8').read()
s = re.sub(r"WASM_B64 = '[^']*'", "WASM_B64 = '%s'" % b, s, count=1)
io.open(p, 'w', encoding='utf-8').write(s)
PY
echo "built ruko_ingame.wasm and embedded it into public/js/44-ingame-rust.js"
