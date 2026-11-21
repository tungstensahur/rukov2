// The data store (same Upstash Redis schema as server.js, with the same local JSON fallback),
// the live game rooms and the shared application state.
use crate::util::*;
use serde_json::{json, Map, Value};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64};
use std::sync::Mutex;
use tokio::sync::mpsc::UnboundedSender;

#[derive(Clone, Default)]
pub struct D {
    pub users: Map<String, Value>,
    pub sessions: Map<String, Value>,
    pub hats: Vec<Value>,
    pub games: Vec<Value>,
    pub sales: Map<String, Value>,
    pub likes: Map<String, Value>,
    pub shirt_img: Map<String, Value>,
    pub plays: Map<String, Value>,
    pub meta: Map<String, Value>,
    pub friends: Map<String, Value>,
    pub freq: Map<String, Value>,
    pub dm: Map<String, Value>,
    pub push: Map<String, Value>,
    pub assets: Map<String, Value>,
    pub vapid: Option<Value>,
}

impl D {
    pub fn user(&self, key: &str) -> Option<&Value> {
        self.users.get(&key.to_lowercase())
    }

    pub fn user_mut(&mut self, key: &str) -> Option<&mut Value> {
        self.users.get_mut(&key.to_lowercase())
    }

    pub fn game(&self, id: &str) -> Option<&Value> {
        self.games.iter().find(|g| s(g, "id") == id)
    }

    pub fn game_mut(&mut self, id: &str) -> Option<&mut Value> {
        self.games.iter_mut().find(|g| s(g, "id") == id)
    }

    pub fn hat(&self, id: &str) -> Option<&Value> {
        self.hats.iter().find(|h| s(h, "id") == id)
    }

    pub fn to_value(&self) -> Value {
        let mut o = Map::new();
        o.insert("users".into(), Value::Object(self.users.clone()));
        o.insert("sessions".into(), Value::Object(self.sessions.clone()));
        o.insert("hats".into(), json!(self.hats));
        o.insert("games".into(), json!(self.games));
        o.insert("sales".into(), Value::Object(self.sales.clone()));
        o.insert("likes".into(), Value::Object(self.likes.clone()));
        o.insert("shirtImg".into(), Value::Object(self.shirt_img.clone()));
        o.insert("plays".into(), Value::Object(self.plays.clone()));
        o.insert("meta".into(), Value::Object(self.meta.clone()));
        o.insert("friends".into(), Value::Object(self.friends.clone()));
        o.insert("freq".into(), Value::Object(self.freq.clone()));
        o.insert("dm".into(), Value::Object(self.dm.clone()));
        o.insert("push".into(), Value::Object(self.push.clone()));
        o.insert("assets".into(), Value::Object(self.assets.clone()));
        o.insert("vapid".into(), self.vapid.clone().unwrap_or(Value::Null));
        Value::Object(o)
    }

    pub fn from_value(v: &Value) -> D {
        let m = |k: &str| match v.get(k) {
            Some(Value::Object(o)) => o.clone(),
            _ => Map::new(),
        };
        let list = |k: &str| match v.get(k) {
            Some(Value::Array(a)) => a.clone(),
            _ => Vec::new(),
        };
        D {
            users: m("users"),
            sessions: m("sessions"),
            hats: list("hats"),
            games: list("games"),
            sales: m("sales"),
            likes: m("likes"),
            shirt_img: m("shirtImg"),
            plays: m("plays"),
            meta: m("meta"),
            friends: m("friends"),
            freq: m("freq"),
            dm: m("dm"),
            push: m("push"),
            assets: m("assets"),
            vapid: v.get("vapid").filter(|x| !x.is_null()).cloned(),
        }
    }

