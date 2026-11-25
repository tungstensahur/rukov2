/* ---------- v60c: RukoScript, the editor ---------- */
/* Part three: the Code tab itself — the editor with its line numbers, the compile step, the tutorial
   and the reference, plus the one hook the runtime needs so that "while" and "wait until" behave.
   It takes over the Code tab by replacing codeRender, so the block palette is simply never drawn. */
(function () {
  if (!window.RKS || !window.RKS.parse) return;
  const { E, Q, num, clamp, TRIG, CMD, MARKER, condParse, say, ge } = window.RKS;
  const { parse, toCode, EXAMPLE, audit } = window.RKS;

  /* ---------- 5a. the one runtime addition ---------- */
  // while and wait until are stored as a forever loop with one marker note at the top. The note is a
  // block type the server already knows and keeps, so a saved game reloads exactly as written; this
  // hook reads it while the game runs: "@rkwhile <cond>" ends the loop once the condition is false,
  // "@rkuntil <cond>" ends it once the condition is true. Every other block goes to the runtime.
  function condTrue(c, X) {
    if (!c) return false;
    if (c.v === 'chance') return Math.random() * 100 < c.n;
    const value = v => {
      if (!v) return 0;
      if (v === 'score') return (X && X.SV && X.SV.score) || 0;
      if (/^[A-F]$/.test(v)) return (X && X.SV && X.SV[v]) || 0;
      try { return (typeof SKX !== 'undefined' && SKX.val) ? (SKX.val(v, X) || 0) : 0; } catch (e) { return 0; }
    };
    const a = value(c.v), b = c.v2 ? value(c.v2) : c.n;
    switch (c.o) {
      case '>': return a > b;
      case '<': return a < b;
      case '>=': return a >= b;
      case '<=': return a <= b;
      case '!=': return Math.abs(a - b) > 1e-9;
      default: return Math.abs(a - b) < 1e-3;
    }
  }
  function installRuntime() {
    if (typeof SKX === 'undefined' || !SKX || typeof SKX.run !== 'function') return false;
    if (SKX.__rkWhileHook) return true;
    const prev = SKX.run.bind(SKX);
    SKX.run = function (b, run, now, X) {
      const m = b && b.t === 'note' ? MARKER.exec(String(b.m || '')) : null;
      if (m) {
        const c = condParse(m[2]);
        if (!c.err) {
          const on = condTrue(c.c, X);
          if (m[1] === 'while' ? !on : on) {
            try { if (run && run.stack && run.stack.length) run.stack.pop(); } catch (e) {}
          }
        }
        return;
      }
      return prev(b, run, now, X);
    };
    SKX.__rkWhileHook = 1;
    return true;
  }

  /* ---------- 5b. the look of the editor ---------- */
  const CSS = `
#rke{color:#e7e8ea;font-size:13.5px}
#rke .rke-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:8px}
#rke .rke-ttl{display:flex;align-items:baseline;gap:8px}
#rke .rke-ttl b{font-size:15px;letter-spacing:-.01em}
#rke .rke-ttl span{font-size:12px;color:#9b9ea7}
#rke .rke-btns{display:flex;gap:6px;flex-wrap:wrap}
#rke button{border-radius:4px;font-size:12.5px;background:#2a2b30;border:1px solid #35373d;color:#e7e8ea;padding:6px 10px;font-weight:600}
#rke button:hover{background:#32343a;border-color:#45474f}
#rke button.pri{background:#00a2ff;border-color:#00a2ff;color:#fff}
#rke button.pri:hover{background:#1eb0ff}
#rke .rke-wrap{display:flex;border:1px solid #35373d;border-radius:6px;overflow:hidden;background:#141518;height:52vh;min-height:280px}
#rke .rke-nums{flex:none;width:38px;padding:8px 6px;text-align:right;background:#1b1c20;color:#5b5f6a;border-right:1px solid #2a2c31;
 font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden;user-select:none}
#rke textarea{flex:1;border:0;outline:0;resize:none;background:#141518;color:#e7e8ea;caret-color:#00a2ff;
 padding:8px 10px;font:12.5px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;tab-size:2;white-space:pre;overflow:auto}
#rke textarea::selection{background:#00a2ff55}
#rke .rke-out{margin-top:8px;font-size:12.5px;line-height:1.5;min-height:20px;color:#9b9ea7;white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace}
#rke .rke-out.bad{color:#ff8f8f}
#rke .rke-out.good{color:#7fe08a}
#rke .rke-hint{font-size:12px;color:#9b9ea7;margin:6px 0 0}
#rkm{position:fixed;inset:0;z-index:9999;background:#0009;display:flex;align-items:center;justify-content:center;padding:16px}
#rkm .rkm-box{background:#1b1c20;border:1px solid #35373d;border-radius:10px;max-width:720px;width:100%;max-height:88vh;overflow:auto;color:#e7e8ea;
 box-shadow:0 24px 60px #000a;padding:16px 18px;font-size:14px;line-height:1.55}
#rkm h3{margin:0 0 4px;font-size:18px}
#rkm .rkm-step{color:#9b9ea7;font-size:12px;margin-bottom:10px}
#rkm pre{background:#141518;border:1px solid #2a2c31;border-radius:6px;padding:10px;overflow:auto;font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#cfe6ff}
#rkm code{background:#141518;border-radius:3px;padding:0 4px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px}
#rkm .rkm-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;justify-content:space-between}
#rkm button{border-radius:4px;font-size:13px;background:#2a2b30;border:1px solid #35373d;color:#e7e8ea;padding:8px 12px;font-weight:600}
#rkm button.pri{background:#00a2ff;border-color:#00a2ff;color:#fff}
#rkm .rkm-ref{max-height:52vh;overflow:auto;border:1px solid #2a2c31;border-radius:6px}
#rkm .rkm-ref table{width:100%;border-collapse:collapse;font-size:12.5px}
#rkm .rkm-ref td{border-bottom:1px solid #24262b;padding:5px 8px;vertical-align:top}
#rkm .rkm-ref td:first-child{white-space:nowrap;color:#8fd0ff;font-family:ui-monospace,Menlo,Consolas,monospace}
#rkm .rkm-ref td:last-child{color:#9b9ea7}
#rkm input{width:100%;margin:8px 0;background:#141518;border:1px solid #35373d;border-radius:4px;color:#e7e8ea;padding:8px}
@media(max-width:600px){#rke .rke-wrap{height:46vh}#rke .rke-nums{width:30px;font-size:11px}}
`;
  function style() {
    if (document.getElementById('rke-style')) return;
    const s = document.createElement('style');
    s.id = 'rke-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- 5c. the editor ---------- */
  const state = { tut: 0, filter: '' };

  function srcOf() {
    const g = ge();
    if (!g) return '';
    if (typeof g.src === 'string' && g.src.trim()) return g.src;
    const txt = toCode(g.scripts || []);
    return txt.trim() ? txt : EXAMPLE;
  }
  function scriptCount() { const g = ge(); return (g && g.scripts ? g.scripts.length : 0); }

  function render() {
    const P = document.getElementById('cd');
    if (!P || !ge()) return false;
    style();
    const txt = srcOf();
    P.innerHTML = '<div id="rke">'
      + '<div class="rke-top"><div class="rke-ttl"><b>RukoScript</b><span id="rke-stat">' + scriptCount() + ' script' + (scriptCount() == 1 ? '' : 's') + ' in this game</span></div>'
      + '<div class="rke-btns"><button class="pri" id="rke-run">✔ Compile</button><button id="rke-tut">Tutorial</button><button id="rke-ref">Reference</button>'
      + '<button id="rke-ex">Example</button><button id="rke-back">From my game</button></div></div>'
      + '<div class="rke-wrap"><div class="rke-nums" id="rke-nums"></div>'
      + '<textarea id="rke-src" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off">' + E(txt) + '</textarea></div>'
      + '<div class="rke-out" id="rke-out">Press Compile, or Ctrl+Enter, to turn this into the game. Nothing changes until you do.</div>'
      + '<p class="rke-hint">"on" starts a script · indent two spaces · "end" closes an if, repeat, while or forever</p>'
      + '</div>';
    const ta = document.getElementById('rke-src');
    const nums = document.getElementById('rke-nums');
    const out = document.getElementById('rke-out');
    const drawNums = () => {
      const n = ta.value.split('\n').length;
      let h = '';
      for (let i = 1; i <= n; i++) h += i + '\n';
      nums.textContent = h;
      nums.scrollTop = ta.scrollTop;
    };
    drawNums();
    ta.addEventListener('input', () => {
      if (ge()) ge().src = ta.value;
      drawNums();
      out.className = 'rke-out';
      out.textContent = 'Unsaved changes. Press Compile to apply them.';
    });
    ta.addEventListener('scroll', () => { nums.scrollTop = ta.scrollTop; });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 2;
        if (ge()) ge().src = ta.value;
        drawNums();
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); compile(); }
    });
    document.getElementById('rke-run').onclick = () => compile();
    document.getElementById('rke-tut').onclick = () => tutorial();
    document.getElementById('rke-ref').onclick = () => reference();
    document.getElementById('rke-ex').onclick = () => {
      if (!confirm('Replace what is in the editor with the example? Nothing is saved until you compile.')) return;
      ta.value = EXAMPLE;
      if (ge()) ge().src = EXAMPLE;
      drawNums();
    };
    document.getElementById('rke-back').onclick = () => {
      const g = ge();
      if (!g) return;
      const t = toCode(g.scripts || []);
      if (!t.trim()) return say('This game has no scripts yet.');
      ta.value = t;
      g.src = t;
      drawNums();
    };
    return true;
  }

  function compile() {
    const g = ge();
    const ta = document.getElementById('rke-src');
    const out = document.getElementById('rke-out');
    if (!g || !ta || !out) return;
    const r = parse(ta.value);
    if (r.errors.length) {
      out.className = 'rke-out bad';
      out.textContent = r.errors.slice(0, 10).join('\n') + (r.errors.length > 10 ? '\n…' : '');
      return;
    }
    try { if (typeof codeSnap === 'function') codeSnap(); } catch (e) {}
    g.scripts = r.scripts;
    g.src = ta.value;
    try { if (typeof codeSave === 'function') codeSave(); } catch (e) {}
    try { if (typeof codeRender === 'function') codeRender(); } catch (e) {}
    const o2 = document.getElementById('rke-out');
    if (o2) {
      o2.className = 'rke-out good';
      o2.textContent = 'Compiled ' + r.scripts.length + ' script' + (r.scripts.length === 1 ? '' : 's') + '. Run the game to try it.';
    }
    say('Compiled ' + r.scripts.length + ' script' + (r.scripts.length === 1 ? '' : 's') + '.');
  }

  /* ---------- 5d. the tutorial ---------- */
  const LESSONS = [
    {
      t: 'A script is a "when", then what happens',
      d: 'Every script starts with <code>on</code> — that says <b>when</b> it runs. The lines under it are what happens, indented by two spaces. You can have as many scripts as you like in one game.',
      c: 'on start\n  say "Welcome to my game!" for 3'
    },
    {
      t: 'Touching things, and the score',
      d: 'This is a coin game in four lines. <code>score + 1</code> adds to the score, <code>sound coin</code> plays a sound.',
      c: 'on touch\n  score + 1\n  sound coin\n  say "Nice!" for 1'
    },
    {
      t: 'Choices: if, else, end',
      d: 'An <code>if</code> runs only when its question is true. <code>end</code> closes it. Inside a question you can use score, coins, hp, time, y, and your own variables A to F.',
      c: 'on touch\n  score + 1\n  if score >= 10 then\n    win "You got them all!"\n  else\n    say "Keep going" for 1\n  end'
    },
    {
      t: 'Loops: repeat, while, forever',
      d: '<code>repeat 5</code> runs a fixed number of times. <code>while score < 5</code> keeps going until the question stops being true. <code>forever</code> never stops on its own, so put a <code>wait</code> inside it.',
      c: 'on start\n  repeat 5\n    say "Ready?" for 0.5\n    wait 1\n  end\n\non start\n  while score < 5\n    wait 0.5\n  end\n  win "Five points!"'
    },
    {
      t: 'Moving things around',
      d: 'Name a part in the Explorer, then use that name here. <code>this</code> means whatever is selected. <code>in 1</code> is how long it takes.',
      c: 'on touch\n  color this #ff4b4b\n  move this 0 4 0 in 1\n  spin this 90\n\non timer 3\n  warp this to 0 6 0'
    },
    {
      t: 'Your own variables',
      d: 'Variables A to F are scratch numbers you can keep between scripts. <code>var A + 1</code> adds one, <code>if A = 3</code> checks it.',
      c: 'on touch\n  var A + 1\n  if A = 3 then\n    coins 25\n    say "Three touches, 25 coins!" for 2\n  end'
    },
    {
      t: 'What happens when you press Compile',
      d: 'Compiling reads every line and turns it into the game. If a line has a mistake you get the line number and nothing is changed. Games you made with the old blocks are shown here as code and keep working exactly as before — you only change them if you compile.',
      c: ''
    }
  ];

  function modal(html) {
    let m = document.getElementById('rkm');
    if (m) m.remove();
    m = document.createElement('div');
    m.id = 'rkm';
    m.innerHTML = '<div class="rkm-box">' + html + '</div>';
    m.onclick = e => { if (e.target === m) m.remove(); };
    document.body.appendChild(m);
    return m;
  }

  function tutorial() {
    const i = clamp(state.tut, 0, LESSONS.length - 1);
    const L = LESSONS[i];
    const m = modal('<h3>' + E(L.t) + '</h3><div class="rkm-step">Lesson ' + (i + 1) + ' of ' + LESSONS.length + '</div>'
      + '<p>' + L.d + '</p>'
      + (L.c ? '<pre>' + E(L.c) + '</pre>' : '')
      + '<div class="rkm-row"><button data-t="back"' + (i ? '' : ' disabled') + '>Back</button>'
      + '<span style="display:flex;gap:6px">' + (L.c ? '<button data-t="ins">Put this in my code</button>' : '')
      + '<button class="pri" data-t="next">' + (i < LESSONS.length - 1 ? 'Next lesson' : 'Done') + '</button></span></div>');
    m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      const t = b.dataset.t;
      if (t === 'ins') {
        const ta = document.getElementById('rke-src');
        if (ta) {
          ta.value = (ta.value.trim() ? ta.value.replace(/\s*$/, '\n\n') : '') + L.c + '\n';
          if (ge()) ge().src = ta.value;
          const ev = new Event('input');
          ta.dispatchEvent(ev);
        }
        m.remove();
        say('Added to the editor. Press Compile when you are ready.');
        return;
      }
      state.tut = t === 'next' ? (i + 1) % LESSONS.length : Math.max(0, i - 1);
      if (i === LESSONS.length - 1 && t === 'next') { m.remove(); return; }
      tutorial();
    });
  }

  function reference() {
    const rows = [];
    Object.keys(TRIG).forEach(k => { if (TRIG[k].h) rows.push(['on ' + k + ' ' + (TRIG[k].args || ''), TRIG[k].doc]); });
    Object.keys(CMD).forEach(k => {
      const e = CMD[k];
      if (!e || !e.map || !e.out) return;
      if (CMD[k] !== e) return;
      rows.push([k + ' ' + (e.args || ''), e.doc || '']);
    });
    const seen = {};
    const uniq = rows.filter(r => { if (seen[r[0]]) return false; seen[r[0]] = 1; return true; });
    const m = modal('<h3>RukoScript reference</h3><div class="rkm-step">' + uniq.length + ' words</div>'
      + '<input id="rkm-q" placeholder="Search, like: coin, colour, timer…">'
      + '<div class="rkm-ref"><table id="rkm-t"><tbody>'
      + uniq.map(r => '<tr><td>' + E(r[0]) + '</td><td>' + E(r[1]) + '</td></tr>').join('')
      + '</tbody></table></div>'
      + '<div class="rkm-row"><span class="mut" style="font-size:12px;color:#9b9ea7">Values: score, coins, hp, kills, deaths, time, y, px, pz, A to F</span><button class="pri" data-t="close">Close</button></div>');
    const q = m.querySelector('#rkm-q');
    const tb = m.querySelector('#rkm-t tbody');
    q.oninput = () => {
      const s = q.value.trim().toLowerCase();
      tb.innerHTML = uniq.filter(r => !s || (r[0] + ' ' + r[1]).toLowerCase().includes(s))
        .map(r => '<tr><td>' + E(r[0]) + '</td><td>' + E(r[1]) + '</td></tr>').join('')
        || '<tr><td></td><td>Nothing matches that.</td></tr>';
    };
    m.querySelector('[data-t="close"]').onclick = () => m.remove();
  }

  /* ---------- 5e. installing ---------- */
  function install() {
    style();
    installRuntime();
    try {
      const prev = window.codeRender;
      const mine = function () {
        try {
          if (ge() && document.getElementById('cd')) return render();
        } catch (e) { console.warn('RukoScript:', e); }
        return typeof prev === 'function' ? prev.apply(this, arguments) : undefined;
      };
      mine.__rkScript = 1;
      window.codeRender = mine;
      return true;
    } catch (e) {
      console.warn('RukoScript: could not take over the Code tab', e);
      return false;
    }
  }

  try { install(); } catch (e) {}
  if (document.readyState !== 'complete') addEventListener('load', install);
  [200, 700, 1600, 3000].forEach(t => setTimeout(install, t));
  try {
    const app = document.getElementById('app');
    if (app && typeof MutationObserver !== 'undefined') {
      new MutationObserver(() => { if (!window.codeRender || !window.codeRender.__rkScript) install(); })
        .observe(app, { childList: true, subtree: true });
    }
  } catch (e) {}
  // The runtime hook can lose a race with the block files, so it is retried for a moment.
  [140, 500, 1200, 2500, 5000].forEach(t => setTimeout(installRuntime, t));

  window.RKSCRIPT_API = { parse, toCode, audit, render, compile, tutorial, reference, EXAMPLE, CMD, TRIG };
})();
