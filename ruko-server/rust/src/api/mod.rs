// Request dispatch, shared request helpers, and the small endpoints that do not warrant their
// own module. Path handling mirrors server.js: one handler, prefix checks, JSON in and out.
pub mod game;
pub mod misc;

use crate::state::App;
use crate::util::*;
use axum::body::Bytes;
use axum::http::request::Parts;
use axum::http::Method;
use axum::response::{IntoResponse, Response};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;

pub struct Ctx {
    pub app: Arc<App>,
    pub path: String,
    pub method: Method,
    pub q: HashMap<String, String>,
    pub b: Value,
    pub me: Option<String>,
    pub ip: String,
}

impl Ctx {
    pub fn query(&self, k: &str) -> String {
        self.q.get(k).cloned().unwrap_or_default()
    }

    pub fn post(&self) -> bool {
        self.method == Method::POST
    }

    /// A logged-in user, locked for writing.
    pub fn with_user<T>(&self, f: impl FnOnce(&mut Value) -> T) -> Option<T> {
        let key = self.me.clone()?;
        let mut d = self.app.d.lock().unwrap();
        let u = d.users.get_mut(&key)?;
        let out = f(u);
        drop(d);
        self.app.save();
        Some(out)
    }
}

pub fn pct_decode(s: &str) -> String {
    let b = s.as_bytes();
    let mut out: Vec<u8> = Vec::new();
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            let hex = std::str::from_utf8(&b[i + 1..i + 3]).unwrap_or("");
            if let Ok(v) = u8::from_str_radix(hex, 16) {
                out.push(v);
                i += 3;
                continue;
            }
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).to_string()
}

fn parse_query(raw: Option<&str>) -> HashMap<String, String> {
    let mut out = HashMap::new();
    if let Some(raw) = raw {
        for pair in raw.split('&') {
            if pair.is_empty() {
                continue;
            }
            let mut it = pair.splitn(2, '=');
            let k = pct_decode(it.next().unwrap_or("")).replace('+', " ");
            let v = pct_decode(it.next().unwrap_or("")).replace('+', " ");
            out.insert(k, v);
        }
    }
    out
}

fn token_of(parts: &Parts, q: &HashMap<String, String>) -> Option<String> {
    let h = parts
        .headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");
    let t = h.strip_prefix("Bearer ").unwrap_or("").trim();
    if !t.is_empty() {
        return Some(t.to_string());
    }
    q.get("token").cloned().filter(|s| !s.is_empty())
}

fn me_key(app: &App, parts: &Parts, q: &HashMap<String, String>) -> Option<String> {
    let t = token_of(parts, q)?;
    let key = {
        let d = app.d.lock().unwrap();
        match d.sessions.get(&t) {
            Some(Value::String(s)) => s.clone(),
            Some(other) => other.as_str().unwrap_or("").to_string(),
            None => return None,
        }
    };
    let name = {
        let d = app.d.lock().unwrap();
        match d.users.get(&key) {
            Some(u) if !bo(u, "banned") => s(u, "name"),
            _ => return None,
        }
    };
    if !name.is_empty() {
        app.seen.lock().unwrap().insert(name, now());
        return Some(key);
    }
    None
}

pub async fn handle(app: Arc<App>, parts: Parts, body: Bytes) -> Response {
    let path = parts.uri.path().to_string();
    let q = parse_query(parts.uri.query());
    let b = if parts.method == Method::POST {
        serde_json::from_slice::<Value>(&body)
            .ok()
            .filter(|v| v.is_object())
            .unwrap_or_else(|| json!({}))
    } else {
        json!({})
    };
    let me = me_key(&app, &parts, &q);
    let ip = parts
        .headers
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .map(|v| v.split(',').next().unwrap_or("").trim().to_string())
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| "local".to_string());
    let c = Ctx {
        app,
        path,
        method: parts.method.clone(),
        q,
        b,
        me,
        ip,
    };
    route(c).await
}

