// Small helpers shared by every endpoint: reading loosely-typed JSON, clamping numbers,
// colours, random ids, password hashing and the JSON responses the browser expects.
use axum::http::StatusCode;
use axum::Json;
use rand::RngCore;
use serde_json::{json, Map, Value};

pub type R = (StatusCode, Json<Value>);

pub fn ok(v: Value) -> R {
    (StatusCode::OK, Json(v))
}

pub fn okj() -> R {
    ok(json!({"ok": 1}))
}

pub fn err(code: u16, msg: &str) -> R {
    (
        StatusCode::from_u16(code).unwrap_or(StatusCode::BAD_REQUEST),
        Json(json!({ "error": msg })),
    )
}

pub fn not_found() -> R {
    err(404, "Not found")
}

/// Milliseconds since the epoch, the unit every timestamp in the data store uses.
pub fn now() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

pub fn now_secs() -> i64 {
    chrono::Utc::now().timestamp()
}

pub fn day_of(ms: i64) -> String {
    chrono::DateTime::from_timestamp_millis(ms)
        .unwrap_or_default()
        .date_naive()
        .format("%Y-%m-%d")
        .to_string()
}

pub fn today() -> String {
    day_of(now())
}

pub fn yesterday() -> String {
    day_of(now() - 86_400_000)
}

pub fn rnd(n: usize) -> String {
    let mut b = vec![0u8; n];
    rand::thread_rng().fill_bytes(&mut b);
    hex::encode(b)
}

pub fn rnd_num(digits: usize) -> String {
    let mut s = String::new();
    while s.len() < digits {
        for c in rnd(8).chars() {
            if c.is_ascii_digit() {
                s.push(c);
                if s.len() == digits {
                    break;
                }
            }
        }
    }
    s
}

pub fn b64url(b: &[u8]) -> String {
    use base64::Engine;
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(b)
}

pub fn unb64url(s: &str) -> Vec<u8> {
    use base64::Engine;
    base64::engine::general_purpose::URL_SAFE_NO_PAD
        .decode(s.trim_end_matches('='))
        .unwrap_or_default()
}

pub fn unb64(s: &str) -> Vec<u8> {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(s)
        .unwrap_or_default()
}

/// Field access that behaves like JavaScript's loose object reads.
pub fn s(v: &Value, k: &str) -> String {
    match v.get(k) {
        Some(Value::String(x)) => x.clone(),
        Some(Value::Null) | None => String::new(),
        Some(other) => match other {
            Value::Number(n) => n.to_string(),
            Value::Bool(b) => b.to_string(),
            _ => String::new(),
        },
    }
}

pub fn s_opt(v: &Value, k: &str) -> Option<String> {
    match v.get(k) {
        Some(Value::String(x)) => Some(x.clone()),
        _ => None,
    }
}

pub fn f(v: &Value, k: &str) -> f64 {
    match v.get(k) {
        Some(Value::Number(n)) => n.as_f64().unwrap_or(0.0),
        Some(Value::String(x)) => x.trim().parse().unwrap_or(0.0),
        Some(Value::Bool(b)) => {
            if *b {
                1.0
            } else {
                0.0
            }
        }
        _ => 0.0,
    }
}

pub fn i(v: &Value, k: &str) -> i64 {
    f(v, k) as i64
}

pub fn bo(v: &Value, k: &str) -> bool {
    match v.get(k) {
        Some(Value::Bool(b)) => *b,
        Some(Value::Number(n)) => n.as_f64().unwrap_or(0.0) != 0.0,
        Some(Value::String(x)) => !x.is_empty(),
        _ => false,
    }
}

pub fn arr(v: &Value, k: &str) -> Vec<Value> {
    match v.get(k) {
        Some(Value::Array(a)) => a.clone(),
        _ => Vec::new(),
    }
}

pub fn obj(v: &Value, k: &str) -> Map<String, Value> {
    match v.get(k) {
        Some(Value::Object(o)) => o.clone(),
        _ => Map::new(),
    }
}

pub fn obj_or_new<'a>(v: &'a mut Value, k: &str) -> &'a mut Map<String, Value> {
    if !v.is_object() {
        *v = Value::Object(Map::new());
    }
    let m = v.as_object_mut().unwrap();
    if !m.get(k).map(|x| x.is_object()).unwrap_or(false) {
        m.insert(k.to_string(), Value::Object(Map::new()));
    }
    m.get_mut(k).unwrap().as_object_mut().unwrap()
}

pub fn arr_or_new<'a>(v: &'a mut Value, k: &str) -> &'a mut Vec<Value> {
    if !v.is_object() {
        *v = Value::Object(Map::new());
    }
    let m = v.as_object_mut().unwrap();
    if !m.get(k).map(|x| x.is_array()).unwrap_or(false) {
        m.insert(k.to_string(), Value::Array(Vec::new()));
    }
    m.get_mut(k).unwrap().as_array_mut().unwrap()
}

pub fn num_or(v: &Value, k: &str, d: i64) -> i64 {
    match v.get(k) {
        Some(Value::Number(n)) => n.as_i64().unwrap_or(d),
        _ => d,
    }
}

