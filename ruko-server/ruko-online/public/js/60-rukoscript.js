/* ---------- v60: RukoScript, the language Ruko Studio writes ---------- */
/* The block editor is gone. Scripts are typed, in a small language made for Ruko: one line does one
   thing, "on ..." starts a script, and "end" closes a loop or a choice. Nothing is eval'd: every line
   is read by hand and turned into one of the same script objects the block editor used, so the game
   runtime is untouched and every game built with blocks keeps working exactly as it did.

   The language is in three files:
     60-rukoscript.js        the helpers, the trigger table and the command table (this file)
     60b-rukoscript-reader.js the reader and the printer
     60c-rukoscript-editor.js the Code tab, the tutorial and the reference
   Everything is guarded: a missing piece shows a message instead of breaking the page. */
(function () {
  if (window.RKSCRIPT) return;
  window.RKSCRIPT = 1;

  const ge = () => { try { return typeof GE === 'undefined' ? null : GE; } catch (e) { return null; } };
  const say = m => { try { if (typeof toast === 'function') toast(m, true); } catch (e) {} };
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Quoted text in a message would end the quotes of the line it is printed into, so inner quotes
  // become apostrophes when a game is shown as code.
  const Q = s => String(s == null ? '' : s).replace(/"/g, "'");
  const num = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hex = (v, d) => { const m = String(v || '').match(/^#?([0-9a-f]{6})$/i); return m ? '#' + m[1].toLowerCase() : d; };
  const isHex = v => /^#?[0-9a-f]{6}$/i.test(String(v || ''));
  const isNum = v => /^-?\d+(\.\d+)?$/.test(String(v || ''));

  // A fresh block of a type, carrying the defaults the old palette used, so every field the runtime
  // expects is present even when the line only set one of them.
  const B = (t, f) => {
    let d = {};
    try { d = JSON.parse(JSON.stringify((typeof BLK !== 'undefined' && BLK[t] && BLK[t].d) || {})); } catch (e) {}
    return Object.assign({ t }, d, f || {});
  };

  /* ---------- 1. values, objects and keys ---------- */
  const VARS = ['score', 'A', 'B', 'C', 'D', 'E', 'F', 'coins', 'hp', 'kills', 'deaths', 'time', 'y', 'px', 'pz'];
  const VNAMES = { score: 'score', coins: 'coins', hp: 'hp', kills: 'kills', deaths: 'deaths', time: 'time', y: 'y', px: 'px', pz: 'pz' };
  function valOf(tok) {
    const t = String(tok || '').trim();
    if (!t) return null;
    if (/^[A-Fa-f]$/.test(t)) return t.toUpperCase();
    const k = t.toLowerCase();
    return VNAMES[k] || null;
  }
  function objList() {
    const g = ge();
    return (g && g.objs) || [];
  }
  function labelOf(o, i) {
    if (!o) return 'object';
    if (o.k == 'p') return (o.nm || ({ solid: 'Platform', lava: 'Lava', bounce: 'Bounce pad', check: 'Checkpoint', goal: 'Goal', crumble: 'Crumbling', move: 'Moving', wall: 'Wall' }[o.t] || 'Platform'));
    if (o.k == 'c') return 'Coin';
    if (o.k == 's') return 'Spawn';
    if (o.k == 'd') return (o.nm || 'Decoration');
    if (o.k == 'u') return 'Screen ' + (o.ty || 'label');
    if (o.k == 'x') return 'Effect';
    if (o.k == 'n') return 'Sound';
    return o.nm || 'Object';
  }
  // Names are what the Explorer shows, plus "this" for whatever is selected. Matching ignores case
  // and the spaces, so "Sky Steps" and skysteps both find the same platform.
  function objOf(tok) {
    const g = ge();
    const list = objList();
    const t = String(tok == null ? '' : tok).trim();
    if (!t) return null;
    if (/^(this|selected)$/i.test(t)) return g && g.sel >= 0 && list[g.sel] ? list[g.sel].u : null;
    const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const want = norm(t);
    const hits = list.filter((o, i) => norm(o.nm) === want || norm(labelOf(o, i)) === want || String(o.u) === t);
    if (hits.length) return hits[0].u;
    const part = list.filter((o, i) => norm(o.nm || '').indexOf(want) >= 0 && want.length > 1);
    return part.length === 1 ? part[0].u : null;
  }
  const KEYS = ['space', 'shift', 'control', 'f', 'e', 'r', '1', '2'];
  const SOUNDS = ['beep', 'coin', 'jump', 'boom', 'win', 'hurt'];

  /* ---------- 2a. triggers ---------- */
  // Each entry: how it is written, and the block header it becomes.
  const TRIG = {
    start: { args: '', doc: 'Runs once, the moment the game starts.', h: () => ({ t: 'start' }), out: () => 'on start' },
    touch: { args: '[object]', doc: 'Runs when the player touches something, or any platform if you leave the name out.', h: a => ({ t: 'touch', o: a[0] ? objOf(a[0]) || '' : '' }), out: h => 'on touch' + (h.o ? ' ' + objName(h.o) : '') },
    release: { args: '[object]', doc: 'Runs when the player stops touching something.', h: a => ({ t: 'release', o: a[0] ? objOf(a[0]) || '' : '' }), out: h => 'on release' + (h.o ? ' ' + objName(h.o) : '') },
    near: { args: 'distance [object]', doc: 'Runs once when the player comes within that many studs.', h: a => ({ t: 'near', n: clamp(num(a[0], 5), 1, 60), o: a[1] ? objOf(a[1]) || '' : '' }), out: h => 'on near ' + (h.n || 5) + (h.o ? ' ' + objName(h.o) : '') },
    timer: { args: 'seconds', doc: 'Runs again and again, every so many seconds.', h: a => ({ t: 'timer', n: clamp(num(a[0], 5), 0.5, 600) }), out: h => 'on timer ' + (h.n || 5) },
    jump: { args: '', doc: 'Runs every time the player jumps.', h: () => ({ t: 'jump' }), out: () => 'on jump' },
    land: { args: '', doc: 'Runs every time the player lands.', h: () => ({ t: 'land' }), out: () => 'on land' },
    fall: { args: 'height', doc: 'Runs when the player drops below a height (-15 is the usual ground level).', h: a => ({ t: 'fall', n: num(a[0], -15) }), out: h => 'on fall ' + (h.n == null ? -15 : h.n) },
    die: { args: '', doc: 'Runs when the player is eliminated in a PVP game.', h: () => ({ t: 'die' }), out: () => 'on die' },
    score: { args: 'number', doc: 'Runs the first time the score reaches that number.', h: a => ({ t: 'score', n: num(a[0], 10) }), out: h => 'on score ' + (h.n || 10) },
    press: { args: 'key', doc: 'Runs when a key is pressed: space, shift, control, f, e, r, 1 or 2.', h: a => ({ t: 'press', k: KEYS.includes(String(a[0] || '').toLowerCase()) ? String(a[0]).toLowerCase() : 'space' }), out: h => 'on press ' + (h.k || 'space') },
    action: { args: '1 or 2', doc: 'Runs when the player taps action button 1 or 2 on a phone.', h: a => ({ t: 'action', k: String(a[0]) == '2' ? 2 : 1 }), out: h => 'on action ' + (h.k || 1) },
    chat: { args: '"command"', doc: 'Runs when the player types that command in server chat, like on chat "!heal".', h: a => ({ t: 'chatCmd', m: a.join(' ').replace(/^"|"$/g, '').slice(0, 40) || '!help' }), out: h => 'on chat "' + Q(h.m || '!help') + '"' },
    varreaches: { args: 'variable > number', doc: 'Runs the first time a variable or the score passes a number.', h: a => { const v = valOf(a[0]) || 'score'; const o = a[1] == '<' ? '<' : '>'; return { t: 'varReach', v, o, n: num(a[2], 10) }; }, out: h => 'on var ' + (h.v || 'score') + ' ' + (h.o || '>') + ' ' + (h.n || 10) }
  };
  TRIG.touched = TRIG.touch;
  TRIG.whenscore = TRIG.score;
  TRIG.variable = TRIG.varreaches;

  function objName(u) {
    const list = objList();
    const o = list.find(x => x.u === u);
    if (!o) return 'this';
    const i = list.indexOf(o);
    const nm = (o.nm || '').replace(/\s+/g, '_');
    return nm || labelOf(o, i).replace(/\s+/g, '_').toLowerCase();
  }

  /* ---------- 2b. conditions ---------- */
  // The runtime compares with > < = only, so >=, <= and != are handled by swapping the two branches
  // of an if (or, inside a while, by the reader's own comparison, which knows all six).
  function condParse(txt) {
    const s = String(txt || '').trim().replace(/\s+then$/i, '');
    const m = s.match(/^(chance)\s+(-?\d+(?:\.\d+)?)$/i);
    if (m) return { c: { v: 'chance', n: clamp(num(m[2], 50), 0, 100) }, swap: false, text: 'chance ' + clamp(num(m[2], 50), 0, 100) };
    const cm = s.match(/^([A-Za-z]+)\s*(>=|<=|!=|==|=|>|<)\s*([A-Za-z]+|-?\d+(?:\.\d+)?)$/);
    if (!cm) return { err: '"' + s + '" is not a comparison. Try: score >= 10, or chance 25.' };
    const v = valOf(cm[1]);
    if (!v) return { err: '"' + cm[1] + '" is not a value. Use score, coins, hp, kills, time, y, or A to F.' };
    const op = cm[2] === '==' ? '=' : cm[2];
    const rhs = cm[3];
    const text = v + ' ' + cm[2] + ' ' + rhs;
    const rv = valOf(rhs);
    if (rv) return { c: { v, o: op, v2: rv }, swap: op == '>=' || op == '<=' || op == '!=', text };
    const n = num(rhs, null);
    if (n == null) return { err: '"' + rhs + '" is not a number or a value.' };
    if (op == '>=') return { c: { v, o: '<', n }, swap: true, text };
    if (op == '<=') return { c: { v, o: '>', n }, swap: true, text };
    if (op == '!=') return { c: { v, o: '=', n }, swap: true, text };
    return { c: { v, o: op, n }, swap: false, text };
  }
  const MARKER = /^@rk(while|until)\s+(.+)$/;
  const COND_TEXT = c => {
    if (!c) return 'chance 50';
    if (c.v == 'chance') return 'chance ' + c.n;
    return (c.v || 'score') + ' ' + (c.o || '>') + ' ' + (c.v2 || c.n);
  };

  /* ---------- 2c. commands ---------- */
  // The whole language, one entry per thing you can do. `map` turns the words after the command into
  // block fields; `out` turns a block back into the line, which is how an old game is shown as code.
  const CMD = {
    say: {
      args: '"text" [for seconds]', doc: 'Show a line of text under the crosshair.',
      map: a => {
        let s = 2, txt = [];
        for (let i = 0; i < a.length; i++) {
          if (/^for$/i.test(a[i])) { s = clamp(num(a[i + 1], 2), 0, 30); break; }
          txt.push(a[i]);
        }
        return { m: txt.join(' ').replace(/^"|"$/g, '').slice(0, 80) || 'Hello!', s };
      },
      out: b => 'say "' + Q(b.m || '') + '" for ' + (b.s == null ? 2 : b.s)
    },
    announce: { args: '"text"', doc: 'Put a line in the game chat for everyone.', map: a => ({ m: a.join(' ').replace(/^"|"$/g, '').slice(0, 80) || 'Something happened!' }), out: b => 'announce "' + Q(b.m || '') + '"', t: 'broadcast' },
    note: { args: '"note"', doc: 'A note for yourself, does nothing.', map: a => ({ m: a.join(' ').replace(/^"|"$/g, '').slice(0, 120) }), out: b => 'note "' + Q(b.m || '') + '"' },
    sound: { args: 'beep|coin|jump|boom|win|hurt', doc: 'Play one of the built-in sounds.', map: a => { const k = String(a[0] || 'beep').toLowerCase(); if (!SOUNDS.includes(k)) return { err: 'Unknown sound "' + k + '". Try ' + SOUNDS.join(', ') + '.' }; return { k }; }, out: b => 'sound ' + b.k },
    play: { args: '"sound url"', doc: 'Play a sound you uploaded to Ruko.', map: a => ({ a: (a[0] || '').replace(/"/g, '') }), out: b => 'play "' + (b.a || '') + '"', t: 'playsound' },
    music: { args: '"sound url"', doc: 'Play a sound in a loop.', map: a => ({ a: (a[0] || '').replace(/"/g, '') }), out: b => 'music "' + (b.a || '') + '"' },
    stopmusic: { args: '', doc: 'Stop the looping music.', map: () => ({}), out: () => 'stopmusic', t: 'musicStop' },
    volume: { args: 'percent', doc: 'Set how loud sounds are.', map: a => ({ p: clamp(num(a[0], 80), 0, 100) }), out: b => 'volume ' + (b.p == null ? 80 : b.p) },
    sky: { args: '#colour', doc: 'Change the sky and the fog to one colour.', map: a => ({ c: hex(a[0], '#8fd3ff') }), out: b => 'sky ' + (b.c || '#8fd3ff') },
    fog: { args: 'off|near|far', doc: 'How thick the fog is.', map: a => { const k = String(a[0] || 'near').toLowerCase(); return { k: ['off', 'near', 'far'].includes(k) ? k : 'near' }; }, out: b => 'fog ' + (b.k || 'near') },
    fogcolor: { args: '#colour', doc: 'Set the fog colour only.', map: a => ({ cc: hex(a[0], '#8fd3ff') }), out: b => 'fogcolor ' + (b.cc || '#8fd3ff'), t: 'fogCol' },
    bright: { args: 'percent', doc: 'How bright the world looks.', map: a => ({ p: clamp(num(a[0], 100), 0, 300) }), out: b => 'bright ' + (b.p == null ? 100 : b.p) },
    rain: { args: '', doc: 'Make it rain.', map: () => ({}), out: () => 'rain' },
    snow: { args: '', doc: 'Make it snow.', map: () => ({}), out: () => 'snow' },
    clear: { args: '', doc: 'Clear the weather.', map: () => ({}), out: () => 'clear', t: 'weatherOff' },
    burst: {
      args: '#colour [at object]', doc: 'A puff of particles at the player, or at an object.',
      map: a => {
        const o = {}; if (isHex(a[0])) o.c = hex(a[0], '#ffd23f');
        const at = a.indexOf('at');
        if (at >= 0 && a[at + 1]) o.o = objOf(a[at + 1]) || '';
        return o;
      },
      out: b => 'burst ' + (b.c || '#ffd23f') + (b.o ? ' at ' + objName(b.o) : '')
    },
    shake: { args: 'seconds', doc: 'Shake the screen.', map: a => ({ s: clamp(num(a[0], 0.6), 0.1, 5) }), out: b => 'shake ' + (b.s == null ? 0.6 : b.s) },
    flash: { args: '#colour seconds', doc: 'Flash the screen in a colour.', map: a => ({ cc: hex(a[0], '#ffffff'), s: clamp(num(a[1], 0.4), 0.1, 3) }), out: b => 'flash ' + (b.cc || '#ffffff') + ' ' + (b.s == null ? 0.4 : b.s) },
    vibrate: { args: 'seconds', doc: 'Vibrate the phone.', map: a => ({ s: clamp(num(a[0], 0.3), 0.1, 3) }), out: b => 'vibrate ' + (b.s == null ? 0.3 : b.s) },
    wait: { args: 'seconds', doc: 'Pause this script for a moment.', map: a => ({ s: clamp(num(a[0], 1), 0, 60) }), out: b => 'wait ' + (b.s == null ? 1 : b.s) },
    stop: { args: '', doc: 'Stop this script here.', map: () => ({}), out: () => 'stop' },
    tp: {
      args: 'spawn | object | to x y z', doc: 'Teleport the player.',
      map: a => {
        if (/^to$/i.test(a[0] || '')) return { w: 'pos', x: num(a[1], 0), y: num(a[2], 5), z: num(a[3], 0) };
        const u = a[0] && !/^spawn$/i.test(a[0]) ? objOf(a[0]) : null;
        return u ? { w: 'obj', o: u } : { w: 'spawn' };
      },
      out: b => b.w == 'obj' ? 'tp ' + objName(b.o) : b.w == 'pos' ? 'tp to ' + (b.x || 0) + ' ' + (b.y || 0) + ' ' + (b.z || 0) : 'tp spawn'
    },
    respawn: { args: '', doc: 'Put the player back at a spawn point.', map: () => ({}), out: () => 'respawn' },
    speed: { args: 'number', doc: 'Change how fast the player runs.', map: a => ({ k: 'speed', n: clamp(num(a[0], 12), 2, 80) }), out: b => 'speed ' + (b.n || 12), t: 'phys' },
    jump: { args: 'number', doc: 'Change how high the player jumps.', map: a => ({ k: 'jump', n: clamp(num(a[0], 12), 2, 80) }), out: b => 'jump ' + (b.n || 12), t: 'phys' },
    gravity: { args: 'number', doc: 'Change how heavy the player is.', map: a => ({ k: 'gravity', n: clamp(num(a[0], 22), 2, 80) }), out: b => 'gravity ' + (b.n || 22), t: 'phys' },
    launch: { args: 'power', doc: 'Throw the player upwards.', map: a => ({ n: clamp(num(a[0], 18), 1, 60) }), out: b => 'launch ' + (b.n || 18) },
    freeze: { args: 'seconds', doc: 'Stop the player moving for a moment.', map: a => ({ s: clamp(num(a[0], 2), 0.1, 30) }), out: b => 'freeze ' + (b.s || 2) },
    win: { args: '"text"', doc: 'Finish the game as a win.', map: a => ({ m: a.join(' ').replace(/^"|"$/g, '').slice(0, 80) || 'You won!' }), out: b => 'win "' + Q(b.m || '') + '"' },
    heal: { args: 'amount', doc: 'Give the player health back (PVP).', map: a => ({ n: clamp(num(a[0], 25), 1, 500) }), out: b => 'heal ' + (b.n || 25) },
    hurt: { args: 'amount', doc: 'Take health away (PVP).', map: a => ({ n: clamp(num(a[0], 25), 1, 500) }), out: b => 'hurt ' + (b.n || 25) },
    slow: { args: 'percent seconds', doc: 'Slow the player down for a while.', map: a => ({ p: clamp(num(a[0], 40), 10, 100), s: clamp(num(a[1], 2), 0.2, 20) }), out: b => 'slow ' + (b.p || 40) + ' ' + (b.s || 2), t: 'slowPlayer' },
    jumpboost: { args: 'percent seconds', doc: 'Give the player a bigger jump for a while.', map: a => ({ p: clamp(num(a[0], 200), 100, 400), s: clamp(num(a[1], 3), 0.2, 20) }), out: b => 'jumpboost ' + (b.p || 200) + ' ' + (b.s || 3), t: 'jumpBoost' },
    show: { t: 'show', args: 'object', doc: 'Make an object appear.', map: a => ({ on: 'show', o: objOf(a[0]) || '' }), out: b => 'show ' + objName(b.o) },
    hide: { t: 'show', args: 'object', doc: 'Make an object disappear.', map: a => ({ on: 'hide', o: objOf(a[0]) || '' }), out: b => 'hide ' + objName(b.o) },
    color: { args: 'object #colour', doc: 'Change the colour of an object.', map: a => ({ o: objOf(a[0]) || '', c: hex(a[1], '#ff4b4b') }), out: b => 'color ' + objName(b.o) + ' ' + (b.c || '#ff4b4b') },
    move: {
      args: 'object x y z [in seconds]', doc: 'Slide an object by that much.',
      map: a => { const i = a.indexOf('in'); return { o: objOf(a[0]) || '', x: num(a[1], 0), y: num(a[2], 0), z: num(a[3], 0), s: clamp(num(i >= 0 ? a[i + 1] : 1, 1), 0, 30) }; },
      out: b => 'move ' + objName(b.o) + ' ' + (b.x || 0) + ' ' + (b.y || 0) + ' ' + (b.z || 0) + ' in ' + (b.s == null ? 1 : b.s)
    },
    warp: {
      args: 'object to x y z | object to object', doc: 'Jump an object straight to a place.',
      map: a => {
        const o = objOf(a[0]) || '';
        if (/^to$/i.test(a[1] || '')) { const u = objOf(a[2]); if (u) return { o, w: 'obj', to: u }; return { o, w: 'pos', x: num(a[2], 0), y: num(a[3], 0), z: num(a[4], 0) }; }
        return { o, w: 'pos', x: 0, y: 0, z: 0 };
      },
      out: b => 'warp ' + objName(b.o) + ' to ' + (b.w == 'obj' ? objName(b.to) : (b.x || 0) + ' ' + (b.y || 0) + ' ' + (b.z || 0))
    },
    scale: { args: 'object percent [in seconds]', doc: 'Grow or shrink an object.', map: a => { const i = a.indexOf('in'); return { o: objOf(a[0]) || '', p: clamp(num(a[1], 200), 0, 400), s: clamp(num(i >= 0 ? a[i + 1] : 1, 1), 0, 20) }; }, out: b => 'scale ' + objName(b.o) + ' ' + (b.p == null ? 200 : b.p) + ' in ' + (b.s == null ? 1 : b.s) },
    fade: { args: 'object percent [in seconds]', doc: 'Make an object see-through.', map: a => { const i = a.indexOf('in'); return { o: objOf(a[0]) || '', p: clamp(num(a[1], 0), 0, 100), s: clamp(num(i >= 0 ? a[i + 1] : 1, 1), 0, 20) }; }, out: b => 'fade ' + objName(b.o) + ' ' + (b.p == null ? 0 : b.p) + ' in ' + (b.s == null ? 1 : b.s) },
    turn: { args: 'object degrees [in seconds]', doc: 'Turn an object to an angle.', map: a => { const i = a.indexOf('in'); return { o: objOf(a[0]) || '', deg: clamp(num(a[1], 90), -360, 360), s: clamp(num(i >= 0 ? a[i + 1] : 1, 1), 0, 20) }; }, out: b => 'turn ' + objName(b.o) + ' ' + (b.deg == null ? 90 : b.deg) + ' in ' + (b.s == null ? 1 : b.s) },
    face: { args: 'object', doc: 'Make an object look at the player.', map: a => ({ o: objOf(a[0]) || '' }), out: b => 'face ' + objName(b.o) },
    spin: { args: 'object degrees-per-second', doc: 'Spin an object, 0 to stop it.', map: a => ({ o: objOf(a[0]) || '', deg: clamp(num(a[1], 90), -720, 720) }), out: b => 'spin ' + objName(b.o) + ' ' + (b.deg == null ? 90 : b.deg) },
    clone: {
      args: 'coin|copy object [at x y z] [life seconds]', doc: 'Drop a coin, or a copy of an object.',
      map: a => {
        const kind = String(a[0] || 'coin').toLowerCase() == 'copy' ? 'deco' : 'coin';
        const o = { kind, o: objOf(a[1]) || '' };
        const at = a.indexOf('at'), lf = a.indexOf('life');
        if (at >= 0) { o.x = num(a[at + 1], 0); o.y = num(a[at + 2], 0); o.z = num(a[at + 3], 0); }
        if (lf >= 0) o.life = clamp(num(a[lf + 1], 0), 0, 120);
        return o;
      },
      out: b => 'clone ' + (b.kind == 'deco' ? 'copy' : 'coin') + ' ' + objName(b.o) + ' at ' + (b.x || 0) + ' ' + (b.y || 0) + ' ' + (b.z || 0) + (b.life ? ' life ' + b.life : '')
    },
    despawn: { args: 'object', doc: 'Remove an object from the game.', map: a => ({ o: objOf(a[0]) || '' }), out: b => 'despawn ' + objName(b.o) },
    reset: { args: 'object', doc: 'Put an object back where it started.', map: a => ({ o: objOf(a[0]) || '' }), out: b => 'reset ' + objName(b.o), t: 'resetPos' },
    opacity: { args: 'object percent', doc: 'How solid an object is.', map: a => ({ o: objOf(a[0]) || '', p: clamp(num(a[1], 100), 0, 100) }), out: b => 'opacity ' + objName(b.o) + ' ' + (b.p == null ? 100 : b.p) },
    label: { args: 'object "text"', doc: 'Show a label above an object.', map: a => ({ o: objOf(a[0]) || '', m: a.slice(1).join(' ').replace(/^"|"$/g, '').slice(0, 24) || '!' }), out: b => 'label ' + objName(b.o) + ' "' + Q(b.m || '') + '"', t: 'nameTag' },
    unlabel: { args: 'object', doc: 'Remove the label above an object.', map: a => ({ o: objOf(a[0]) || '' }), out: b => 'unlabel ' + objName(b.o), t: 'labelHide' },
    dropcoin: { args: 'object x y z', doc: 'Drop a coin at an offset from an object.', map: a => ({ o: objOf(a[0]) || '', x: num(a[1], 0), y: num(a[2], 0), z: num(a[3], 0) }), out: b => 'dropcoin ' + objName(b.o) + ' ' + (b.x || 0) + ' ' + (b.y || 0) + ' ' + (b.z || 0), t: 'spawnCoin' },
    score: {
      args: '+ n | = n', doc: 'Change the score.',
      map: a => { const op = a[0] == '=' ? 'set' : 'add'; const n = num(a[1], null); if (n == null) return { err: 'Score looks like: score + 10, or score = 0.' }; return { op, n }; },
      out: b => 'score ' + (b.op == 'set' ? '= ' : '+ ') + (b.n || 0)
    },
    var: {
      args: 'A-F + n | A-F = n', doc: 'Change one of your variables.',
      map: a => { const v = valOf(a[0]); if (!v || v == 'score') return { err: 'Use a variable A to F, like: var A + 1.' }; const op = a[1] == '=' ? 'set' : 'add'; const n = num(a[2], null); if (n == null) return { err: 'Variables look like: var A + 1.' }; return { v, op, n }; },
      out: b => 'var ' + b.v + ' ' + (b.op == 'set' ? '= ' : '+ ') + (b.n || 0)
    },
    coins: { args: 'number', doc: 'Give the player Ruko coins.', map: a => ({ n: clamp(num(a[0], 10), -999, 999) }), out: b => 'coins ' + (b.n == null ? 10 : b.n) },
    rand: { args: 'target low high', doc: 'Put a random number into the score or a variable.', map: a => { const v = valOf(a[0]) || 'score'; return { v, a: num(a[1], 1), b: num(a[2], 10) }; }, out: b => 'rand ' + b.v + ' ' + b.a + ' ' + b.b, t: 'randvar' },
    math: { args: 'target a op b', doc: 'Combine two values with + - * or /.', map: a => { const v = valOf(a[0]) || 'score', va = valOf(a[1]) || 'score', vb = valOf(a[3]) || 'A'; const op = a[2] == '-' ? 'sub' : a[2] == '*' ? 'mul' : a[2] == '/' ? 'div' : 'add'; return { v, a: va, op, b: vb }; }, out: b => 'math ' + b.v + ' ' + b.a + ' ' + ({ sub: '-', mul: '*', div: '/' }[b.op] || '+') + ' ' + b.b, t: 'mathvar' },
    clamp: { args: 'variable low high', doc: 'Keep a variable between two numbers.', map: a => ({ v: valOf(a[0]) || 'A', lo: num(a[1], 0), hi: num(a[2], 10) }), out: b => 'clamp ' + b.v + ' ' + b.lo + ' ' + b.hi, t: 'clampVar' },
    copy: { args: 'variable value', doc: 'Copy one value into a variable.', map: a => ({ v: valOf(a[0]) || 'A', v2: valOf(a[1]) || 'score' }), out: b => 'copy ' + b.v + ' ' + b.v2, t: 'copyVar' },
    swap: { args: 'variable variable', doc: 'Swap two variables.', map: a => ({ v: valOf(a[0]) || 'A', v2: valOf(a[1]) || 'B' }), out: b => 'swap ' + b.v + ' ' + b.v2, t: 'swapVar' },
    round: { args: 'variable step', doc: 'Round a variable to the nearest step.', map: a => ({ v: valOf(a[0]) || 'A', step: clamp(num(a[1], 1), 0.1, 100) }), out: b => 'round ' + b.v + ' ' + b.step, t: 'roundVar' },
    abs: { args: 'variable', doc: 'Make a variable positive.', map: a => ({ v: valOf(a[0]) || 'A' }), out: b => 'abs ' + b.v, t: 'absVar' },
    pow: { args: 'variable power', doc: 'Raise a variable to a power.', map: a => ({ v: valOf(a[0]) || 'A', x: clamp(num(a[1], 2), -4, 4) }), out: b => 'pow ' + b.v + ' ' + b.x, t: 'powVar' },
    mod: { args: 'variable number', doc: 'Keep only the remainder.', map: a => ({ v: valOf(a[0]) || 'A', x: clamp(num(a[1], 2), 1, 100) }), out: b => 'mod ' + b.v + ' ' + b.x, t: 'modVar' },
    distance: { args: 'variable object', doc: 'How far the player is from an object.', map: a => ({ v: valOf(a[0]) || 'A', o: objOf(a[1]) || '' }), out: b => 'distance ' + b.v + ' ' + objName(b.o), t: 'distVar' },
    position: { args: 'variable x|y|z object', doc: 'Read where an object is.', map: a => ({ v: valOf(a[0]) || 'A', ax: ['x', 'y', 'z'].includes(String(a[1] || '').toLowerCase()) ? String(a[1]).toLowerCase() : 'x', o: objOf(a[2]) || '' }), out: b => 'position ' + b.v + ' ' + (b.ax || 'x') + ' ' + objName(b.o), t: 'posVar' },
    angle: { args: 'variable object', doc: 'The angle from the player to an object, in degrees.', map: a => ({ v: valOf(a[0]) || 'A', o: objOf(a[1]) || '' }), out: b => 'angle ' + b.v + ' ' + objName(b.o), t: 'angleVar' },
    nearcount: { args: 'variable radius', doc: 'Count the objects within that many studs.', map: a => ({ v: valOf(a[0]) || 'A', r: clamp(num(a[1], 10), 1, 100) }), out: b => 'nearcount ' + b.v + ' ' + b.r, t: 'nearCount' },
    keyheld: { args: 'variable key', doc: '1 while a key is held down.', map: a => ({ v: valOf(a[0]) || 'A', k: KEYS.includes(String(a[1] || '').toLowerCase()) ? String(a[1]).toLowerCase() : 'space' }), out: b => 'keyheld ' + b.v + ' ' + b.k, t: 'keyHeld' },
    restarttimer: { args: '', doc: 'Restart the stopwatch.', map: () => ({}), out: () => 'restart timer', t: 'timerReset' },
    timer: { args: 'variable', doc: 'Put the stopwatch seconds in a variable.', map: a => ({ v: valOf(a[0]) || 'A' }), out: b => 'timer ' + b.v, t: 'timerVar' },
    hud: { args: '"text"', doc: 'Show text on screen while the game runs.', map: a => ({ m: a.join(' ').replace(/^"|"$/g, '').slice(0, 60) || 'Hello!' }), out: b => 'hud "' + Q(b.m || '') + '"', t: 'hudText' },
    hudclear: { args: '', doc: 'Clear the on-screen text.', map: () => ({}), out: () => 'hudclear', t: 'hudClear' },
    hudnum: { args: 'value "label"', doc: 'Show a number that updates on screen.', map: a => ({ v: valOf(a[0]) || 'score', m: a.slice(1).join(' ').replace(/^"|"$/g, '').slice(0, 24) || 'Score' }), out: b => 'hudnum ' + b.v + ' "' + Q(b.m || '') + '"', t: 'hudValue' },
    hudmix: { args: '"label" value', doc: 'Show a label and a value together.', map: a => ({ m: a[0] ? a[0].replace(/"/g, '') : 'Score', v: valOf(a[1]) || 'score' }), out: b => 'hudmix "' + Q(b.m || '') + '" ' + b.v, t: 'hudMix' },
    bar: { args: 'percent #colour', doc: 'Draw a progress bar.', map: a => ({ p: clamp(num(a[0], 50), 0, 100), cc: hex(a[1], '#5b4bff') }), out: b => 'bar ' + (b.p == null ? 50 : b.p) + ' ' + (b.cc || '#5b4bff') },
    picture: { args: '"image url" percent', doc: 'Show a picture over the game.', map: a => ({ a: (a[0] || '').replace(/"/g, ''), p: clamp(num(a[1], 60), 10, 100) }), out: b => 'picture "' + (b.a || '') + '" ' + (b.p || 60) },
    hidepictures: { args: '', doc: 'Hide every picture.', map: () => ({}), out: () => 'hidepictures', t: 'pictureHide' },
    texture: { args: 'object "image url"', doc: 'Put a picture on an object.', map: a => ({ o: objOf(a[0]) || '', a: (a[1] || '').replace(/"/g, '') }), out: b => 'texture ' + objName(b.o) + ' "' + (b.a || '') + '"' },
    chase: { args: 'object speed', doc: 'Make an object chase the player.', map: a => ({ o: objOf(a[0]) || '', n: clamp(num(a[1], 6), 0.5, 30) }), out: b => 'chase ' + objName(b.o) + ' ' + (b.n || 6) },
    flee: { args: 'object speed', doc: 'Make an object run away.', map: a => ({ o: objOf(a[0]) || '', n: clamp(num(a[1], 6), 0.5, 30) }), out: b => 'flee ' + objName(b.o) + ' ' + (b.n || 6) },
    orbit: { args: 'object speed', doc: 'Make an object circle the player.', map: a => ({ o: objOf(a[0]) || '', n: clamp(num(a[1], 4), 0.5, 30) }), out: b => 'orbit ' + objName(b.o) + ' ' + (b.n || 4) },
    follow: { args: 'object distance', doc: 'Make an object follow, stopping that far away.', map: a => ({ o: objOf(a[0]) || '', n: clamp(num(a[1], 4), 1, 30) }), out: b => 'follow ' + objName(b.o) + ' ' + (b.n || 4) },
    bounce: { args: 'object speed', doc: 'Make an object bob up and down.', map: a => ({ o: objOf(a[0]) || '', n: clamp(num(a[1], 2), 0.2, 10) }), out: b => 'bounce ' + objName(b.o) + ' ' + (b.n || 2) },
    patrol: { args: 'object studs speed', doc: 'Make an object pace back and forth.', map: a => ({ o: objOf(a[0]) || '', n: clamp(num(a[1], 6), 1, 60), x: clamp(num(a[2], 2), 0.2, 10) }), out: b => 'patrol ' + objName(b.o) + ' ' + (b.n || 6) + ' ' + (b.x || 2) },
    damagenear: { t: 'damageNear', args: 'amount radius object', doc: 'Damage the player when they get close.', map: a => ({ n: clamp(num(a[0], 20), 1, 500), x: clamp(num(a[1], 3), 1, 40), o: objOf(a[2]) || '' }), out: b => 'damagenear ' + (b.n || 20) + ' ' + (b.x || 3) + ' ' + objName(b.o) },
    pushaway: { t: 'pushAway', args: 'object power', doc: 'Push the player away from an object.', map: a => ({ o: objOf(a[0]) || '', n: clamp(num(a[1], 12), 1, 60) }), out: b => 'pushaway ' + objName(b.o) + ' ' + (b.n || 12) }
  };
  // Aliases people reach for.
  CMD.teleport = CMD.tp;
  CMD.msg = CMD.say;
  CMD.message = CMD.say;
  CMD.hidepics = CMD.hidepictures;
  CMD.restart = CMD.restarttimer;
  CMD.givecoins = CMD.coins;
  CMD.distanceTo = CMD.distance;

  const ACTIONS = Object.keys(CMD).filter(k => CMD[k] && CMD[k].map);

  /* ---------- the rest of the language ---------- */
  // The reader and the editor are big enough to sit in their own files. They are started from here,
  // one after the other, so the language is ready in one go.
  window.RKS = { B, E, Q, num, clamp, hex, isHex, isNum, valOf, objOf, objName, labelOf, VARS, KEYS, SOUNDS, TRIG, CMD, COND_TEXT, condParse, MARKER, ge, say };
  (function load(list) {
    const name = list.shift();
    if (!name) return;
    const s = document.createElement('script');
    s.src = 'js/' + name + '?v=' + Date.now();
    s.onload = s.onerror = () => load(list);
    document.body.appendChild(s);
  })(['60b-rukoscript-reader.js', '60c-rukoscript-editor.js']);
})();
