// Ruko server, Rust edition. Same API, same Redis schema, same static files as the Node server:
// it can be pointed at the existing data store and take over without any migration.
mod api;
mod authority;
mod filter;
mod p256push;
mod pvp;
mod scripts;
mod state;
mod util;

use axum::body::{to_bytes, Body};
use axum::http::{header, Request, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Router;
use serde_json::{json, Map, Value};
use state::{App, D, Files, Room, Store};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::atomic::Ordering;
use std::sync::{Arc, Mutex};
use util::*;

const PRICE: &[(&str, i64)] = &[
    ("r1", 50),
    ("r2", 120),
    ("r3", 200),
    ("r4", 400),
    ("r5", 30),
    ("r6", 80),
];

pub fn price_of(id: &str) -> Option<i64> {
    PRICE.iter().find(|(k, _)| *k == id).map(|(_, v)| *v)
}

const DEFNAME: &[(&str, &str)] = &[
    ("r1", "Ruko Cap"),
    ("r2", "Top Hat"),
    ("r3", "Wizard Hat"),
    ("r4", "Golden Halo"),
    ("r5", "Party Cone"),
    ("r6", "Crate Head"),
];

pub fn def_name(id: &str) -> String {
    DEFNAME
        .iter()
        .find(|(k, _)| *k == id)
        .map(|(_, v)| v.to_string())
        .unwrap_or_else(|| id.to_string())
}

const BUILTIN: &[(&str, &str, &str, &str, &str, &str, f64, f64, &str)] = &[
    (
        "g1",
        "Sky Steps",
        "Jump up the floating obby to the golden platform.",
        "obby",
        "#8fd3ff",
        "#5bd16a",
        7.0,
        18.0,
        "Obby",
    ),
    (
        "g2",
        "Coin Rush",
        "Grab every coin in the park.",
        "coins",
        "#ffd9a0",
        "#7bc96f",
        3.0,
        20.0,
        "Adventure",
    ),
    (
        "g3",
        "Ruko Park",
        "Free roam. Show off your hats.",
        "roam",
        "#b7e3ff",
        "#9fd3a0",
        11.0,
        12.0,
        "Chill",
    ),
];

fn hsl2hex(h: f64, s: f64, l: f64) -> String {
    let h = h / 360.0;
    let s = s / 100.0;
    let l = l / 100.0;
    let f = |n: f64| -> u8 {
        let k = (n + h * 12.0) % 12.0;
        let a = s * l.min(1.0 - l);
        let v = l - a * (-1.0f64).max((k - 3.0).min(9.0 - k).min(1.0));
        (255.0 * v).round().clamp(0.0, 255.0) as u8
    };
    format!("#{:02x}{:02x}{:02x}", f(0.0), f(8.0), f(4.0))
}

fn builtin_objs(g: &Value) -> Vec<Value> {
    let seed = (i(g, "seed").rem_euclid(2_147_483_646)) + 1;
    let mut sd: i64 = seed;
    let mut r = || {
        sd = (sd * 16807) % 2_147_483_647;
        sd as f64 / 2_147_483_647.0
    };
    let mut o = vec![json!({"k": "s", "x": 0, "y": 0, "z": 0})];
    let mut push_p = |x: f64, y: f64, z: f64, sx: f64, sz: f64, c: String, t: &str| {
        o.push(json!({
            "k": "p", "t": t,
            "x": (x * 100.0).round() / 100.0,
            "y": (y * 100.0).round() / 100.0,
            "z": (z * 100.0).round() / 100.0,
            "sx": sx, "sz": sz, "th": 0.5, "c": c
        }));
    };
    let mode = s(g, "mode");
    let ground = s(g, "ground");
    if mode == "obby" {
        push_p(0.0, 0.0, 0.0, 6.0, 6.0, ground, "solid");
        let (mut x, mut y, mut z) = (0.0, 0.0, 0.0);
        let n = i(g, "size").clamp(5, 40);
        for idx in 0..n {
            x += (r() - 0.5) * 6.0;
            y += 0.3 + r() * 0.9;
            z -= 4.5 + r() * 1.5;
            let last = idx == n - 1;
            let c = if last {
                "#ffd23f".to_string()
            } else {
                hsl2hex(((idx * 37) % 360) as f64, 70.0, 60.0)
            };
            push_p(x, y, z, 3.0, 3.0, c, if last { "goal" } else { "solid" });
        }
    } else {
        push_p(0.0, 0.0, 0.0, 60.0, 60.0, ground, "solid");
        let n = if mode == "roam" { 12 } else { 6 };
        for _ in 0..n {
            let x = (r() - 0.5) * 40.0;
            let y = 0.8 + r() * 2.0;
            let z = (r() - 0.5) * 40.0;
            push_p(x, y, z, 3.0, 3.0, hsl2hex(r() * 360.0, 60.0, 60.0), "solid");
        }
        if mode == "coins" {
            for _ in 0..25 {
                o.push(json!({
                    "k": "c",
                    "x": (((r() - 0.5) * 40.0) * 100.0).round() / 100.0,
                    "y": ((0.9 + r() * 1.4) * 100.0).round() / 100.0,
                    "z": (((r() - 0.5) * 40.0) * 100.0).round() / 100.0
                }));
            }
        }
    }
    o
}

pub fn seed_builtins(d: &mut D) -> bool {
    let removed = d.meta.get("__removed").cloned().unwrap_or(json!({}));
    let mut n = false;
    for (id, name, desc, mode, sky, ground, seed, size, genre) in BUILTIN {
        if bo(&removed, id) || d.games.iter().any(|g| s(g, "id") == *id) {
            continue;
        }
        let probe = json!({"mode": mode, "ground": ground, "seed": seed, "size": size});
        d.games.push(json!({
            "id": id, "creator": "Ruko", "name": name, "desc": desc, "genre": genre,
            "mode": "custom", "sky": sky, "ground": ground, "size": 16, "seed": 1,
            "spd": 7, "jmp": 9, "grav": 22, "coinN": 25, "cps": false, "pvp": false,
            "hp": 100, "resp": 3, "weapons": [], "startW": [], "light": 1, "fog": true,
            "killY": -15, "objs": builtin_objs(&probe), "tv": 0, "at": 0
        }));
        n = true;
    }
    n
}

fn seed_admin(d: &mut D, password: &str) {
    if password.is_empty() {
        if let Some(u) = d.users.get_mut("ruko") {
            if let Some(o) = u.as_object_mut() {
                o.insert("admin".into(), json!(false));
            }
        }
        println!("ADMIN_PASSWORD not set: the Ruko admin account is disabled.");
        return;
    }
    let old = d.users.get("ruko").cloned().unwrap_or(json!({
        "name": "Ruko", "coins": 500, "owned": ["r1"], "worn": "r1", "av": null, "earn": []
    }));
    let salt = match s_opt(&old, "salt") {
        Some(x) if !x.is_empty() => x,
        _ => rnd(16),
    };
    let hash = hash_pw(password, &salt);
    let mut u = old;
    if !u.is_object() {
        u = json!({});
    }
    let o = u.as_object_mut().unwrap();
    o.insert("name".into(), json!("Ruko"));
    o.insert("admin".into(), json!(true));
    o.insert("salt".into(), json!(salt));
    o.insert("hash".into(), json!(hash));
    o.insert("coins".into(), json!(500));
    o.insert("owned".into(), json!(["r1"]));
    if !o.contains_key("av") {
        o.insert("av".into(), Value::Null);
    }
    d.users.insert("ruko".into(), u);
}

fn ensure_vapid(d: &mut D) {
    if let Some(v) = &d.vapid {
        if !s(v, "priv").is_empty() && !s(v, "pub").is_empty() {
            return;
        }
    }
    let v = p256push::new_vapid();
    d.vapid = Some(v);
}

async fn flush_loop(app: Arc<App>, mut last: HashMap<String, HashMap<String, String>>) {
    let mut tick = tokio::time::interval(std::time::Duration::from_secs(4));
    loop {
        tick.tick().await;
        if !app.dirty.load(Ordering::SeqCst) || app.busy.swap(true, Ordering::SeqCst) {
            continue;
        }
        let snapshot = {
            let d = app.d.lock().unwrap();
            d.clone()
        };
        match app.store.flush(&app.http, &snapshot, &mut last).await {
            Ok(()) => {}
            Err(e) => {
                eprintln!("Save failed, will retry: {}", e);
                app.dirty.store(true, Ordering::SeqCst);
            }
        }
        app.busy.store(false, Ordering::SeqCst);
    }
}

async fn room_loop(app: Arc<App>) {
    let mut tick = tokio::time::interval(std::time::Duration::from_millis(100));
    loop {
        tick.tick().await;
        let mut rooms = app.rooms.lock().unwrap();
        let now = now();
        let mut dead_rooms: Vec<String> = Vec::new();
        for (id, r) in rooms.iter_mut() {
            let closed: Vec<String> = r
                .cl
                .iter()
                .filter(|(_, c)| c.tx.as_ref().map(|t| t.is_closed()).unwrap_or(true))
                .map(|(k, _)| k.clone())
                .collect();
            for k in closed {
                r.cl.remove(&k);
                r.dirty = true;
            }
            if r.cl.is_empty() {
                dead_rooms.push(id.clone());
                continue;
            }
            if let Some(pv) = &r.pv {
                let hp = pv.hp;
                let resp = pv.resp;
                let start_w = pv.start_w.clone();
                for c in r.cl.values_mut() {
                    if c.rl > 0 && now >= c.rl {
                        if let Some(w) = pv.wd.get(c.rw.max(0) as usize) {
                            let mag = i(w, "mag");
                            if mag > 0 {
                                c.am.insert(c.rw, mag);
                            }
                        }
                        c.rl = 0;
                        r.dirty = true;
                    }
                    if c.dead && now >= c.rt {
                        c.dead = false;
                        c.hp = hp;
                        c.own = start_w.clone();
                        c.cw = c.own.first().copied().unwrap_or(-1);
                        c.am.clear();
                        c.rl = 0;
                        c.inv = now + 2000;
                        r.dirty = true;
                    }
                    if resp <= 0.0 {
                        c.rt = now;
                    }
                }
            }
            if !r.dirty {
                continue;
            }
            r.dirty = false;
            let peers: Vec<Value> = r
                .cl
                .iter()
                .map(|(peer, c)| {
                    let mut o = Map::new();
                    o.insert("peer".into(), json!(peer));
                    o.insert("name".into(), json!(c.name));
                    o.insert(
                        "presence".into(),
                        c.presence.clone().unwrap_or(json!({})),
                    );
                    if let Some(pv) = &r.pv {
                        o.insert("hp".into(), json!(c.hp));
                        o.insert("mx".into(), json!(pv.hp));
                        o.insert("k".into(), json!(c.k));
                        o.insert("d".into(), json!(c.d));
                        o.insert("w".into(), json!(c.cw));
                        o.insert("own".into(), json!(c.own));
                        o.insert("dead".into(), json!(c.dead));
                        o.insert("am".into(), json!(ammo_of(pv, c)));
                        o.insert("rl".into(), json!(if c.rl > 0 { 1 } else { 0 }));
                    }
                    Value::Object(o)
                })
                .collect();
            let msg = json!({ "peers": peers }).to_string();
            for c in r.cl.values() {
                if let Some(tx) = &c.tx {
                    let _ = tx.send(msg.clone());
                }
            }
        }
        for id in dead_rooms {
            rooms.remove(&id);
        }
    }
}

pub fn ammo_of(pv: &state::Pv, c: &state::Client) -> i64 {
    match pv.wd.get(c.cw.max(0) as usize) {
        Some(w) if i(w, "mag") > 0 => c.am.get(&c.cw).copied().unwrap_or_else(|| i(w, "mag")),
        _ => -1,
    }
}

fn content_type(path: &str) -> &'static str {
    if path.ends_with(".js") {
        "application/javascript; charset=utf-8"
    } else if path.ends_with(".html") {
        "text/html; charset=utf-8"
    } else if path.ends_with(".json") || path.ends_with(".webmanifest") {
        "application/json"
    } else if path.ends_with(".png") {
        "image/png"
    } else if path.ends_with(".ico") {
        "image/x-icon"
    } else if path.ends_with(".svg") {
        "image/svg+xml"
    } else if path.ends_with(".wasm") {
        "application/wasm"
    } else {
        "application/octet-stream"
    }
}