    /// Redis collections, in the same order and with the same names server.js used.
    pub fn views(&self) -> Vec<(&'static str, Vec<(String, String)>)> {
        let mut out: Vec<(&'static str, Vec<(String, String)>)> = Vec::new();
        out.push((
            "users",
            self.users
                .iter()
                .map(|(k, v)| (k.clone(), v.to_string()))
                .collect(),
        ));
        out.push((
            "sessions",
            self.sessions
                .iter()
                .map(|(k, v)| (k.clone(), s(&json!({"v": v}), "v")))
                .collect(),
        ));
        out.push((
            "hats",
            self.hats
                .iter()
                .map(|h| (s(h, "id"), h.to_string()))
                .collect(),
        ));
        out.push((
            "games",
            self.games
                .iter()
                .map(|g| {
                    let mut g2 = g.clone();
                    if let Some(o) = g2.as_object_mut() {
                        o.remove("thumb");
                    }
                    (s(g, "id"), g2.to_string())
                })
                .collect(),
        ));
        out.push((
            "thumbs",
            self.games
                .iter()
                .filter(|g| !s(g, "thumb").is_empty())
                .map(|g| (s(g, "id"), s(g, "thumb")))
                .collect(),
        ));
        out.push((
            "sales",
            self.sales
                .iter()
                .map(|(k, v)| (k.clone(), v.to_string()))
                .collect(),
        ));
        out.push((
            "likes",
            self.likes
                .iter()
                .map(|(k, v)| (k.clone(), v.to_string()))
                .collect(),
        ));
        out.push((
            "shirtimgs",
            self.shirt_img
                .iter()
                .map(|(k, v)| (k.clone(), s(&json!({"v": v}), "v")))
                .collect(),
        ));
        out.push((
            "plays",
            self.plays
                .iter()
                .map(|(k, v)| (k.clone(), v.to_string()))
                .collect(),
        ));
        out.push((
            "meta",
            self.meta
                .iter()
                .map(|(k, v)| (k.clone(), v.to_string()))
                .collect(),
        ));
        out.push((
            "friends",
            self.friends
                .iter()
                .map(|(k, v)| (k.clone(), v.to_string()))
                .collect(),
        ));
        out.push((
            "freq",
            self.freq
                .iter()
                .map(|(k, v)| (k.clone(), v.to_string()))
                .collect(),
        ));
        out.push((
            "dm",
            self.dm.iter().map(|(k, v)| (k.clone(), v.to_string())).collect(),
        ));
        out.push((
            "push",
            self.push
                .iter()
                .map(|(k, v)| (k.clone(), v.to_string()))
                .collect(),
        ));
        out.push((
            "assets",
            self.assets
                .iter()
                .map(|(k, v)| (k.clone(), v.to_string()))
                .collect(),
        ));
        out.push((
            "vapid",
            self.vapid
                .iter()
                .map(|v| ("keys".to_string(), v.to_string()))
                .collect(),
        ));
        out
    }
}

pub struct Store {
    pub url: String,
    pub token: String,
    pub file: PathBuf,
}

impl Store {
    pub fn redis(&self) -> bool {
        !self.url.is_empty() && !self.token.is_empty()
    }

    async fn rcall(&self, client: &reqwest::Client, path: &str, body: &Value) -> Result<Value, String> {
        let r = client
            .post(format!("{}{}", self.url, path))
            .header("Authorization", format!("Bearer {}", self.token))
            .header("content-type", "application/json")
            .body(body.to_string())
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if !r.status().is_success() {
            return Err(format!("Redis HTTP {}", r.status()));
        }
        r.json::<Value>().await.map_err(|e| e.to_string())
    }

    async fn hall(&self, client: &reqwest::Client, c: &str) -> Result<Map<String, Value>, String> {
        let j = self
            .rcall(client, "", &json!(["HGETALL", format!("ruko:{}", c)]))
            .await?;
        if let Some(e) = j.get("error") {
            return Err(e.as_str().unwrap_or("redis error").to_string());
        }
        let mut out = Map::new();
        if let Some(Value::Array(a)) = j.get("result") {
            let mut idx = 0;
            while idx + 1 < a.len() {
                let k = a[idx].as_str().unwrap_or("").to_string();
                let v = match &a[idx + 1] {
                    Value::String(s) => s.clone(),
                    other => other.to_string(),
                };
                out.insert(k, Value::String(v));
                idx += 2;
            }
        }
        Ok(out)
    }