/// JavaScript's Number(): strings that look like numbers become numbers, everything else is NaN.
pub fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().unwrap_or(0.0),
        Value::String(x) => x.trim().parse().unwrap_or(f64::NAN),
        Value::Bool(b) => {
            if *b {
                1.0
            } else {
                0.0
            }
        }
        Value::Null => 0.0,
        _ => f64::NAN,
    }
}

pub fn clamp(v: Option<&Value>, a: f64, b: f64, d: f64) -> f64 {
    let n = v.map(num).unwrap_or(f64::NAN);
    if !n.is_finite() {
        return d;
    }
    n.max(a).min(b)
}

pub fn clampi(v: Option<&Value>, a: i64, b: i64, d: i64) -> i64 {
    let n = clamp(v, a as f64, b as f64, d as f64);
    n as i64
}

pub fn col(v: Option<&Value>) -> String {
    let s = match v {
        Some(Value::String(s)) => s.clone(),
        _ => String::new(),
    };
    let b = s.as_bytes();
    if b.len() == 7 && b[0] == b'#' && b[1..].iter().all(|c| c.is_ascii_hexdigit()) {
        s.to_lowercase()
    } else {
        "#888888".to_string()
    }
}

pub fn is_col(v: Option<&Value>) -> bool {
    match v {
        Some(Value::String(s)) => {
            let b = s.as_bytes();
            b.len() == 7 && b[0] == b'#' && b[1..].iter().all(|c| c.is_ascii_hexdigit())
        }
        _ => false,
    }
}

pub fn uid_ok(v: &Value) -> Option<String> {
    let s = match v {
        Value::String(s) => s.clone(),
        Value::Null => return None,
        _ => return None,
    };
    if !s.is_empty()
        && s.len() <= 10
        && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
    {
        Some(s)
    } else {
        None
    }
}

pub fn s_str(v: Option<&Value>, n: usize) -> String {
    match v {
        Some(Value::String(s)) => s.chars().take(n).collect(),
        Some(Value::Number(x)) => x.to_string().chars().take(n).collect(),
        Some(Value::Bool(b)) => b.to_string(),
        _ => String::new(),
    }
}

pub fn one_of(v: Option<&Value>, list: &[&str], d: &str) -> String {
    match v {
        Some(Value::String(s)) if list.contains(&s.as_str()) => s.clone(),
        _ => d.to_string(),
    }
}

/// scrypt with node's defaults (N=16384, r=8, p=1, 32 bytes), so existing password hashes
/// already stored in Redis keep working after the switch to Rust.
pub fn hash_pw(pw: &str, salt: &str) -> String {
    let params = scrypt::Params::new(14, 8, 1, 32).expect("scrypt params");
    let mut out = [0u8; 32];
    scrypt::scrypt(pw.as_bytes(), salt.as_bytes(), &params, &mut out).expect("scrypt");
    hex::encode(out)
}

/// A user record with the fields the browser is allowed to see.
pub fn pub_user(u: &Value, pending: i64) -> Value {
    let staff = bo(u, "admin") || bo(u, "mod");
    let mut o = Map::new();
    o.insert("name".into(), json!(s(u, "name")));
    o.insert("coins".into(), json!(num_or(u, "coins", 0)));
    o.insert("owned".into(), u.get("owned").cloned().unwrap_or(json!([])));
    o.insert(
        "gear".into(),
        u.get("gear")
            .filter(|g| g.is_object())
            .cloned()
            .unwrap_or(json!({})),
    );
    o.insert("av".into(), u.get("av").cloned().unwrap_or(Value::Null));
    o.insert("admin".into(), json!(bo(u, "admin")));
    o.insert("mod".into(), json!(bo(u, "mod")));
    o.insert("ernSales".into(), json!(num_or(u, "ernSales", 0)));
    o.insert("ernVisits".into(), json!(num_or(u, "ernVisits", 0)));
    let log = arr(u, "log");
    let start = log.len().saturating_sub(10);
    o.insert("log".into(), json!(log[start..].to_vec()));
    o.insert("bio".into(), json!(s(u, "bio")));
    o.insert("joined".into(), json!(num_or(u, "joined", 0)));
    if staff {
        o.insert("pend".into(), json!(pending));
    }
    Value::Object(o)
}

pub fn staff(u: &Value) -> bool {
    bo(u, "admin") || bo(u, "mod")
}

pub fn convo_key(a: &str, b: &str) -> String {
    let mut v = vec![a.to_lowercase(), b.to_lowercase()];
    v.sort();
    v.join("|")
}

/// Avatar colours and clothing, sanitised the way the browser and the server agree on.
pub fn av(a: Option<&Value>) -> Value {
    let a = match a {
        Some(Value::Object(o)) => o,
        _ => return Value::Null,
    };
    let av = Value::Object(a.clone());
    let mut o = Map::new();
    o.insert("skin".into(), json!(col(a.get("skin"))));
    o.insert("shirt".into(), json!(col(a.get("shirt"))));
    o.insert("pants".into(), json!(col(a.get("pants"))));
    o.insert(
        "face".into(),
        json!(clampi(a.get("face"), 0, 40, 0)),
    );
    for k in ["tee", "shirtTex", "pantsTex"] {
        if let Some(Value::String(t)) = a.get(k) {
            if !t.is_empty()
                && t.len() <= 30
                && t.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
            {
                o.insert(k.into(), json!(t));
            }
        }
    }
    let _ = av;
    Value::Object(o)
}
