/* ---------- v46: what a game can show and play ---------- */
/* Everything here comes from the game document itself, so it is the same for every player on every
   device: custom on-screen UI (labels, bars, panels, buttons), effects (sparks, confetti, smoke,
   glow), speakers that play sounds uploaded with the game, the leaderstats strip, and the
   leaderboard of who is in the server right now.

   It is driven by RKGAME (the game object handed over by play()) and RKPLAY.dbg.state() (the live
   player state), and it does nothing at all outside a game. */
(function () {
  if (window.RKGK) return;
  window.RKGK = { ready: 1 };

  const el = id => document.getElementById(id);
  const game = () => window.RKGAME || null;
  const live = () => {
    try {
      return window.RKPLAY && window.RKPLAY.dbg ? window.RKPLAY.dbg.state() : null;
    } catch (e) {
      return null;
    }
  };
  const roster = () => (Array.isArray(window.RKROSTER) ? window.RKROSTER : []);

  let uid = '', startedAt = performance.now(), uiWrap = null, parts = [], sounds = new Map(), soundAt = new Map();
  let lbOpen = false, lbEl = null, statsEl = null, chipEl = null;

  /* ---------- styles ---------- */
  function style() {
    if (el('rk-kit-style')) return;
    const st = document.createElement('style');
    st.id = 'rk-kit-style';
    st.textContent = [
      '#rk-ui{position:absolute;inset:0;pointer-events:none;z-index:22;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}',
      '.rk-u{position:absolute;pointer-events:none;box-sizing:border-box}',
      '.rk-u-panel{background:#0b0e18b8;border:1px solid #ffffff26;border-radius:12px;backdrop-filter:blur(6px)}',
      '.rk-u-label{font-weight:800;line-height:1.25;text-shadow:0 2px 6px #000a;white-space:pre-wrap}',
      '.rk-u-bar{background:#00000073;border:1px solid #ffffff2e;border-radius:9px;overflow:hidden}',
      '.rk-u-bar i{display:block;height:100%;background:#35c4a0;transition:width .18s}',
      '.rk-u-bar span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;text-shadow:0 1px 3px #000}',
      '.rk-u-button{pointer-events:auto;cursor:pointer;background:#2f80ede0;color:#fff;border:1px solid #ffffff33;border-radius:11px;font-weight:800;font-size:13px;padding:0 10px;text-align:center}',
      '.rk-u-button:active{transform:scale(.97)}',
      '#rk-lb{position:absolute;right:10px;top:calc(64px + env(safe-area-inset-top,0px));z-index:24;width:228px;max-width:62vw;background:#0b0e18d9;border:1px solid #ffffff26;border-radius:14px;padding:9px 10px;color:#eef0ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;backdrop-filter:blur(8px);display:none}',
      '#rk-lb.on{display:block}',
      '#rk-lb .rk-lbh{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}',
      '#rk-lb b{font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#9aa0ad}',
      '#rk-lb .rk-lbn{font-weight:800;color:#7ef0c4}',
      '#rk-lb ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;max-height:38vh;overflow:auto}',
      '#rk-lb li{display:flex;align-items:center;gap:7px;padding:4px 6px;border-radius:8px;background:#ffffff0f}',
      '#rk-lb li.me{background:#2f80ed3d;outline:1px solid #2f80ed66}',
      '#rk-lb .r{width:14px;color:#9aa0ad;font-weight:800}',
      '#rk-lb .nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '#rk-lb .sc{color:#ffd23f;font-weight:800}',
      '#rk-stats{position:absolute;left:10px;top:calc(96px + env(safe-area-inset-top,0px));z-index:24;display:flex;flex-direction:column;gap:4px;font-family:system-ui,sans-serif;pointer-events:none}',
      '#rk-stats div{display:flex;gap:7px;align-items:center;background:#0b0e18c4;border:1px solid #ffffff21;border-radius:9px;padding:4px 9px;color:#eef0ff;font-size:12px;font-weight:700}',
      '#rk-stats span{font-size:13px}',
      '#rk-stats b{color:#ffd23f}',
      '#rk-lbchip{position:absolute;right:10px;top:calc(64px + env(safe-area-inset-top,0px));z-index:25;pointer-events:auto;background:#0b0e18c4;border:1px solid #ffffff2b;border-radius:11px;color:#eef0ff;font-family:system-ui,sans-serif;font-size:12px;font-weight:800;padding:5px 9px;display:none}',
      '#rk-lb.on + #rk-lbchip{display:none!important}',
      '#rk-lbchip.on{display:block}',
      '@media(max-width:520px){#rk-lb{width:190px;font-size:11px}#rk-stats div{font-size:11px;padding:3px 7px}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ---------- sounds that are part of the game ---------- */
  function soundFor(i) {
    const g = game();
    const s = g && Array.isArray(g.sounds) ? g.sounds[i] : null;
    if (!s || !s.d) return null;
    if (!sounds.has(s.d)) {
      const a = new Audio(s.d);
      a.preload = 'auto';
      a.volume = Math.max(0, Math.min(1, s.v == null ? 1 : s.v));
      sounds.set(s.d, a);
    }
    return sounds.get(s.d);
  }
  function play(i, vol) {
    const a = soundFor(i);
    if (!a) return false;
    try {
      const c = a.cloneNode();
      c.volume = Math.max(0, Math.min(1, vol == null ? a.volume : vol));
      c.play().catch(() => {});
    } catch (e) {
      try { a.currentTime = 0; a.play().catch(() => {}); } catch (e2) {}
    }
    return true;
  }

  /* ---------- custom UI ---------- */
  function clampPct(v, d) {
    const n = +v;
    return isFinite(n) ? Math.max(-20, Math.min(120, n)) : d;
  }

  function statOf(k) {
    const st = live() || {};
    const me = roster().find(p => p.isMe) || {};
    if (k === 'coins') return st.got | 0;
    if (k === 'score') return (st.SV && st.SV.score) | 0;
    if (k === 'kills') return me.k | 0;
    if (k === 'time') return Math.max(0, ((performance.now() - startedAt) / 1000) | 0);
    if (k === 'hp') return st.hp | 0;
    return 0;
  }

  function buildUI() {
    const g = game();
    if (!g) return;
    if (uiWrap) uiWrap.remove();
    uiWrap = document.createElement('div');
    uiWrap.id = 'rk-ui';
    const list = (g.objs || []).filter(o => o.k === 'u');
    for (const o of list) {
      const d = document.createElement('div');
      d.className = 'rk-u rk-u-' + (o.ty || 'label');
      d.style.left = clampPct(o.x, 5) + '%';
      d.style.top = clampPct(o.y, 5) + '%';
      if (o.ty === 'panel') {
        d.style.width = clampPct(o.sx, 30) + '%';
        d.style.height = clampPct(o.sy, 12) + '%';
        d.style.background = o.c || '';
      } else if (o.ty === 'bar') {
        d.style.width = clampPct(o.sx, 24) + '%';
        d.style.height = Math.max(6, Math.min(30, +o.sy || 12)) + 'px';
        d.innerHTML = '<i style="width:' + Math.max(0, Math.min(100, statOf(o.st) % 101)) + '%"></i><span></span>';
      } else if (o.ty === 'button') {
        d.style.width = clampPct(o.sx, 18) + '%';
        d.style.height = Math.max(28, Math.min(64, +o.sy || 36)) + 'px';
        d.style.display = 'flex';
        d.style.alignItems = 'center';
        d.style.justifyContent = 'center';
        d.textContent = o.tx || 'Players';
        d.onclick = () => { lbOpen = !lbOpen; drawLb(); };
      } else {
        d.textContent = o.tx || 'Text';
        d.style.color = o.c || '#fff';
        d.style.fontSize = Math.max(9, Math.min(48, +o.s || 16)) + 'px';
      }
      uiWrap.appendChild(d);
    }
    const host = el('game');
    if (host) host.appendChild(uiWrap);

    if (statsEl) statsEl.remove();
    statsEl = null;
    const stats = (g.stats || []).filter(k => ['coins', 'score', 'kills', 'time', 'hp'].includes(k));
    if (stats.length) {
      statsEl = document.createElement('div');
      statsEl.id = 'rk-stats';
      host.appendChild(statsEl);
    }

    if (!lbEl) {
      lbEl = document.createElement('div');
      lbEl.id = 'rk-lb';
      host.appendChild(lbEl);
      chipEl = document.createElement('button');
      chipEl.id = 'rk-lbchip';
      chipEl.onclick = () => { lbOpen = !lbOpen; drawLb(); };
      host.appendChild(chipEl);
    }
    drawLb();
  }

  function drawLb() {
    if (!lbEl) return;
    lbEl.classList.toggle('on', lbOpen);
    if (chipEl) chipEl.classList.toggle('on', !lbOpen);
    const all = roster().filter(p => !p.isMe).concat(roster().filter(p => p.isMe));
    const people = roster();
    const n = people.length || 1;
    if (chipEl) chipEl.textContent = '👥 ' + n;
    const rows = people
      .slice()
      .sort((a, b) => (b.k | 0) - (a.k | 0) || String(a.name || '').localeCompare(String(b.name || '')))
      .map((p, i) => '<li class="' + (p.isMe ? 'me' : '') + '"><span class="r">' + (i + 1) + '</span><span class="nm">' + esc(String(p.name || 'Player')) + '</span>' + (p.k != null ? '<span class="sc">' + (p.k | 0) + ' KO</span>' : '') + '</li>')
      .join('');
    const st = live() || {};
    const me = people.find(p => p.isMe);
    lbEl.innerHTML = '<div class="rk-lbh"><b>In this game</b><span class="rk-lbn">' + n + '</span></div>'
      + '<ol>' + (rows || '<li><span class="nm">Just you</span></li>') + '</ol>'
      + '<div style="margin-top:6px;color:#9aa0ad;font-size:11px">Coins <b style="color:#ffd23f">' + (st.got | 0) + '</b>' + (me ? ' · KO <b style="color:#ffd23f">' + (me.k | 0) + '</b>' : '') + '</div>';
  }

  /* ---------- effects ---------- */
  function fxTint(o) {
    return o.c || ({ spark: '#ffd23f', confetti: '#ff6fb5', smoke: '#c7cbd6', glow: '#5bd6ff' })[o.fx || 'spark'];
  }

  function startFx() {
    parts = [];
    const g = game();
    const T = window.THREE;
    const S = window.RKGSCENE || (window.RKPLAY && window.RKPLAY.scene) || null;
    if (!g || !T || !S) return;
    for (const o of (g.objs || [])) {
      if (o.k !== 'x') continue;
      const fxo = { o, n: 0, rate: Math.max(0.05, +o.rate || 0.25) };
      for (let i = 0; i < 18; i++) {
        const geo = new T.BoxGeometry(0.14, 0.14, 0.14);
        const mat = new T.MeshBasicMaterial({ color: fxTint(o), transparent: true, opacity: 0 });
        const m = new T.Mesh(geo, mat);
        m.visible = false;
        S.add(m);
        fxo['p' + i] = m;
      }
      parts.push(fxo);
    }
  }

  function tickFx(dt) {
    const T = window.THREE;
    if (!T) return;
    for (const e of parts) {
      const o = e.o;
      e.n -= dt;
      const spread = Math.max(0.5, +o.spread || 2.5);
      const life = Math.max(0.3, +o.life || 1.2);
      const size = Math.max(1, +o.size || 1);
      for (let i = 0; i < 18; i++) {
        const m = e['p' + i];
        if (!m.visible && e.n <= 0) {
          e.n = e.rate;
          m.visible = true;
          m.userData.t = 0;
          m.userData.vx = (Math.random() - 0.5) * spread;
          m.userData.vy = (o.fx === 'smoke' ? 0.6 : 1.2) + Math.random() * spread * 0.7;
          m.userData.vz = (Math.random() - 0.5) * spread;
          m.position.set(+o.x || 0, (+o.y || 0) + 0.6, +o.z || 0);
          m.scale.setScalar(size);
        }
        if (m.visible) {
          m.userData.t += dt;
          const t = m.userData.t;
          if (t > life) {
            m.visible = false;
            continue;
          }
          m.position.x += m.userData.vx * dt;
          m.position.y += (m.userData.vy - (o.fx === 'smoke' ? 1.5 : 4.2) * t) * dt;
          m.position.z += m.userData.vz * dt;
          m.material.opacity = Math.max(0, 1 - t / life);
          if (o.fx === 'confetti') m.rotation.z += dt * 4;
          if (o.fx === 'glow') m.scale.setScalar(size * (1 + t));
        }
      }
    }
  }

  /* ---------- speakers ---------- */
  function tickSounds() {
    const g = game();
    const st = live();
    if (!g || !st || !st.p) return;
    const now = performance.now();
    for (const o of (g.objs || [])) {
      if (o.k !== 'n') continue;
      const key = o.u || (o.x + ':' + o.z);
      const last = soundAt.get(key) || 0;
      if (now - last < Math.max(200, (+o.cd || 3) * 1000)) continue;
      const r = Math.max(1.5, +o.r || 5);
      const d = Math.hypot(st.p.x - (+o.x || 0), st.p.z - (+o.z || 0));
      if (d <= r) {
        if (play(+o.si | 0, o.v)) soundAt.set(key, now);
      }
    }
  }

  /* ---------- stats ---------- */
  function drawStats() {
    if (!statsEl) return;
    const g = game();
    const keys = (g.stats || []).filter(k => ['coins', 'score', 'kills', 'time', 'hp'].includes(k));
    if (!keys.length) return;
    const icon = { coins: '🪙', score: '🏆', kills: '⚔️', time: '⏱', hp: '❤️' };
    const name = { coins: 'Coins', score: 'Score', kills: 'KOs', time: 'Time', hp: 'HP' };
    const st = live() || {};
    let t = Math.max(0, ((performance.now() - startedAt) / 1000) | 0);
    statsEl.innerHTML = keys.map(k => {
      const v = k === 'time' ? t + 's' : statOf(k);
      return '<div><span>' + (icon[k] || '•') + '</span>' + name[k] + ' <b>' + v + '</b></div>';
    }).join('');
  }

  /* ---------- loop ---------- */
  let last = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    const host = el('game');
    const on = host && host.style.display && host.style.display !== 'none';
    if (!on) {
      if (uiWrap) { uiWrap.remove(); uiWrap = null; }
      return;
    }
    const g = game();
    if (!g) return;
    const id = String(g.id || '') + '|' + String((g.objs || []).length);
    if (id !== uid) {
      uid = id;
      startedAt = performance.now();
      style();
      buildUI();
      startFx();
    }
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    tickFx(dt);
    tickSounds();
    drawStats();
    if (lbOpen) drawLb();
  }

  style();
  requestAnimationFrame(frame);

  window.RKGK.playSound = play;
  window.RKGK.rebuild = () => { uid = ''; };
})();
