/* ---------- v47: write scripts as text ---------- */
/* Some people would rather type than drag blocks. This adds "Write code" to the Code tab: plain
   text that is compiled into the same scripts the blocks produce, so both ways of working are the
   same thing underneath and can be mixed.

   It is a small language, not JavaScript: every line is read and turned into one block. Nothing is
   evaluated, so nothing a player types can run as code in anyone's browser. */
(function () {
  if (window.RK_TEXTCODE) return;
  window.RK_TEXTCODE = 1;

  const ge = () => {
    try {
      return typeof GE === 'undefined' ? null : GE;
    } catch (e) {
      return null;
    }
  };
  const say = m => {
    try {
      typeof toast === 'function' ? toast(m) : console.log(m);
    } catch (e) {}
  };

  const SOUNDS = ['beep', 'coin', 'jump', 'boom', 'win', 'hurt'];
  const PHYS = ['speed', 'jump', 'gravity'];

  const EXAMPLE = [
    '# Lines that start with when begin a script.',
    '# Everything under it runs when that happens.',
    'when start',
    '  say "Welcome to my game!" 3',
    '  sound coin',
    '',
    'when touch',
    '  score +10',
    '  sound coin',
    '  burst #ffd23f',
    '',
    'when timer 5',
    '  shake 0.4',
    '  var A +1',
    '',
    'when fall -20',
    '  respawn',
    '  say "Watch the gaps!" 1.5',
    '',
    'when score 100',
    '  win "You got a hundred!"',
    '  sound win'
  ].join('\n');

  const num = (v, d) => {
    const n = parseFloat(v);
    return isFinite(n) ? n : d;
  };
  const quoted = (line, fallback) => {
    const m = line.match(/"([^"]*)"/);
    return m ? m[1].slice(0, 80) : fallback;
  };

  function parseHeader(rest, sel) {
    const parts = rest.trim().split(/\s+/);
    const t = (parts[0] || '').toLowerCase();
    const a = parts.slice(1);
    if (t === 'start' || t === 'jump' || t === 'land' || t === 'die') return { t };
    if (t === 'timer') return { t: 'timer', n: Math.max(0.2, num(a[0], 5)) };
    if (t === 'touch' || t === 'release') return { t, o: sel || '' };
    if (t === 'near') return { t: 'near', n: Math.max(1, num(a[0], 5)), o: sel || '' };
    if (t === 'fall') return { t: 'fall', n: num(a[0], -15) };
    if (t === 'score') return { t: 'score', n: num(a[0], 10) };
    if (t === 'press') return { t: 'press', k: (a[0] || 'space').toLowerCase() };
    return null;
  }

  function parseAction(line, sel) {
    const s = line.trim();
    const word = (s.match(/^[a-zA-Z]+/) || [''])[0].toLowerCase();
    const tail = s.slice(word.length).trim();
    const a = tail.split(/\s+/).filter(Boolean);
    switch (word) {
      case 'say':
        return { t: 'say', m: quoted(tail, 'Hello!'), s: Math.max(0, num(a[a.length - 1], 2)) };
      case 'broadcast':
        return { t: 'broadcast', m: quoted(tail, 'Something happened!') };
      case 'sound': {
        const k = (a[0] || 'beep').toLowerCase();
        if (!SOUNDS.includes(k)) return { err: 'Unknown sound "' + k + '". Try ' + SOUNDS.join(', ') + '.' };
        return { t: 'sound', k };
      }
      case 'score': {
        const m = tail.match(/^([+\-=])\s*(-?\d+(?:\.\d+)?)$/);
        if (!m) return { err: 'Score needs +10, -5 or =0.' };
        return { t: 'score', op: m[1] === '=' ? 'set' : 'add', n: num(m[2], 0) };
      }
      case 'var': {
        const m = tail.match(/^([ABC])\s*([+\-=])\s*(-?\d+(?:\.\d+)?)$/i);
        if (!m) return { err: 'Variables look like: var A +1 (A, B or C).' };
        return { t: 'var', v: m[1].toUpperCase(), op: m[2] === '=' ? 'set' : 'add', n: num(m[3], 0) };
      }
      case 'coins':
        return { t: 'coins', n: num(a[0], 0) };
      case 'phys': {
        const k = (a[0] || '').toLowerCase();
        if (!PHYS.includes(k)) return { err: 'Change speed, jump or gravity, like: phys speed 12.' };
        return { t: 'phys', k, n: Math.max(2, Math.min(80, num(a[1], 10))) };
      }
      case 'launch':
        return { t: 'launch', n: Math.max(1, Math.min(60, num(a[0], 18))) };
      case 'burst':
        return { t: 'burst', o: sel || '', c: /^#?[0-9a-f]{6}$/i.test(a[0] || '') ? (a[0][0] === '#' ? a[0] : '#' + a[0]) : '#ffd23f' };
      case 'shake':
        return { t: 'shake', s: Math.max(0.1, Math.min(5, num(a[0], 0.6))) };
      case 'wait':
        return { t: 'wait', s: Math.max(0, Math.min(60, num(a[0], 1))) };
      case 'win':
        return { t: 'win', m: quoted(tail, 'You won!') };
      case 'tp':
        return { t: 'tp', w: 'spawn', o: '', x: 0, y: 5, z: 0 };
      case 'respawn':
        return { t: 'respawn' };
      case 'freeze':
        return { t: 'freeze', s: Math.max(0.1, Math.min(30, num(a[0], 2))) };
      case 'heal':
        return { t: 'heal', n: Math.max(1, num(a[0], 25)) };
      case 'hurt':
        return { t: 'hurt', n: Math.max(1, num(a[0], 25)) };
      case 'show':
        return { t: 'show', o: sel || '', on: 'show' };
      case 'hide':
        return { t: 'show', o: sel || '', on: 'hide' };
      case 'color':
        return { t: 'color', o: sel || '', c: /^#?[0-9a-f]{6}$/i.test(a[0] || '') ? (a[0][0] === '#' ? a[0] : '#' + a[0]) : '#ff4b4b' };
      case 'move':
        return { t: 'move', o: sel || '', x: num(a[0], 0), y: num(a[1], 0), z: num(a[2], 0), s: Math.max(0, num(a[3], 1)) };
      case 'scale':
        return { t: 'scale', o: sel || '', p: Math.max(0, Math.min(400, num(a[0], 200))), s: Math.max(0, num(a[1], 1)) };
      case 'fade':
        return { t: 'fade', o: sel || '', p: Math.max(0, Math.min(100, num(a[0], 0))), s: Math.max(0, num(a[1], 1)) };
      case 'note':
        return { t: 'note', m: tail.slice(0, 120) };
      default:
        return { err: 'I do not know "' + word + '". Look at the example for the words that work.' };
    }
  }

  function parse(text, sel) {
    const out = [];
    const errors = [];
    let cur = null;
    const lines = String(text || '').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.replace(/\s+#.*$/, '').trim();
      if (!line || line[0] === '#' || line.startsWith('//')) continue;
      const indented = /^\s+/.test(raw);
      if (/^when\b/i.test(line)) {
        const h = parseHeader(line.slice(4), sel);
        if (!h) {
          errors.push('Line ' + (i + 1) + ': "' + line + '" is not a trigger I know. Try: when start, when touch, when timer 5.');
          cur = null;
          continue;
        }
        cur = { h, b: [] };
        out.push(cur);
        continue;
      }
      if (!cur) {
        errors.push('Line ' + (i + 1) + ': this needs a "when …" line above it.');
        continue;
      }
      if (!indented && /^[a-zA-Z]+\s+[A-Z]/.test(line)) {
        // still fine: actions may sit on their own line without indentation
      }
      const b = parseAction(line, sel);
      if (b && b.err) {
        errors.push('Line ' + (i + 1) + ': ' + b.err);
        continue;
      }
      if (b) cur.b.push(b);
    }
    if (!out.length) errors.push('There is nothing to run yet. Start with "when start".');
    return { scripts: out, errors };
  }

  /* Turn existing blocks into text, so opening the writer shows what the game already does. */
  const HATS = { start: 'when start', jump: 'when jump', land: 'when land', die: 'when die', timer: 'when timer', touch: 'when touch', release: 'when release', near: 'when near', fall: 'when fall', score: 'when score', press: 'when press' };
  function toCode(scripts) {
    const lines = [];
    for (const s of scripts || []) {
      const h = s.h || {};
      const head = HATS[h.t];
      if (!head) continue;
      let line = head;
      if (h.t === 'timer' || h.t === 'score') line += ' ' + (+h.n || 5);
      if (h.t === 'fall' || h.t === 'near') line += ' ' + (+h.n || 0);
      if (h.t === 'press') line += ' ' + (h.k || 'space');
      lines.push(line);
      for (const b of s.b || []) {
        const t = b.t;
        if (t === 'say') lines.push('  say "' + (b.m || '') + '" ' + (+b.s || 2));
        else if (t === 'sound') lines.push('  sound ' + b.k);
        else if (t === 'score') lines.push('  score ' + (b.op === 'set' ? '=' : '+') + (+b.n || 0));
        else if (t === 'var') lines.push('  var ' + b.v + ' ' + (b.op === 'set' ? '=' : '+') + (+b.n || 0));
        else if (t === 'coins') lines.push('  coins ' + (+b.n || 0));
        else if (t === 'phys') lines.push('  phys ' + b.k + ' ' + (+b.n || 10));
        else if (t === 'launch') lines.push('  launch ' + (+b.n || 18));
        else if (t === 'shake') lines.push('  shake ' + (+b.s || 0.6));
        else if (t === 'wait') lines.push('  wait ' + (+b.s || 1));
        else if (t === 'win') lines.push('  win "' + (b.m || '') + '"');
        else if (t === 'respawn') lines.push('  respawn');
        else if (t === 'tp') lines.push('  tp spawn');
        else if (t === 'freeze') lines.push('  freeze ' + (+b.s || 2));
        else if (t === 'heal') lines.push('  heal ' + (+b.n || 25));
        else if (t === 'hurt') lines.push('  hurt ' + (+b.n || 25));
        else if (t === 'show') lines.push('  ' + (b.on === 'show' ? 'show' : 'hide'));
        else if (t === 'move') lines.push('  move ' + (+b.x || 0) + ' ' + (+b.y || 0) + ' ' + (+b.z || 0) + ' ' + (+b.s || 1));
        else if (t === 'scale') lines.push('  scale ' + (+b.p || 200) + ' ' + (+b.s || 1));
        else if (t === 'fade') lines.push('  fade ' + (+b.p || 0) + ' ' + (+b.s || 1));
        else if (t === 'broadcast') lines.push('  broadcast "' + (b.m || '') + '"');
        else lines.push('  # (' + t + ' is a block only, it stays as a block)');
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  const HELP = '<p style="margin-top:0">Type a script line by line. A line starting with <b>when</b> says <i>when</i> it runs; the lines under it are what happens. Lines starting with <b>#</b> are notes.</p>'
    + '<pre style="background:#1c1d20;border:1px solid #3a3d44;border-radius:10px;padding:10px;overflow:auto;font-size:12px;line-height:1.5">'
    + 'when start\n  say "Welcome!" 3\n\nwhen touch\n  score +10\n  sound coin\n\nwhen timer 5\n  shake 0.4'
    + '</pre>'
    + '<p style="font-size:13px;line-height:1.6"><b>When:</b> start, touch, release, near 5, timer 5, jump, land, die, fall -20, score 100, press space<br>'
    + '<b>Do:</b> say "text" 2, sound coin, score +10, var A +1, coins 5, phys speed 12, launch 20, burst #ffd23f, shake 0.6, wait 1, win "text", respawn, tp spawn, freeze 2, heal 25, hurt 25, show, hide, move 0 4 0 1, scale 200 1, fade 0 1, broadcast "text"<br>'
    + '<b>Sounds:</b> ' + SOUNDS.join(', ') + '</p>'
    + '<p style="font-size:12px;color:#9aa0ad">Compiling replaces the blocks in this game with what you wrote. Anything you wrote that it cannot read is listed first, so nothing is lost by accident.</p>';

  function open() {
    if (typeof GE === 'undefined' || !GE) return say('Open a game first.');
    const sel = GE.objs && GE.sel >= 0 && GE.objs[GE.sel] ? GE.objs[GE.sel].u : '';
    const text = toCode(GE.scripts || []) || EXAMPLE;
    if (typeof openSheet !== 'function') return say('The code panel is not ready yet.');
    openSheet('Write code instead of blocks', HELP
      + '<textarea id="rkcs" spellcheck="false" style="width:100%;min-height:220px;background:#1c1d20;color:#e6e6e6;border:1px solid #3a3d44;border-radius:10px;padding:10px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;line-height:1.5">' + esc(text) + '</textarea>'
      + '<div class="chips"><button class="pri" id="rkcrun">✔ Compile</button><button id="rkcex">Example</button><button id="rkcload">From my blocks</button></div>'
      + '<pre id="rkcout" style="white-space:pre-wrap;font-size:12px;color:#ff8f8f;margin:6px 0 0"></pre>');
    const ta = document.getElementById('rkcs');
    const out = document.getElementById('rkcout');
    const ex = document.getElementById('rkcex');
    const ld = document.getElementById('rkcload');
    if (ex) ex.onclick = () => { if (ta) ta.value = EXAMPLE; if (out) out.textContent = ''; };
    if (ld) ld.onclick = () => { if (ta) ta.value = toCode(GE.scripts || []); if (out) out.textContent = ''; };
    document.getElementById('rkcrun').onclick = () => {
      const r = parse(ta ? ta.value : '', sel);
      if (r.errors.length) {
        out.textContent = r.errors.slice(0, 8).join('\n');
        return;
      }
      try { if (typeof codeSnap === 'function') codeSnap(); } catch (e) {}
      GE.scripts = r.scripts;
      try { codeSave(); } catch (e) {}
      try { codeRender(); } catch (e) {}
      const sheet = document.getElementById('rksh');
      if (sheet) sheet.remove();
      say('Compiled ' + r.scripts.length + ' script' + (r.scripts.length === 1 ? '' : 's') + '.', true);
    };
  }

  /* A button at the top of the Code tab. Installed defensively: the editor may still be drawing
     when this file runs, so it retries rather than assuming everything already exists. */
  let installed = false;
  function install() {
    try {
      const orig = window.codeRender;
      if (typeof orig === 'function' && !orig.__rkCode) {
        const wrapped = function () {
          const r = orig.apply(this, arguments);
          try { addBar(); } catch (e) {}
          return r;
        };
        wrapped.__rkCode = 1;
        window.codeRender = wrapped;
      }
      addBar();
      installed = true;
    } catch (e) {
      console.warn('rkcode: could not add the code button', e);
    }
  }
  function addBar() {
    const P = document.getElementById('cd');
    if (!P || P.querySelector('#rk-codebar')) return;
    if (!P.querySelector('.scr') && !P.querySelector('[data-ns]')) return;
    const bar = document.createElement('div');
    bar.id = 'rk-codebar';
    bar.className = 'chips';
    bar.innerHTML = '<button class="pri" data-rkc="1">⌨️ Write code</button>';
    P.prepend(bar);
  }

  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-rkc]') : null;
    if (!b) return;
    e.preventDefault();
    open();
  }, true);

  try { install(); } catch (e) {}
  if (document.readyState !== 'complete') addEventListener('load', install);
  setTimeout(install, 400);
  setTimeout(install, 1600);
  try {
    const app = document.getElementById('app');
    if (app && typeof MutationObserver !== 'undefined') {
      new MutationObserver(() => { if (!installed) install(); else addBar(); }).observe(app, { childList: true, subtree: true });
    }
  } catch (e) {}

  window.RKCODETEXT = { parse, toCode };
})();