    /// Reads every collection back. Returns true when there were users, like server.js did.
    pub async fn load(&self, client: &reqwest::Client, d: &mut D) -> Result<bool, String> {
        let mut halls: HashMap<&str, Map<String, Value>> = HashMap::new();
        for c in [
            "users",
            "sessions",
            "hats",
            "games",
            "thumbs",
            "sales",
            "likes",
            "shirtimgs",
            "plays",
            "meta",
            "friends",
            "freq",
            "dm",
            "push",
            "assets",
            "vapid",
        ] {
            halls.insert(c, self.hall(client, c).await?);
        }
        let get = |c: &str| halls.get(c).cloned().unwrap_or_default();
        let parsed = |txt: &str| -> Value {
            serde_json::from_str(txt).unwrap_or(Value::Null)
        };
        let raw = |v: &Value| -> String {
            match v {
                Value::String(s) => s.clone(),
                other => other.to_string(),
            }
        };

        let mut users = Map::new();
        for (k, v) in get("users") {
            let raw = match &v {
                Value::String(s) => s.clone(),
                other => other.to_string(),
            };
            users.insert(k, parsed(&raw));
        }

        d.sessions = get("sessions");
        d.users = users;

        let thumbs = get("thumbs");
        let mut hats: Vec<Value> = get("hats")
            .values()
            .map(|v| parsed(v.as_str().unwrap_or("")))
            .collect();
        hats.sort_by_key(|h| num_or(h, "at", 0));
        d.hats = hats;

        let mut games: Vec<Value> = get("games")
            .values()
            .map(|v| parsed(v.as_str().unwrap_or("")))
            .collect();
        games.sort_by_key(|g| num_or(g, "at", 0));
        for g in games.iter_mut() {
            let id = s(g, "id");
            if let Some(t) = thumbs.get(&id) {
                if let Some(o) = g.as_object_mut() {
                    o.insert("thumb".into(), t.clone());
                }
            }
        }
        d.games = games;

        d.sales = get("sales");
        d.likes = get("likes")
            .into_iter()
            .map(|(k, v)| (k, parsed(&raw(&v))))
            .collect();
        d.shirt_img = get("shirtimgs");
        d.plays = get("plays");
        d.meta = get("meta")
            .into_iter()
            .map(|(k, v)| (k, parsed(&raw(&v))))
            .collect();
        d.friends = get("friends")
            .into_iter()
            .map(|(k, v)| (k, parsed(&raw(&v))))
            .collect();
        d.freq = get("freq")
            .into_iter()
            .map(|(k, v)| (k, parsed(&raw(&v))))
            .collect();
        d.dm = get("dm")
            .into_iter()
            .map(|(k, v)| (k, parsed(&raw(&v))))
            .collect();
        d.push = get("push")
            .into_iter()
            .map(|(k, v)| (k, parsed(&raw(&v))))
            .collect();
        d.assets = get("assets")
            .into_iter()
            .map(|(k, v)| (k, parsed(&raw(&v))))
            .collect();
        d.vapid = match get("vapid").get("keys") {
            Some(v) => Some(parsed(v.as_str().unwrap_or(""))),
            None => None,
        };
        Ok(!d.users.is_empty())
    }

    /// Writes back only what changed since the last flush, in pipelined batches.
    pub async fn flush(
        &self,
        client: &reqwest::Client,
        d: &D,
        last: &mut HashMap<String, HashMap<String, String>>,
    ) -> Result<(), String> {
        if !self.redis() {
            let txt = d.to_value().to_string();
            let tmp = self.file.with_extension("json.tmp");
            if let Some(dir) = self.file.parent() {
                let _ = std::fs::create_dir_all(dir);
            }
            std::fs::write(&tmp, txt).map_err(|e| e.to_string())?;
            std::fs::rename(&tmp, &self.file).map_err(|e| e.to_string())?;
            return Ok(());
        }
        let mut cmds: Vec<Value> = Vec::new();
        let mut next: HashMap<String, HashMap<String, String>> = HashMap::new();
        for (name, rows) in d.views() {
            let cur: HashMap<String, String> = rows.into_iter().collect();
            let prev = last.get(name);
            for (k, v) in cur.iter() {
                let changed = prev.map(|p| p.get(k) != Some(v)).unwrap_or(true);
                if changed {
                    cmds.push(json!(["HSET", format!("ruko:{}", name), k, v]));
                }
            }
            if let Some(p) = prev {
                for k in p.keys() {
                    if !cur.contains_key(k) {
                        cmds.push(json!(["HDEL", format!("ruko:{}", name), k]));
                    }
                }
            }
            next.insert(name.to_string(), cur);
        }
        let mut chunk: Vec<Value> = Vec::new();
        let mut size = 0usize;
        for c in cmds {
            let n = c.to_string().len();
            if size + n > 700_000 && !chunk.is_empty() {
                self.pipeline(client, &chunk).await?;
                chunk.clear();
                size = 0;
            }
            chunk.push(c);
            size += n;
        }
        if !chunk.is_empty() {
            self.pipeline(client, &chunk).await?;
        }
        *last = next;
        Ok(())
    }