async fn entry(
    axum::extract::State(app): axum::extract::State<Arc<App>>,
    req: Request<Body>,
) -> Response {
    let path = req.uri().path().to_string();
    if path == "/sw.js" {
        return (
            StatusCode::OK,
            [
                (header::CONTENT_TYPE, "application/javascript; charset=utf-8"),
                (header::HeaderName::from_static("service-worker-allowed"), "/"),
            ],
            app.files.sw.clone(),
        )
            .into_response();
    }
    if let Some(name) = path.strip_prefix("/js/") {
        return match app.files.js.get(name) {
            Some(body) => (
                StatusCode::OK,
                [
                    (header::CONTENT_TYPE, "application/javascript; charset=utf-8"),
                    (header::CACHE_CONTROL, "public, max-age=3600"),
                ],
                body.clone(),
            )
                .into_response(),
            None => StatusCode::NOT_FOUND.into_response(),
        };
    }
    if !path.starts_with("/api/") {
        if path == "/" || path == "/index.html" {
            return (
                StatusCode::OK,
                [
                    (header::CONTENT_TYPE, "text/html; charset=utf-8"),
                    (header::CACHE_CONTROL, "no-store, must-revalidate"),
                ],
                app.files.index.clone().into_bytes(),
            )
                .into_response();
        }
        return (
            StatusCode::OK,
            [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
            app.files.index.clone().into_bytes(),
        )
            .into_response();
    }
    let (parts, body) = req.into_parts();
    let bytes = match to_bytes(body, 20 * 1024 * 1024).await {
        Ok(b) => b,
        Err(_) => return err(400, "Bad request").into_response(),
    };
    api::handle(app, parts, bytes).await
}

#[tokio::main]
async fn main() {
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);
    let public_dir = PathBuf::from(
        std::env::var("PUBLIC_DIR").unwrap_or_else(|_| "../public".to_string()),
    );
    let data_dir = PathBuf::from(
        std::env::var("DATA_DIR").unwrap_or_else(|_| "../data".to_string()),
    );
    let _ = std::fs::create_dir_all(&data_dir);
    let admin_password = std::env::var("ADMIN_PASSWORD").unwrap_or_default();

    let store = Store {
        url: std::env::var("UPSTASH_REDIS_REST_URL")
            .unwrap_or_default()
            .trim_end_matches('/')
            .to_string(),
        token: std::env::var("UPSTASH_REDIS_REST_TOKEN").unwrap_or_default(),
        file: data_dir.join("data.json"),
    };
    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .expect("http client");

    let index = scripts::page(&public_dir);
    let sw = std::fs::read(public_dir.join("sw.js")).unwrap_or_default();
    let js = scripts::load_js(&public_dir);

    let mut d = D::default();
    let file_data = std::fs::read_to_string(&store.file)
        .ok()
        .and_then(|t| serde_json::from_str::<Value>(&t).ok());

    if store.redis() {
        let loaded = store.load(&http, &mut d).await;
        match loaded {
            Ok(had) => {
                if !had {
                    if let Some(f) = &file_data {
                        d = D::from_value(f);
                        println!("Redis was empty: copying the local data file into it.");
                    } else {
                        println!("Redis is empty: starting fresh.");
                    }
                } else {
                    println!("Loaded all data from Redis.");
                }
            }
            Err(e) => {
                eprintln!(
                    "Could not read from Redis. Not starting, so no data gets overwritten: {}",
                    e
                );
                std::process::exit(1);
            }
        }
    } else {
        if let Some(f) = &file_data {
            d = D::from_value(f);
        }
        println!("No Redis configured: saving to a local file (lost if the host resets its disk).");
    }

    seed_admin(&mut d, &admin_password);
    seed_builtins(&mut d);
    ensure_vapid(&mut d);

    let last = if store.redis() {
        d.views()
            .into_iter()
            .map(|(name, rows)| (name.to_string(), rows.into_iter().collect()))
            .collect()
    } else {
        HashMap::new()
    };

    let app = Arc::new(App {
        d: Mutex::new(d),
        store,
        dirty: std::sync::atomic::AtomicBool::new(true),
        busy: std::sync::atomic::AtomicBool::new(false),
        rooms: Mutex::new(HashMap::new()),
        chat: Mutex::new(Vec::new()),
        cid: std::sync::atomic::AtomicU64::new(0),
        tries: Mutex::new(HashMap::new()),
        seen: Mutex::new(HashMap::new()),
        lc: Mutex::new(HashMap::new()),
        dmlc: Mutex::new(HashMap::new()),
        vcool: Mutex::new(HashMap::new()),
        resv: Mutex::new(HashMap::new()),
        files: Files { index, sw, js },
        http,
        public_dir,
        data_dir,
        admin_password,
    });

    tokio::spawn(room_loop(app.clone()));
    tokio::spawn(flush_loop(app.clone(), last));

    let router = Router::new().fallback(entry).with_state(app.clone());
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await.expect("bind");
    println!("Ruko running on port {}", port);
    axum::serve(listener, router).await.ok();
}
