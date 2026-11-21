// The in-memory patches boot.js used to apply to the browser files, plus the page assembly.
// The files on disk stay untouched; only the copies served by this process carry the patches.
use std::collections::HashMap;
use std::path::Path;

pub struct Splice {
    pub mark: &'static str,
    pub text: &'static str,
    /// "before", "after" or "replace"
    pub at: &'static str,
}

pub fn splice(src: &str, sp: &Splice) -> Option<String> {
    let i = src.find(sp.mark)?;
    let out = match sp.at {
        "replace" => format!("{}{}{}", &src[..i], sp.text, &src[i + sp.mark.len()..]),
        "after" => {
            let at = i + sp.mark.len();
            format!("{}{}{}", &src[..at], sp.text, &src[at..])
        }
        _ => format!("{}{}{}", &src[..i], sp.text, &src[i..]),
    };
    Some(out)
}

const CORE_MARKS: &[Splice] = &[
    Splice {
        mark: "$('#ex').onclick=()=>{",
        text: r##"window.RKPLAY={respawn:()=>{try{rsp()}catch(e){}},exit:()=>{try{document.getElementById('ex').click()}catch(e){}},game:g.name,id:g.id,solo:!srv,scene:S,dbg:{run:(b,steps)=>{try{const r={stack:[],wait:0};scExec(b,r,performance.now());if(steps)for(let i=0;i<steps;i++)scStep(r,performance.now());return 'ok'}catch(e){return 'ERR '+e.message}},state:()=>({SV,ent,got,hp:ST&&ST.hp,keys:Object.assign({},keys),p:{x:p.x,y:p.y,z:p.z,vy:p.vy},ph:{spd:ph.spd,jmp:ph.jmp,grav:ph.grav},kids:S?S.children.length:0})}};\n"##,
        at: "before",
    },
    Splice {
        mark: "rr=r;",
        text: "if(rr.onPeers){try{rr.onPeers(function(ps){window.RKROSTER=(ps&&ps.peers)||[];try{dispatchEvent(new Event('rk-roster'))}catch(e){}})}catch(e){}}",
        at: "after",
    },
    Splice {
        mark: "SV={score:0,A:0,B:0,C:0},",
        text: "SV={score:0,A:0,B:0,C:0,D:0,E:0,F:0},",
        at: "replace",
    },
    Splice {
        mark: "(v=='A'||v=='B'||v=='C')?SV[v]",
        text: "(/^[A-F]$/.test(v))?(SV[v]||0)",
        at: "replace",
    },
    Splice {
        mark: "if(f.i>=f.list.length){if(f.rep&&--f.n>0)",
        text: "if(f.i>=f.list.length){if(f.wl){if(!scCond(f.wl)||(f.wc=(f.wc||0)+1)>500){run.stack.pop();continue}f.i=0;continue}if(f.rep&&--f.n>0)",
        at: "replace",
    },
    Splice {
        mark: "if(d.t=='gun'){const L=Math.min(d.rng,45);tracer([p.x,p.y+1.6,p.z],[p.x+dx*L,p.y+1.6+A.s*L,p.z+dz*L])}",
        text: "if(d.t=='gun'){const L=Math.min(d.rng,d.m=='sniper'?170:45),np=Math.max(1,Math.min(8,d.pel|0||1));for(let k=0;k<np;k++){const a=np>1?(Math.random()-.5)*(d.spr||0)*Math.PI/180*.8:0,ax=dx*Math.cos(a)-dz*Math.sin(a),az=dx*Math.sin(a)+dz*Math.cos(a);tracer([p.x,p.y+1.6,p.z],[p.x+ax*L,p.y+1.6+A.s*L,p.z+az*L])}}",
        at: "replace",
    },
];

const ASSET_MARKS: &[Splice] = &[
    Splice {
        mark: "const MAXIMG=240000,MAXSND=300000;",
        text: "const MAXIMG=240000,MAXSND=14000000;",
        at: "replace",
    },
    Splice {
        mark: "'That sound is too big. Try one under 250 KB.'",
        text: "'That sound is too big. Sounds can be up to 10 MB.'",
        at: "replace",
    },
];

fn patch(src: &str, marks: &[Splice]) -> String {
    let mut out = src.to_string();
    for sp in marks {
        if let Some(next) = splice(&out, sp) {
            out = next;
        } else {
            eprintln!(
                "ruko: patch marker missing ({}), serving without that patch",
                &sp.mark[..sp.mark.len().min(26)]
            );
        }
    }
    out
}

/// The game core and the asset picker are patched before they are served, exactly like boot.js.
/// They are read from disk at startup, so the browser files stay editable between restarts.
pub fn core_source(public_dir: &Path) -> String {
    let src = std::fs::read_to_string(public_dir.join("js/00-boot-and-core.js")).unwrap_or_default();
    patch(&src, CORE_MARKS)
}

pub fn asset_source(public_dir: &Path) -> String {
    let src = std::fs::read_to_string(public_dir.join("js/25-studio-assets.js")).unwrap_or_default();
    patch(&src, ASSET_MARKS)
}

pub const OVERLAYS: &[&str] = &[
    "30-hat-three.js",
    "31-home-games.js",
    "32-hat-builder.js",
    "33-studio-upgrades.js",
    "34-sound-stop.js",
    "35-game-saves.js",
    "36-tickets.js",
    "38-layout.js",
    "39-clothes.js",
    "43-studio-cpp.js",
    "44-ingame-rust.js",
    "46-game-kit.js",
    "47-studio-code.js",
];

/// index.html with the late overlays added, each versioned by its own file timestamp.
pub fn page(public_dir: &Path) -> String {
    let mut html = std::fs::read_to_string(public_dir.join("index.html")).unwrap_or_default();
    for name in OVERLAYS {
        if html.contains(name) {
            continue;
        }
        let p = public_dir.join("js").join(name);
        let hv = std::fs::metadata(&p)
            .and_then(|m| m.modified())
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        let tag = format!("<script src=\"js/{}?v={}\"></script></body>", name, hv);
        html = html.replacen("</body>", &tag, 1);
    }
    html
}

pub fn load_js(public_dir: &Path) -> HashMap<String, Vec<u8>> {
    let mut map = HashMap::new();
    let dir = public_dir.join("js");
    if let Ok(rd) = std::fs::read_dir(&dir) {
        for e in rd.flatten() {
            let name = e.file_name().to_string_lossy().to_string();
            if !name.ends_with(".js") {
                continue;
            }
            let body = match name.as_str() {
                "00-boot-and-core.js" => core_source(public_dir).into_bytes(),
                "25-studio-assets.js" => asset_source(public_dir).into_bytes(),
                _ => std::fs::read(e.path()).unwrap_or_default(),
            };
            map.insert(name, body);
        }
    }
    map
}