    async fn pipeline(&self, client: &reqwest::Client, cmds: &[Value]) -> Result<(), String> {
        if cmds.is_empty() {
            return Ok(());
        }
        let j = self
            .rcall(client, "/pipeline", &Value::Array(cmds.to_vec()))
            .await?;
        if let Value::Array(items) = j {
            if let Some(bad) = items
                .iter()
                .find(|x| x.get("error").map(|e| !e.is_null()).unwrap_or(false))
            {
                return Err(format!("{}", bad.get("error").cloned().unwrap_or(json!("redis"))));
            }
        }
        Ok(())
    }
}

/* ---------- live rooms ---------- */

#[derive(Clone, Default)]
pub struct Client {
    pub tx: Option<UnboundedSender<String>>,
    pub name: String,
    pub presence: Option<Value>,
    pub hp: f64,
    pub k: i64,
    pub d: i64,
    pub own: Vec<i64>,
    pub cw: i64,
    pub dead: bool,
    pub inv: i64,
    pub lf: i64,
    pub rt: i64,
    pub am: HashMap<i64, i64>,
    pub rl: i64,
    pub rw: i64,
    // Server authority: last position the server accepted, when, how many bad updates, and a
    // freeze deadline for clients that keep sending impossible ones.
    pub px: f64,
    pub py: f64,
    pub pz: f64,
    pub pt: i64,
    pub pv: u32,
    pub pfreeze: i64,
}

#[derive(Clone)]
pub struct Box3 {
    pub x0: f64,
    pub x1: f64,
    pub z0: f64,
    pub z1: f64,
    pub y0: f64,
    pub y1: f64,
}

#[derive(Clone)]
pub struct Pv {
    pub wd: Vec<Value>,
    pub hp: f64,
    pub resp: f64,
    pub start_w: Vec<i64>,
    pub objs: Vec<Value>,
    pub occ: Vec<Box3>,
}

#[derive(Default)]
pub struct Room {
    pub cl: HashMap<String, Client>,
    pub dirty: bool,
    pub pv: Option<Pv>,
    pub lim: crate::authority::Limit,
}

impl Room {
    pub fn from_game(g: Option<&Value>) -> Room {
        let mut r = Room::default();
        r.lim = crate::authority::Limit::of(g);
        let g = match g {
            Some(g) if bo(g, "pvp") => g,
            _ => return r,
        };
        let wd = arr(g, "weapons");
        let objs = arr(g, "objs");
        let occ = objs
            .iter()
            .filter(|o| s(o, "k") == "p" && !o.get("mv").map(|m| !m.is_null()).unwrap_or(false))
            .map(|o| Box3 {
                x0: f(o, "x") - f(o, "sx") / 2.0,
                x1: f(o, "x") + f(o, "sx") / 2.0,
                z0: f(o, "z") - f(o, "sz") / 2.0,
                z1: f(o, "z") + f(o, "sz") / 2.0,
                y0: f(o, "y") - if f(o, "th") != 0.0 { f(o, "th") } else { 0.5 },
                y1: f(o, "y"),
            })
            .collect();
        let start_w: Vec<i64> = arr(g, "startW")
            .iter()
            .map(|v| v.as_i64().unwrap_or(0))
            .filter(|i| *i >= 0 && (*i as usize) < wd.len())
            .collect();
        r.pv = Some(Pv {
            wd,
            hp: if f(g, "hp") != 0.0 { f(g, "hp") } else { 100.0 },
            resp: if f(g, "resp") != 0.0 { f(g, "resp") } else { 3.0 },
            start_w,
            objs,
            occ,
        });
        r
    }
}

/* ---------- application state ---------- */

pub struct Files {
    pub index: String,
    pub sw: Vec<u8>,
    pub js: HashMap<String, Vec<u8>>,
}

pub struct App {
    pub d: Mutex<D>,
    pub store: Store,
    pub dirty: AtomicBool,
    pub busy: AtomicBool,
    pub rooms: Mutex<HashMap<String, Room>>,
    pub chat: Mutex<Vec<Value>>,
    pub cid: AtomicU64,
    pub tries: Mutex<HashMap<String, Vec<i64>>>,
    pub seen: Mutex<HashMap<String, i64>>,
    pub lc: Mutex<HashMap<String, i64>>,
    pub dmlc: Mutex<HashMap<String, i64>>,
    pub vcool: Mutex<HashMap<String, i64>>,
    pub resv: Mutex<HashMap<String, HashMap<String, i64>>>,
    pub files: Files,
    pub http: reqwest::Client,
    pub public_dir: PathBuf,
    pub data_dir: PathBuf,
    pub admin_password: String,
}

impl App {
    pub fn save(&self) {
        self.dirty.store(true, std::sync::atomic::Ordering::SeqCst);
    }

    pub fn room_load(&self, rooms: &HashMap<String, Room>, id: &str, name: &str, now: i64) -> usize {
        let mut n = rooms.get(id).map(|r| r.cl.len()).unwrap_or(0);
        if let Some(m) = self.resv.lock().unwrap().get(id) {
            for (k, t) in m.iter() {
                if *t < now {
                    continue;
                }
                let present = rooms
                    .get(id)
                    .map(|r| r.cl.values().any(|c| c.name == *k))
                    .unwrap_or(false);
                if k != name && !present {
                    n += 1;
                }
            }
        }
        n
    }

    pub fn reserve(&self, id: &str, name: &str, now: i64) {
        let mut resv = self.resv.lock().unwrap();
        resv.entry(id.to_string())
            .or_default()
            .insert(name.to_string(), now + 15_000);
    }
}
