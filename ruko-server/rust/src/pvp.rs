// How each PvP weapon behaves. Every shot is settled here, so the rules live in one place,
// exactly like pvpweapons.js did on the Node server.
use crate::state::{Box3, Pv};
use crate::util::*;
use rand::Rng;
use serde_json::{json, Value};

pub struct Shot {
    pub dmg: Vec<(String, f64)>,
    pub fx: Vec<Value>,
    pub hits: i64,
    pub heads: i64,
}

struct Gun {
    near: f64,
    far: f64,
    min: f64,
    hit: f64,
    pierce: usize,
    head: f64,
}

fn gun(m: &str) -> Gun {
    match m {
        "smg" => Gun { near: 10.0, far: 52.0, min: 0.45, hit: 0.85, pierce: 0, head: 1.5 },
        "rifle" => Gun { near: 50.0, far: 150.0, min: 0.72, hit: 0.9, pierce: 0, head: 1.7 },
        "shotgun" => Gun { near: 8.0, far: 30.0, min: 0.3, hit: 1.15, pierce: 0, head: 1.3 },
        "sniper" => Gun { near: 400.0, far: 400.0, min: 1.0, hit: 0.75, pierce: 1, head: 2.4 },
        _ => Gun { near: 26.0, far: 80.0, min: 0.6, hit: 0.85, pierce: 0, head: 1.8 },
    }
}

fn melee(m: &str) -> (f64, f64) {
    // (arc, reach multiplier)
    match m {
        "knife" => (0.55, 0.75),
        "hammer" => (0.35, 1.1),
        _ => (0.2, 1.0),
    }
}

fn falloff(r: &Gun, d: f64) -> f64 {
    if !(r.far > r.near) || d <= r.near {
        return 1.0;
    }
    (1.0 - (d - r.near) / (r.far - r.near) * (1.0 - r.min)).max(r.min)
}

/// The obstacle hit test from server.js: where a shot enters a platform's box, if at all.
pub fn ray_box3(ox: f64, oy: f64, oz: f64, dx: f64, dz: f64, sl: f64, b: &Box3) -> Option<f64> {
    let mut t0: f64 = 0.0;
    let mut t1: f64 = 1e9;
    for (o, d, a, z) in [(ox, dx, b.x0, b.x1), (oz, dz, b.z0, b.z1)] {
        if d.abs() < 1e-9 {
            if o < a || o > z {
                return None;
            }
        } else {
            let mut s = (a - o) / d;
            let mut e = (z - o) / d;
            if s > e {
                std::mem::swap(&mut s, &mut e);
            }
            t0 = t0.max(s);
            t1 = t1.min(e);
            if t0 > t1 {
                return None;
            }
        }
    }
    if t0 <= 0.0 {
        return None;
    }
    let h0 = oy + sl * t0;
    let h1 = oy + sl * t1;
    let lo = h0.min(h1);
    let hi = h0.max(h1);
    if hi < b.y0 || lo > b.y1 {
        return None;
    }
    Some(t0)
}

pub fn shoot(
    ps: &Value,
    wd: &Value,
    dx: f64,
    dz: f64,
    sl: f64,
    pv: &Pv,
    targets: &[(String, Value)],
    ray: impl Fn(f64, f64, f64, f64, f64, f64, &Box3) -> Option<f64>,
) -> Shot {
    let mut dmg: Vec<(String, f64)> = Vec::new();
    let mut fx: Vec<Value> = Vec::new();
    let mut hits = 0;
    let mut heads = 0;
    let oy = f(ps, "y") + 1.6;
    let mut add = |k: &str, d: f64, hits: &mut i64, dmg: &mut Vec<(String, f64)>| {
        if let Some(slot) = dmg.iter_mut().find(|(p, _)| p == k) {
            slot.1 += d;
        } else {
            dmg.push((k.to_string(), d));
        }
        *hits += 1;
    };

    if s(wd, "t") == "melee" {
        let (arc, reach_m) = melee(&s(wd, "m"));
        let reach = (f(wd, "rng") * reach_m).max(1.0);
        for (k, v) in targets {
            let vx = f(v, "x") - f(ps, "x");
            let vz = f(v, "z") - f(ps, "z");
            let d = (vx * vx + vz * vz).sqrt();
            if d > reach || (f(v, "y") - f(ps, "y")).abs() > 3.0 {
                continue;
            }
            if !(d < 0.4 || (vx * dx + vz * dz) / d > arc) {
                continue;
            }
            let d0 = (f(wd, "dmg") * 1.0).round().max(1.0);
            add(k, d0, &mut hits, &mut dmg);
        }
        return Shot { dmg, fx, hits, heads };
    }

    let r = gun(&s(wd, "m"));
    let pellets = (f(wd, "pel") as i64).clamp(1, 8);
    let spread = f(wd, "spr");
    let mut rng = rand::thread_rng();
    for _ in 0..pellets {
        let mut ax = dx;
        let mut az = dz;
        let mut s2 = sl;
        if spread != 0.0 {
            s2 += (rng.gen::<f64>() - 0.5) * spread * std::f64::consts::PI / 180.0;
            let a = (rng.gen::<f64>() - 0.5) * spread * std::f64::consts::PI / 180.0;
            ax = dx * a.cos() - dz * a.sin();
            az = dx * a.sin() + dz * a.cos();
        }
        let mut bt = f(wd, "rng");
        if bt <= 0.0 {
            bt = 60.0;
        }
        for o in &pv.occ {
            if let Some(t) = ray(f(ps, "x"), oy, f(ps, "z"), ax, az, s2, o) {
                if t < bt {
                    bt = t;
                }
            }
        }
        let mut found: Vec<(String, f64, bool)> = Vec::new();
        for (k, v) in targets {
            let vx = f(v, "x") - f(ps, "x");
            let vz = f(v, "z") - f(ps, "z");
            let t = vx * ax + vz * az;
            if t <= 0.0 || t > bt {
                continue;
            }
            if (vx * az - vz * ax).abs() > r.hit {
                continue;
            }
            let hy = oy + s2 * t;
            if hy < f(v, "y") - 0.3 || hy > f(v, "y") + 3.5 {
                continue;
            }
            found.push((k.clone(), t, hy >= f(v, "y") + 2.2));
        }
        found.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
        let take = found.iter().take(1 + r.pierce);
        let mut last_t = None;
        for (k, t, head) in take {
            let mult = if *head { r.head } else { 1.0 };
            let base = if f(wd, "dmg") != 0.0 { f(wd, "dmg") } else { 10.0 };
            let d = (base * falloff(&r, *t) * mult).round().max(1.0);
            add(k, d, &mut hits, &mut dmg);
            if *head {
                heads += 1;
            }
            last_t = Some(*t);
        }
        if let Some(t) = last_t {
            bt = t;
        }
        let round1 = |x: f64| (x * 10.0).round() / 10.0;
        fx.push(json!({
            "f": [round1(f(ps, "x")), round1(oy), round1(f(ps, "z"))],
            "t": [round1(f(ps, "x") + ax * bt), round1(oy + s2 * bt), round1(f(ps, "z") + az * bt)]
        }));
    }
    Shot { dmg, fx, hits, heads }
}