async fn route(c: Ctx) -> Response {
    let p = c.path.clone();

    // accounts
    if p == "/api/signup" || p == "/api/login" {
        return misc::auth(&c).into_response();
    }
    if p == "/api/me" {
        return misc::me(&c).into_response();
    }
    if p == "/api/profile" {
        return misc::profile(&c).into_response();
    }
    if p == "/api/players" {
        return misc::players(&c).into_response();
    }
    if p == "/api/hats" {
        return misc::hats(&c).into_response();
    }
    if p == "/api/shirts" {
        return misc::shirts(&c).into_response();
    }
    if p.starts_with("/api/shirt/") {
        return misc::shirt_image(&c);
    }
    if p.starts_with("/api/thumb/") {
        return misc::thumb(&c);
    }
    if p == "/api/chat" {
        return misc::chat(&c).into_response();
    }
    if p == "/api/admin/chatdel" {
        return misc::chat_delete(&c).into_response();
    }
    if p == "/api/like" || p == "/api/glike" {
        return misc::like(&c).into_response();
    }
    if p == "/api/mine/delete" {
        return misc::mine_delete(&c).into_response();
    }
    if p == "/api/buy" {
        return misc::buy(&c).into_response();
    }
    if p == "/api/earn" {
        return misc::earn(&c).into_response();
    }
    if p == "/api/admin/all" || p == "/api/admin/export" || p == "/api/admin/pending" {
        return misc::admin_view(&c).into_response();
    }
    if p == "/api/admin/review"
        || p == "/api/admin/restore"
        || p == "/api/admin/item"
        || p == "/api/admin/hat"
        || p == "/api/admin/game"
        || p == "/api/admin/users"
        || p == "/api/admin/grant"
    {
        return misc::admin_action(&c).into_response();
    }

    // friends, messages, push
    if p == "/api/friends" {
        return misc::friends(&c).into_response();
    }
    if p == "/api/dm" {
        return misc::dm(&c).into_response();
    }
    if p == "/api/conversations" {
        return misc::conversations(&c).into_response();
    }
    if p == "/api/push/key" || p == "/api/push/sub" || p == "/api/push/unsub" {
        return misc::push(&c).into_response();
    }

    // games and live servers
    if p == "/api/games" || p == "/api/game" {
        return game::games(&c).into_response();
    }
    if p == "/api/servers/assign" {
        return game::assign(&c).into_response();
    }
    if p == "/api/servers" {
        return game::servers(&c).into_response();
    }
    if p.starts_with("/api/room/") {
        return game::room(&c).await;
    }

    // creator extras: uploads, tickets, daily bonus, reports, stats, comments, news, descriptions
    if p.starts_with("/api/asset") {
        return misc::assets(&c);
    }
    if p == "/api/daily" {
        return misc::daily(&c).into_response();
    }
    if p == "/api/reports" {
        return misc::reports(&c).into_response();
    }
    if p == "/api/stats" {
        return misc::stats(&c).into_response();
    }
    if p == "/api/comments" {
        return misc::comments(&c).into_response();
    }
    if p == "/api/drafts" {
        return misc::drafts(&c).into_response();
    }
    if p == "/api/analytics" {
        return misc::analytics(&c).into_response();
    }
    if p.starts_with("/api/tickets") {
        return misc::tickets(&c).into_response();
    }
    if p == "/api/posts" {
        return misc::posts(&c).await;
    }
    if p == "/api/descs" {
        return misc::descs(&c).await;
    }

    not_found().into_response()
}

pub fn need_login() -> R {
    err(401, "Please log in again.")
}

pub fn staff_only() -> R {
    err(403, "Staff only.")
}

/// JSON body field, defaulting the way JavaScript's `||` and `String()` do.
pub fn bstr(c: &Ctx, k: &str) -> String {
    s(&c.b, k)
}

pub fn bnum(c: &Ctx, k: &str) -> f64 {
    f(&c.b, k)
}
