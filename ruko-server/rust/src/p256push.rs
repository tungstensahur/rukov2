// Web Push (RFC 8291 / VAPID) without external services: P-256 key agreement, AES-128-GCM
// payload encryption and an ES256 JWT, the same scheme the Node server hand-rolled.
use crate::state::App;
use crate::util::*;
use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes128Gcm, Nonce};
use hmac::{Hmac, Mac};
use p256::ecdsa::signature::Signer;
use p256::elliptic_curve::sec1::ToEncodedPoint;
use p256::ecdsa::{Signature, SigningKey};
use p256::{ecdh, PublicKey, SecretKey};
use rand::RngCore;
use serde_json::{json, Value};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

pub fn new_vapid() -> Value {
    let sk = SecretKey::random(&mut rand::thread_rng());
    let pub_bytes = sk.public_key().to_encoded_point(false);
    json!({
        "pub": b64url(pub_bytes.as_bytes()),
        "priv": b64url(&sk.to_bytes())
    })
}

fn hmac(key: &[u8], msg: &[u8]) -> Vec<u8> {
    let mut m = <HmacSha256 as Mac>::new_from_slice(key).expect("hmac key");
    m.update(msg);
    m.finalize().into_bytes().to_vec()
}

fn jwt(vapid: &Value, aud: &str) -> Option<String> {
    let header = b64url(br#"{"typ":"JWT","alg":"ES256"}"#);
    let payload = b64url(
        json!({
            "aud": aud,
            "exp": now_secs() + 12 * 3600,
            "sub": "mailto:ruko-admin@example.com"
        })
        .to_string()
        .as_bytes(),
    );
    let input = format!("{}.{}", header, payload);
    let priv_bytes = unb64url(&s(vapid, "priv"));
    let key = SigningKey::from_slice(&priv_bytes).ok()?;
    let sig: Signature = key.sign(input.as_bytes());
    Some(format!("{}.{}", input, b64url(&sig.to_bytes())))
}

/// Encrypts one push message for one subscription.
fn encrypt(keys: &Value, payload: &[u8]) -> Option<Vec<u8>> {
    let ua_pub_bytes = unb64url(&s(keys, "p256dh"));
    let auth_secret = unb64url(&s(keys, "auth"));
    let ua_pub = PublicKey::from_sec1_bytes(&ua_pub_bytes).ok()?;

    let eph = SecretKey::random(&mut rand::thread_rng());
    let as_pub = eph.public_key().to_encoded_point(false).as_bytes().to_vec();
    let shared = ecdh::diffie_hellman(eph.to_nonzero_scalar(), ua_pub.as_affine());
    let shared_bytes = shared.raw_secret_bytes().to_vec();

    let auth_prk = hmac(&auth_secret, &shared_bytes);
    let mut key_info = b"WebPush: info\0".to_vec();
    key_info.extend_from_slice(&ua_pub_bytes);
    key_info.extend_from_slice(&as_pub);
    key_info.push(1);
    let ikm = hmac(&auth_prk, &key_info);
    let ikm = &ikm[..32];

    let mut salt = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut salt);
    let prk = hmac(&salt, ikm);

    let mut cek_info = b"Content-Encoding: aes128gcm\0".to_vec();
    cek_info.push(1);
    let cek = hmac(&prk, &cek_info);
    let mut nonce_info = b"Content-Encoding: nonce\0".to_vec();
    nonce_info.push(1);
    let nonce = hmac(&prk, &nonce_info);

    let cipher = Aes128Gcm::new_from_slice(&cek[..16]).ok()?;
    let mut plain = payload.to_vec();
    plain.push(2);
    let ct = cipher.encrypt(Nonce::from_slice(&nonce[..12]), plain.as_ref()).ok()?;

    let mut body = Vec::new();
    body.extend_from_slice(&salt);
    body.extend_from_slice(&4096u32.to_be_bytes());
    body.push(as_pub.len() as u8);
    body.extend_from_slice(&as_pub);
    body.extend_from_slice(&ct);
    Some(body)
}

fn origin(endpoint: &str) -> Option<String> {
    let u = reqwest::Url::parse(endpoint).ok()?;
    let host = u.host_str()?;
    let mut s = format!("{}://{}", u.scheme(), host);
    if let Some(p) = u.port() {
        s.push_str(&format!(":{}", p));
    }
    Some(s)
}

/// Sends a notification to every device a player has registered. Dropped subscriptions are
/// removed, exactly like the Node version did.
pub async fn send(app: &App, username: &str, title: &str, body: &str, url: &str) {
    let (vapid, subs) = {
        let d = app.d.lock().unwrap();
        let subs = match d.push.get(username) {
            Some(Value::Array(a)) => a.clone(),
            _ => return,
        };
        if subs.is_empty() {
            return;
        }
        let vapid = match d.vapid.clone() {
            Some(v) => v,
            None => return,
        };
        (vapid, subs)
    };
    let payload = json!({ "title": title, "body": body, "url": if url.is_empty() { "/" } else { url } })
        .to_string();
    let mut expired: Vec<String> = Vec::new();
    for sub in subs.iter().take(6) {
        let endpoint = s(sub, "endpoint");
        if endpoint.is_empty() {
            continue;
        }
        let aud = match origin(&endpoint) {
            Some(a) => a,
            None => continue,
        };
        let keys = sub.get("keys").cloned().unwrap_or(json!({}));
        let enc = match encrypt(&keys, payload.as_bytes()) {
            Some(e) => e,
            None => continue,
        };
        let token = match jwt(&vapid, &aud) {
            Some(t) => t,
            None => continue,
        };
        let res = app
            .http
            .post(&endpoint)
            .header("Content-Type", "application/octet-stream")
            .header("Content-Encoding", "aes128gcm")
            .header("TTL", "2419200")
            .header(
                "Authorization",
                format!("vapid t={}, k={}", token, s(&vapid, "pub")),
            )
            .body(enc)
            .send()
            .await;
        match res {
            Ok(r) => {
                let code = r.status().as_u16();
                if code == 404 || code == 410 {
                    expired.push(endpoint);
                }
            }
            Err(e) => eprintln!("push failed: {}", e),
        }
    }
    if !expired.is_empty() {
        let mut d = app.d.lock().unwrap();
        if let Some(Value::Array(list)) = d.push.get_mut(username) {
            list.retain(|s2| !expired.contains(&s(s2, "endpoint")));
        }
        drop(d);
        app.save();
    }
}
