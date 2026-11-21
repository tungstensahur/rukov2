//! Server authority over where players are.
//!
//! Clients send their position; this decides what the server is willing to believe. A position is
//! only accepted as far as a player could actually have travelled since their last accepted update:
//! walk speed from the game's own settings, a little slack for lag, capped upward movement so nobody
//! can fly, and the level's own bounds so nobody can leave the map. Anything beyond that is pulled
//! back to the edge of the envelope instead of being stored, and a client that keeps doing it is
//! frozen in place.
//!
//! Everything downstream (what other players see, where shots come from, who a shot can hit) reads
//! the stored presence, so a spoofed speed or a teleport never reaches another player.

use serde_json::Value;

use crate::util::{arr, f, s};

/// What the level allows: its walk speed, its floor, its horizontal bounds and its ceiling.
pub struct Limit {
    spd: f64,
    kill_y: f64,
    x0: f64,
    x1: f64,
    z0: f64,
    z1: f64,
    top: f64,
    spawns: Vec<(f64, f64, f64)>,
}

impl Limit {
    /// Whether a position is one the player could legitimately come back at: a spawn point.
    fn near_spawn(&self, x: f64, y: f64, z: f64, within: f64) -> bool {
        self.spawns.iter().any(|(sx, sy, sz)| {
            let dx = x - sx;
            let dz = z - sz;
            let dy = y - sy;
            dx * dx + dz * dz <= within * within && dy.abs() <= within + 2.0
        })
    }
}

impl Default for Limit {
    fn default() -> Limit {
        Limit::of(None)
    }
}

impl Limit {
    pub fn of(game: Option<&Value>) -> Limit {
        let spd = game
            .map(|g| f(g, "spd"))
            .filter(|v| v.is_finite() && *v > 0.0)
            .unwrap_or(7.0)
            .clamp(4.0, 14.0);
        let kill_y = game
            .map(|g| f(g, "killY"))
            .filter(|v| v.is_finite())
            .unwrap_or(-15.0);
        let mut lim = Limit {
            spd,
            kill_y,
            x0: f64::MAX,
            x1: f64::MIN,
            z0: f64::MAX,
            z1: f64::MIN,
            top: kill_y.max(0.0) + 120.0,
            spawns: Vec::new(),
        };
        if let Some(g) = game {
            for o in arr(g, "objs").iter() {
                if s(o, "k") == "s" {
                    let sp = (f(o, "x"), f(o, "y"), f(o, "z"));
                    if sp.0.is_finite() && sp.1.is_finite() && sp.2.is_finite() {
                        lim.spawns.push(sp);
                    }
                    continue;
                }
                if s(o, "k") != "p" {
                    continue;
                }
                let (x, z) = (f(o, "x"), f(o, "z"));
                let (sx, sz) = (f(o, "sx"), f(o, "sz"));
                if !x.is_finite() || !z.is_finite() || !sx.is_finite() || !sz.is_finite() {
                    continue;
                }
                lim.x0 = lim.x0.min(x - sx / 2.0 - 30.0);
                lim.x1 = lim.x1.max(x + sx / 2.0 + 30.0);
                lim.z0 = lim.z0.min(z - sz / 2.0 - 30.0);
                lim.z1 = lim.z1.max(z + sz / 2.0 + 30.0);
                lim.top = lim.top.max(f(o, "y") + 60.0);
            }
        }
        if lim.x0 > lim.x1 {
            lim.x0 = -200.0;
            lim.x1 = 200.0;
        }
        if lim.z0 > lim.z1 {
            lim.z0 = -200.0;
            lim.z1 = 200.0;
        }
        lim
    }
}

/// The position the server is willing to store, and whether the client stayed inside the envelope.
pub struct Snap {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub t: i64,
    pub clean: bool,
}

fn num(v: &Value, k: &str) -> f64 {
    match v.get(k) {
        Some(Value::Number(n)) => n.as_f64().unwrap_or(0.0),
        Some(Value::String(t)) => t.parse::<f64>().unwrap_or(0.0),
        _ => 0.0,
    }
}

fn fix(v: f64) -> f64 {
    if v.is_finite() {
        v
    } else {
        0.0
    }
}

