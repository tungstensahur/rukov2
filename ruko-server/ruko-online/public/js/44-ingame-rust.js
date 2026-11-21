/* ---------- v44: Ruko's in-game movement, in Rust ---------- */
/* The player's physics is Rust (ingame-rust/src/lib.rs), compiled to WebAssembly and embedded
   below. Every frame the game loop hands over position, velocity, jump state and the level's
   platforms; Rust returns where the player ended up: pushed out of walls, standing on a platform,
   stepping up a ledge, in the air after a jump, through lava or off a bounce pad.

   The same maths is written out in JavaScript as rkStepJS and used until the module has loaded, or
   if WebAssembly is unavailable, so the game plays identically either way.

   The module is no_std and carries no allocator or panic formatting, so it is under two
   kilobytes — small enough to sit inline in this file with no second download. */
(function () {
  if (window.RKG) return;

  const KIND = { lava: 108, bounce: 98 };

  // Same order, same constants as the Rust: walk into a wall, gravity, land, jump.
  function rkStepJS(p, vx, vz, dt, g, gr, jumping, jbuf, coy, jp, jprev, pl) {
    let x = p.x, y = p.y, z = p.z, vy = p.vy, on = 0, ride = -1, flags = 0, bounced = false;
    const grav = g.grav || 22, jmp = g.jmp || 9, grounded = !!gr, jmpg0 = !!jumping;

    for (let i = 0; i < pl.length; i++) {
      const q = pl[i];
      if (q.off) continue;
      const th = q.th || 0.5, hx = q.sx / 2 + 0.35, hz = q.sz / 2 + 0.35;
      if (y < q.y - 0.12 && y + 2.6 > q.y - th && Math.abs(x - q.x) < hx && Math.abs(z - q.z) < hz) {
        if (q.t === 'lava') { flags |= 1; continue; }
        if (grounded && q.y - y <= 0.55) { y = q.y; vy = 0; flags |= 4; continue; }
        const ox = hx - Math.abs(x - q.x), oz = hz - Math.abs(z - q.z);
        if (ox < oz) { x = q.x + Math.sign(x - q.x || 1) * hx; vx = 0; }
        else { z = q.z + Math.sign(z - q.z || 1) * hz; vz = 0; }
      }
    }

    const before = y;
    vy = Math.max(-55, vy - grav * dt);
    y += vy * dt;
    for (let i = 0; i < pl.length; i++) {
      const q = pl[i];
      if (q.off || vy > 0 || before < q.y - 0.1 || y > q.y) continue;
      if (Math.abs(x - q.x) > q.sx / 2 + 0.3 || Math.abs(z - q.z) > q.sz / 2 + 0.3) continue;
      y = q.y; vy = 0; on = 1; ride = i;
      if (q.t === 'lava') { on = 0; flags |= 8; }
      else if (q.t === 'bounce') { vy = 17; on = 0; bounced = true; }
    }

    let ong = on !== 0, jmpg = jmpg0, c = coy;
    if (ong) { jmpg = false; c = 0; } else c += dt;
    if (bounced) jmpg = true;
    let buf = jp && !jprev ? 0.12 : Math.max(0, jbuf - dt);
    if ((jp || buf > 0) && !jmpg && (ong || c < 0.1) && vy <= 0.5) {
      vy = jmp; jmpg = true; buf = 0; ong = false; on = 0; c = 9;
    } else if (jmpg && !jp && vy > 3.5) vy = 3.5;
    if (bounced) flags |= 2;

    return { x, y, z, vx, vz, vy, on, ride, flags, jbuf: buf, jumping: jmpg ? 1 : 0, coy: c };
  }

  window.RKG = { wasm: false, ready: false, step: rkStepJS };

  const WASM_B64 =
  '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';

  function adopt(w) {
    const mem = w.memory;
    const plats = w.rk_plat_ptr(), outAt = w.rk_out_ptr();
    window.RKG.wasm = true;
    window.RKG.ready = true;

    window.RKG.step = (p, vx, vz, dt, g, gr, jumping, jbuf, coy, jp, jprev, pl) => {
      const n = Math.min(pl.length, 400);
      const box = new Float64Array(mem.buffer, plats, n * 8);
      for (let i = 0; i < n; i++) {
        const q = pl[i];
        box[i * 8] = q.x || 0;
        box[i * 8 + 1] = q.y || 0;
        box[i * 8 + 2] = q.z || 0;
        box[i * 8 + 3] = q.sx || 0;
        box[i * 8 + 4] = q.sz || 0;
        box[i * 8 + 5] = q.th || 0.5;
        box[i * 8 + 6] = KIND[q.t] || 112;
        box[i * 8 + 7] = q.off ? 1 : 0;
      }
      w.rk_step(p.x, p.y, p.z, vx, vz, p.vy || 0, dt, g.grav || 22, g.jmp || 9,
        gr ? 1 : 0, jumping ? 1 : 0, jbuf || 0, coy || 0, jp ? 1 : 0, jprev ? 1 : 0, n);
      const o = new Float64Array(mem.buffer, outAt, 16);
      return { x: o[0], y: o[1], z: o[2], vx: o[3], vz: o[4], vy: o[5], on: o[6], ride: o[7], flags: o[8], jbuf: o[9], jumping: o[10], coy: o[11] };
    };
  }

  try {
    const bin = atob(WASM_B64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    WebAssembly.instantiate(bytes, {})
      .then(mod => adopt(mod.instance.exports))
      .catch(e => console.warn('Ruko: Rust movement core not loaded, using the JS fallback.', e));
  } catch (e) {
    console.warn('Ruko: WebAssembly unavailable, using the JS fallback.', e);
  }
})();
