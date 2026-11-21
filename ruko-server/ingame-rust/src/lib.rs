// Ruko's in-game movement, in Rust, compiled to WebAssembly.
//
// This is the part players feel: walking into a wall, landing on a platform, stepping up a small
// ledge, jumping, hitting lava, bouncing. Every frame the page hands over the player's position,
// velocity, jump state and the level's platforms; this returns where the player ended up.
//
// It is a faithful port of the physics block in the game loop (00-boot-and-core.js): same order of
// operations, same constants, same edge cases. Game rules that are not movement — respawning, the
// win message, checkpoints, score, crumbling platforms — stay on the page, driven by the flags and
// the landed-platform index this returns.
//
// Built with `cargo build --release --target wasm32-unknown-unknown` (see build.sh). No allocator,
// no wasm-bindgen: two fixed buffers and plain f64 calls.

const MAX_PLATS: usize = 400;
const STRIDE: usize = 8;

static mut PLATS: [f64; MAX_PLATS * STRIDE] = [0.0; MAX_PLATS * STRIDE];
static mut OUT: [f64; 16] = [0.0; 16];

// Platform type codes, the first letter of each type name in the editor.
const T_LAVA: f64 = 108.0; // l
const T_BOUNCE: f64 = 98.0; // b

/// Where JavaScript writes the platform list: x, y, z, sx, sz, thickness, type, off.
#[no_mangle]
pub extern "C" fn rk_plat_ptr() -> *mut f64 {
    unsafe { core::ptr::addr_of_mut!(PLATS) as *mut f64 }
}

/// Where JavaScript reads the result back from.
#[no_mangle]
pub extern "C" fn rk_out_ptr() -> *mut f64 {
    unsafe { core::ptr::addr_of_mut!(OUT) as *mut f64 }
}

#[inline]
fn sign_or(v: f64, fallback: f64) -> f64 {
    if v > 0.0 {
        1.0
    } else if v < 0.0 {
        -1.0
    } else {
        fallback
    }
}

/// One frame of movement.
///
/// `on_ground` is the previous frame's grounded state (the loop's `gr`), `jumping` its jump lock,
/// `jbuf` the jump buffer, `coy` the coyote timer, `want_jump` whether jump is held this frame and
/// `was_jump` whether it was held last frame (to detect the press).
///
/// Returns the populated result through `rk_out_ptr`:
///   0 x, 1 y, 2 z, 3 vx, 4 vz, 5 vy,
///   6 grounded, 7 landed platform index (-1 none),
///   8 flags (1 hit lava from the side, 2 bounced, 4 stood on a small ledge, 8 landed in lava),
///   9 jump buffer, 10 jumping, 11 coyote timer, 12 want_jump (to pass back as was_jump).
#[no_mangle]
pub extern "C" fn rk_step(
    px: f64,
    py: f64,
    pz: f64,
    vx0: f64,
    vz0: f64,
    vy0: f64,
    dt: f64,
    grav: f64,
    jmp: f64,
    on_ground: f64,
    jumping0: f64,
    jbuf0: f64,
    coy0: f64,
    want_jump: f64,
    was_jump: f64,
    plat_n: f64,
) {
    let mut x = px;
    let mut y = py;
    let mut z = pz;
    let mut vx = vx0;
    let mut vz = vz0;
    let mut vy = vy0;
    let gravity = if grav > 0.0 { grav } else { 22.0 };
    let jump_power = if jmp > 0.0 { jmp } else { 9.0 };
    let grounded = on_ground > 0.5;

    let n = if plat_n < 0.0 {
        0
    } else if (plat_n as usize) > MAX_PLATS {
        MAX_PLATS
    } else {
        plat_n as usize
    };

    let plats = unsafe { core::slice::from_raw_parts(rk_plat_ptr(), n * STRIDE) };

    let mut flags: f64 = 0.0;
    let mut bounced = false;

    // 1. Push out of anything the player walked into, with a step-up for small ledges.
    for i in 0..n {
        let p = &plats[i * STRIDE..i * STRIDE + STRIDE];
        let (ox, oy, oz, sx, sz, th, kind, off) = (p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);
        if off != 0.0 {
            continue;
        }
        let thick = if th > 0.0 { th } else { 0.5 };
        let hx = sx / 2.0 + 0.35;
        let hz = sz / 2.0 + 0.35;
        if y < oy - 0.12 && y + 2.6 > oy - thick && (x - ox).abs() < hx && (z - oz).abs() < hz {
            if kind == T_LAVA {
                flags += 1.0;
                continue;
            }
            if grounded && oy - y <= 0.55 {
                y = oy;
                vy = 0.0;
                flags += 4.0;
                continue;
            }
            let dx = hx - (x - ox).abs();
            let dz = hz - (z - oz).abs();
            if dx < dz {
                x = ox + sign_or(x - ox, 1.0) * hx;
                vx = 0.0;
            } else {
                z = oz + sign_or(z - oz, 1.0) * hz;
                vz = 0.0;
            }
        }
    }

    // 2. Gravity and landing.
    let before = y;
    vy = (-55.0f64).max(vy - gravity * dt);
    y += vy * dt;
    let mut on = 0.0;
    let mut ride: f64 = -1.0;

    for i in 0..n {
        let p = &plats[i * STRIDE..i * STRIDE + STRIDE];
        let (ox, oy, oz, sx, sz, _th, kind, off) = (p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);
        if off != 0.0 || vy > 0.0 || before < oy - 0.1 || y > oy {
            continue;
        }
        if (x - ox).abs() > sx / 2.0 + 0.3 || (z - oz).abs() > sz / 2.0 + 0.3 {
            continue;
        }
        y = oy;
        vy = 0.0;
        on = 1.0;
        ride = i as f64;
        if kind == T_LAVA {
            on = 0.0;
            flags += 8.0;
        } else if kind == T_BOUNCE {
            vy = 17.0;
            on = 0.0;
            bounced = true;
        }
    }

    // 3. Grounded bookkeeping and jumping.
    let mut ong = on != 0.0;
    let mut jumping = jumping0 > 0.5;
    let mut coy = coy0;
    if ong {
        jumping = false;
        coy = 0.0;
    } else {
        coy += dt;
    }
    if bounced {
        jumping = true;
    }
    let mut jbuf = if want_jump > 0.5 && was_jump <= 0.5 {
        0.12
    } else {
        (jbuf0 - dt).max(0.0)
    };
    if (want_jump > 0.5 || jbuf > 0.0) && !jumping && (ong || coy < 0.1) && vy <= 0.5 {
        vy = jump_power;
        jumping = true;
        jbuf = 0.0;
        ong = false;
        on = 0.0;
        coy = 9.0;
    } else if jumping && want_jump <= 0.5 && vy > 3.5 {
        vy = 3.5;
    }

    if bounced {
        flags += 2.0;
    }

    let out = unsafe { core::slice::from_raw_parts_mut(rk_out_ptr(), 16) };
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = vx;
    out[4] = vz;
    out[5] = vy;
    out[6] = on;
    out[7] = ride;
    out[8] = flags;
    out[9] = jbuf;
    out[10] = if jumping { 1.0 } else { 0.0 };
    out[11] = coy;
    out[12] = want_jump;
    out[13] = 0.0;
    out[14] = 0.0;
    out[15] = 0.0;
}
