/* ---------- v60b: RukoScript, the reader ---------- */
/* Part two of the language: the words in a script are read here and turned into the script tree the
   runtime already knows, and an existing game is printed back out as RukoScript so a game made with
   the old blocks opens as readable code. Nothing is eval'd and nothing is written back until the
   writer presses Compile. */
(function () {
  if (!window.RKS || window.RKS.parse) return;
  const { B, E, Q, num, clamp, hex, isHex, isNum, valOf, objOf, objName, TRIG, CMD, COND_TEXT, condParse, MARKER, say, ge } = window.RKS;

  /* ---------- 3. the reader ---------- */
  // Words, with "quoted things" kept together so an object called Big Platform can still be one word.
  function words(s) {
    const out = [];
    const re = /"([^"]*)"|(\S+)/g;
    let m;
    while ((m = re.exec(String(s || '')))) out.push(m[1] != null ? '"' + m[1] + '"' : m[2]);
    return out;
  }
  const unq = s => String(s == null ? '' : s).replace(/^"|"$/g, '').trim();
  // A # starts a comment, unless it is inside quotes or a #rrggbb colour.
  function stripComment(line) {
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') q = !q;
      if (q) continue;
      if (c === '/' && line[i + 1] === '/') return line.slice(0, i);
      if (c === '#' && !isHex(line.slice(i, i + 7))) return line.slice(0, i);
    }
    return line;
  }

  // Two word commands are checked first, so "wait until score > 5" is not read as "wait".
  function findCmd(code) {
    const w = String(code || '').trim().toLowerCase().split(/\s+/);
    const two = (w[0] || '') + ' ' + (w[1] || '');
    if (CMD[two] && CMD[two].map) return [two, 2];
    if (CMD[w[0]] && CMD[w[0]].map) return [w[0], 1];
    return null;
  }

  function parse(src) {
    const errors = [];
    const scripts = [];
    const lines = String(src == null ? '' : src).split(/\r?\n/);
    let cur = null;
    let stack = [];
    const list = () => (stack.length ? stack[stack.length - 1].list : null);
    const add = b => {
      const L = list();
      if (!L) { return false; }
      L.push(b);
      return true;
    };
    for (let i = 0; i < lines.length; i++) {
      const ln = i + 1;
      const code = stripComment(lines[i]).trim();
      if (!code) continue;
      const low = code.toLowerCase();

      if (/^(on|when)\s+/i.test(code)) {
        if (stack.length > 1) errors.push('Line ' + ln + ': a loop or a choice above this line is still open. Add "end" first.');
        stack = [];
        const rest = code.replace(/^(on|when)\s+/i, '');
        const w = words(rest);
        const key = unq(w[0] || '').toLowerCase().replace(/[^a-z]/g, '');
        const T = TRIG[key];
        if (!T) {
          errors.push('Line ' + ln + ': "' + unq(w[0] || '') + '" is not something that can happen. Try on start, on touch, on timer 5, on jump, on land, on fall -15, on score 10, on press space.');
          cur = null;
          continue;
        }
        const h = T.h(w.slice(1).map(unq));
        cur = { h, b: [] };
        cur.h = h;
        scripts.push(cur);
        stack = [{ list: cur.b }];
        continue;
      }

      if (/^else$/i.test(low)) {
        const f = stack[stack.length - 1];
        if (!f || f.kind !== 'if') { errors.push('Line ' + ln + ': "else" only works inside an if.'); continue; }
        f.list = f.other;
        continue;
      }

      if (/^end$/i.test(low)) {
        if (stack.length <= 1) { errors.push('Line ' + ln + ': "end" with nothing open above it.'); continue; }
        stack.pop();
        continue;
      }

      if (/^if\s+/i.test(code)) {
        if (!cur) { errors.push('Line ' + ln + ': this needs an "on ..." line above it.'); continue; }
        const c = condParse(code.slice(2));
        if (c.err) { errors.push('Line ' + ln + ': ' + c.err); continue; }
        const node = B('if', { c: c.c });
        node.y = []; node.n = [];
        add(node);
        stack.push({ list: c.swap ? node.n : node.y, other: c.swap ? node.y : node.n, kind: 'if', node });
        continue;
      }

      if (/^repeat\s+/i.test(code)) {
        if (!cur) { errors.push('Line ' + ln + ': this needs an "on ..." line above it.'); continue; }
        const n = clamp(num(code.split(/\s+/)[1], 3), 1, 100);
        const node = B('rep', { n });
        node.b = [];
        add(node);
        stack.push({ list: node.b, kind: 'rep', node });
        continue;
      }

      if (/^forever$/i.test(low)) {
        if (!cur) { errors.push('Line ' + ln + ': this needs an "on ..." line above it.'); continue; }
        const node = B('forever');
        node.b = [];
        add(node);
        stack.push({ list: node.b, kind: 'forever', node });
        continue;
      }

      // while and wait until are written as a forever loop with one marker note at the top: the marker
      // is a block the server already knows and keeps, and the editor's runtime hook reads it and ends
      // the loop at the right moment. No new block types, so a saved game reloads exactly as written.
      if (/^while\s+/i.test(code)) {
        if (!cur) { errors.push('Line ' + ln + ': this needs an "on ..." line above it.'); continue; }
        const c = condParse(code.slice(5));
        if (c.err) { errors.push('Line ' + ln + ': ' + c.err); continue; }
        const node = B('forever');
        node.b = [{ t: 'note', m: '@rkwhile ' + c.text }];
        add(node);
        stack.push({ list: node.b, kind: 'while', node });
        continue;
      }
      const wu = code.match(/^(?:wait\s+until|waituntil)\s+(.+)$/i);
      if (wu) {
        if (!cur) { errors.push('Line ' + ln + ': this needs an "on ..." line above it.'); continue; }
        const c = condParse(wu[1]);
        if (c.err) { errors.push('Line ' + ln + ': ' + c.err); continue; }
        add({ t: 'forever', b: [{ t: 'note', m: '@rkuntil ' + c.text }, { t: 'wait', s: 0.1 }] });
        continue;
      }

      // everything else is one thing that happens
      if (!cur) { errors.push('Line ' + ln + ': "' + code + '" needs an "on ..." line above it.'); continue; }
      const hit = findCmd(code);
      if (!hit) {
        const w0 = code.split(/\s+/)[0];
        errors.push('Line ' + ln + ': I do not know "' + w0 + '". Open the reference to see every word the language knows.');
        continue;
      }
      const [name, nw] = hit;
      const ent = CMD[name];
      const parts = code.split(/\s+/);
      const rest = parts.slice(nw).join(' ');
      const a = words(rest);
      let r;
      try { r = ent.map(a, rest); } catch (e) { r = { err: 'I could not read that line.' }; }
      if (!r) r = {};
      if (r.err) { errors.push('Line ' + ln + ': ' + r.err); continue; }
      add(B(ent.t || name, r));
    }
    if (stack.length > 1) errors.push('A loop or a choice is still open at the end of the script. Add "end" for each one.');
    if (!scripts.length && !errors.length) errors.push('Nothing to run yet. Start with "on start".');
    return { scripts, errors };
  }

  /* ---------- 4. the printer ---------- */
  // Old games are shown as RukoScript the moment they are opened, so a game made with blocks reads
  // like typed code. Compiling is what writes back; just looking never changes a game.
  const HAT_KEY = { start: 'start', touch: 'touch', release: 'release', near: 'near', timer: 'timer', jump: 'jump', land: 'land', fall: 'fall', die: 'die', score: 'score', press: 'press', action: 'action', chatCmd: 'chat', varReach: 'varreaches' };
  function outOf(b) {
    if (!b || !b.t) return null;
    // Two blocks came from more than one word of the language, so they are printed by their setting.
    if (b.t === 'show') return (b.on === 'hide' ? 'hide ' : 'show ') + objName(b.o);
    if (b.t === 'phys') return (b.k === 'jump' ? 'jump ' : b.k === 'gravity' ? 'gravity ' : 'speed ') + (b.n == null ? 10 : b.n);
    const keys = Object.keys(CMD);
    for (const k of keys) {
      const e = CMD[k];
      if (!e || !e.out) continue;
      if ((e.t || k) === b.t) return e.out(b);
    }
    return null;
  }
  function printList(list, depth, out) {
    const pad = '  '.repeat(depth);
    for (const b of list || []) {
      if (!b) continue;
      if (b.t === 'if') {
        out.push(pad + 'if ' + COND_TEXT(b.c) + ' then');
        printList(b.y || [], depth + 1, out);
        if ((b.n || []).length) { out.push(pad + 'else'); printList(b.n, depth + 1, out); }
        out.push(pad + 'end');
        continue;
      }
      // a while or a wait until is a forever loop with a marker note first, so it is printed back as
      // the line that made it instead of as a loop the writer never typed.
      if (b.t === 'forever' && b.b && b.b[0] && b.b[0].t === 'note') {
        const mm = MARKER.exec(String(b.b[0].m || ''));
        if (mm) {
          if (mm[1] === 'until') { out.push(pad + 'wait until ' + mm[2]); continue; }
          out.push(pad + 'while ' + mm[2]);
          printList(b.b.slice(1), depth + 1, out);
          out.push(pad + 'end');
          continue;
        }
      }
      if (b.t === 'rep' || b.t === 'forever') {
        out.push(pad + (b.t === 'rep' ? 'repeat ' + (b.n || 3) : 'forever'));
        printList(b.b || [], depth + 1, out);
        out.push(pad + 'end');
        continue;
      }
      const line = outOf(b);
      out.push(pad + (line || '# this step came from an old block that the language has no word for'));
    }
  }
  function toCode(scripts) {
    const lines = [];
    (scripts || []).forEach((s, i) => {
      const h = (s && s.h) || {};
      const T = TRIG[HAT_KEY[h.t]] || TRIG.start;
      lines.push(T.out(h));
      if (s && s.off) lines.push('  # this script is switched off');
      printList(s && s.b, 1, lines);
      if (i < scripts.length - 1) lines.push('');
    });
    return lines.join('\n');
  }

  const EXAMPLE = [
    '# RukoScript. Lines starting with # are notes.',
    '# "on" says when a script runs. Everything under it is what happens.',
    '',
    'on start',
    '  hud "Collect 10 coins"',
    '  say "Welcome to my game!" for 3',
    '',
    'on touch',
    '  score + 1',
    '  sound coin',
    '  if score >= 10 then',
    '    win "You got them all!"',
    '  else',
    '    say "Nice one!" for 1',
    '  end',
    '',
    'on timer 5',
    '  announce "Five seconds gone!"',
    '',
    'on fall -20',
    '  respawn',
    '  say "Watch the gaps!" for 1.5',
    '',
    'on press space',
    '  launch 22'
  ].join('\n');

  // A small self-check: every command must point at a block the runtime knows.
  function audit() {
    const bad = [];
    try {
      const seen = new Set();
      Object.keys(CMD).forEach(k => {
        const e = CMD[k];
        if (!e || !e.map || seen.has(e)) return;
        seen.add(e);
        const t = e.t || k;
        if (typeof BLK === 'undefined' || !BLK[t]) bad.push(k + ' -> ' + t);
      });
      Object.keys(TRIG).forEach(k => {
        const h = TRIG[k].h([]);
        if (typeof HATD !== 'undefined' && !HATD[h.t]) bad.push('on ' + k + ' -> ' + h.t);
      });
    } catch (e) {}
    if (bad.length) console.warn('RukoScript: these words point at blocks that are missing:', bad);
    return bad;
  }

  window.RKS.parse = parse;
  window.RKS.toCode = toCode;
  window.RKS.EXAMPLE = EXAMPLE;
  window.RKS.audit = audit;
})();