/// Takes the position a client claims and returns the one the server accepts.
///
/// `prev` is the last accepted position and when it was accepted. With no previous position (a
/// fresh join) the claim is only bounded to the level.
pub fn step(prev: Option<(f64, f64, f64, i64)>, claim: &Value, lim: &Limit, now_ms: i64) -> Snap {
    let mut x = fix(num(claim, "x")).clamp(lim.x0, lim.x1);
    let mut y = fix(num(claim, "y")).clamp(lim.kill_y - 8.0, lim.top);
    let mut z = fix(num(claim, "z")).clamp(lim.z0, lim.z1);
    let mut clean = true;

    if let Some((lx, ly, lz, lt)) = prev {
        // Respawning is a legitimate teleport: falling out of the world, or coming back at a spawn
        // point (after a PvP death). Everything else has to be walked.
        let respawn = ly < lim.kill_y + 2.0 || lim.near_spawn(x, y, z, 5.0);
        if respawn {
            return Snap { x, y, z, t: now_ms, clean: true };
        }
        let mut dt = (now_ms - lt) as f64 / 1000.0;
        if !dt.is_finite() || dt <= 0.0 {
            dt = 1.0 / 120.0;
        }
        // A client that stops sending for a long time does not get a free teleport when it returns.
        dt = dt.min(0.5);

        // Horizontal: walk speed plus a little slack for lag and rounding.
        let dx = x - lx;
        let dz = z - lz;
        let dist = (dx * dx + dz * dz).sqrt();
        // The allowance is a rate, never a per-update lump: sending more often must not buy more
        // distance, which is what a speed hack would do.
        let max_h = (lim.spd * 1.05 + 2.0) * dt;
        if dist > max_h && dist > 0.0 {
            let k = max_h / dist;
            x = lx + dx * k;
            z = lz + dz * k;
            clean = false;
        }

        // Vertical: rising is limited to a jump's worth, falling to terminal velocity.
        let dy = y - ly;
        if dy > 0.0 {
            let up = 20.0 * dt;
            if dy > up {
                y = ly + up;
                clean = false;
            }
        } else {
            let down = 62.0 * dt;
            if -dy > down {
                y = ly - down;
                clean = false;
            }
        }
    }

    Snap {
        x,
        y,
        z,
        t: now_ms,
        clean,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn lim() -> Limit {
        Limit::of(Some(&json!({
            "spd": 8,
            "killY": -15,
            "objs": [{ "k": "p", "x": 0, "y": 0, "z": 0, "sx": 20, "sz": 20 }]
        })))
    }

    #[test]
    fn walking_is_accepted() {
        let s = step(Some((0.0, 1.0, 0.0, 0)), &json!({ "x": 0.8, "y": 1.0, "z": 0.0 }), &lim(), 100);
        assert!(s.clean);
        assert!((s.x - 0.8).abs() < 1e-9);
    }

    #[test]
    fn teleport_is_pulled_back() {
        // 100 units in 100 ms is far beyond any walk speed.
        let s = step(Some((0.0, 1.0, 0.0, 0)), &json!({ "x": 100.0, "y": 1.0, "z": 0.0 }), &lim(), 100);
        assert!(!s.clean);
        assert!(s.x < 3.0, "clamped to {}", s.x);
    }

    #[test]
    fn speed_hacking_does_not_gain_distance() {
        // Sending more often does not move further per second: the cap is per unit of time.
        let l = lim();
        let mut x = 0.0;
        let mut t = 0;
        for _ in 0..100 {
            // 100 updates in one second, each claiming 5 units forward (500 units/second).
            t += 10;
            let s = step(Some((x, 1.0, 0.0, t - 10)), &json!({ "x": x + 5.0, "y": 1.0, "z": 0.0 }), &l, t);
            x = s.x;
        }
        assert!(x < 12.0, "travelled {} in one second at spd 8", x);
    }

    #[test]
    fn flying_is_refused() {
        let s = step(Some((0.0, 1.0, 0.0, 0)), &json!({ "x": 0.0, "y": 90.0, "z": 0.0 }), &lim(), 100);
        assert!(!s.clean);
        assert!(s.y < 4.0, "rose to {}", s.y);
    }

    #[test]
    fn cannot_leave_the_map() {
        let s = step(None, &json!({ "x": 9000.0, "y": 1.0, "z": -9000.0 }), &lim(), 100);
        assert!(s.x <= 40.0 && s.x >= -40.0, "x {}", s.x);
        assert!(s.z <= 40.0 && s.z >= -40.0, "z {}", s.z);
    }

    #[test]
    fn respawn_after_falling_out_is_allowed() {
        let l = lim();
        // Was below the kill plane, now back at the top of the level.
        let s = step(Some((0.0, -40.0, 0.0, 0)), &json!({ "x": 0.0, "y": 1.0, "z": 0.0 }), &l, 100);
        assert!(s.clean);
        assert!((s.y - 1.0).abs() < 1e-9);
    }

    #[test]
    fn respawn_at_a_spawn_point_is_allowed() {
        let l = Limit::of(Some(&json!({
            "spd": 8,
            "killY": -15,
            "objs": [
                { "k": "p", "x": 0, "y": 0, "z": 0, "sx": 40, "sz": 40 },
                { "k": "s", "x": 10, "y": 1, "z": 10 }
            ]
        })));
        let s = step(Some((0.0, 1.0, 0.0, 0)), &json!({ "x": 10.0, "y": 1.0, "z": 10.0 }), &l, 100);
        assert!(s.clean, "respawn at spawn should be accepted");
    }

    #[test]
    fn falling_fast_is_fine() {
        let s = step(Some((0.0, 40.0, 0.0, 0)), &json!({ "x": 0.0, "y": 35.0, "z": 0.0 }), &lim(), 100);
        assert!(s.clean, "a 5 unit fall in 100 ms is normal");
    }
}
