// Entry point. Adds the news, description, report and daily-bonus routes, then starts the game
// server exactly as it is on disk: server.js itself is never edited, the extra routes are
// spliced into its request handler in memory.
const http=require('http'),fs=require('fs'),path=require('path'),Module=require('module');
// Small snippets spliced into files in memory. The files on disk are never modified; only the
// copies served or run by this process carry them.
// Each entry: [marker, snippet, where], where "where" is "before" or "after" the marker.
const splice=(src,mark,text,where)=>{
 const i=src.indexOf(mark);
 if(i<0)return null;
 if(where==='replace')return src.slice(0,i)+text+src.slice(i+mark.length);
 if(where==='replace-all'){
  let out=src,j=out.indexOf(mark);
  if(j<0)return null;
  while(j>=0){out=out.slice(0,j)+text+out.slice(j+mark.length);j=out.indexOf(mark,j+text.length)}
  return out;
 }
 const at=where==='after'?i+mark.length:i;
 return src.slice(0,at)+text+src.slice(at);
};

// The room client is created asynchronously (inside RM.join().then), so the in-game menu needs
// one hook for its handle and another, later, for the list of players in the server.
const CORE='/js/00-boot-and-core.js';
const CORE_MARKS=[
 ["$('#ex').onclick=()=>{","window.RKPLAY={respawn:()=>{try{rsp()}catch(e){}},exit:()=>{try{document.getElementById('ex').click()}catch(e){}},game:g.name,id:g.id,solo:!srv,dbg:{run:(b,steps)=>{try{const r={stack:[],wait:0};scExec(b,r,performance.now());if(steps)for(let i=0;i<steps;i++)scStep(r,performance.now());return 'ok'}catch(e){return 'ERR '+e.message}},state:()=>({SV,ent,got,hp:ST&&ST.hp,keys:Object.assign({},keys),p:{x:p.x,y:p.y,z:p.z,vy:p.vy},ph:{spd:ph.spd,jmp:ph.jmp,grav:ph.grav},kids:S?S.children.length:0})}};\n",'before'],
 ["rr=r;","if(rr.onPeers){try{rr.onPeers(function(ps){window.RKROSTER=(ps&&ps.peers)||[];try{dispatchEvent(new Event('rk-roster'))}catch(e){}})}catch(e){}}",'after'],
 // Six variables instead of three, so the new code blocks have room to work.
 ["SV={score:0,A:0,B:0,C:0},","SV={score:0,A:0,B:0,C:0,D:0,E:0,F:0},",'replace'],
 ["(v=='A'||v=='B'||v=='C')?SV[v]","(/^[A-F]$/.test(v))?(SV[v]||0)",'replace'],
 // A "repeat while" frame: when its list runs out, start again while the condition holds.
 ["if(f.i>=f.list.length){if(f.rep&&--f.n>0)","if(f.i>=f.list.length){if(f.wl){if(!scCond(f.wl)||(f.wc=(f.wc||0)+1)>500){run.stack.pop();continue}f.i=0;continue}if(f.rep&&--f.n>0)",'replace'],
 // The tracer drawn the instant you fire predicts the shot locally; it reaches as far as the weapon
 // does, and a shotgun shows its pellets instead of a single line.
 ["if(d.t=='gun'){const L=Math.min(d.rng,45);tracer([p.x,p.y+1.6,p.z],[p.x+dx*L,p.y+1.6+A.s*L,p.z+dz*L])}","if(d.t=='gun'){const L=Math.min(d.rng,d.m=='sniper'?170:45),np=Math.max(1,Math.min(8,d.pel|0||1));for(let k=0;k<np;k++){const a=np>1?(Math.random()-.5)*(d.spr||0)*Math.PI/180*.8:0,ax=dx*Math.cos(a)-dz*Math.sin(a),az=dx*Math.sin(a)+dz*Math.cos(a);tracer([p.x,p.y+1.6,p.z],[p.x+ax*L,p.y+1.6+A.s*L,p.z+az*L])}}",'replace']
];
let coreCache=null;
function coreSource(){
 if(coreCache!==null)return coreCache;
 const f=path.join(__dirname,'public','js','00-boot-and-core.js');
 let src=fs.readFileSync(f,'utf8');
 CORE_MARKS.forEach(([mark,hook,where])=>{
  const out=splice(src,mark,hook,where);
  if(out===null){console.error('boot.js: game core hook marker missing ('+mark.slice(0,26)+'), serving the core without that hook');return}
  src=out;
 });
 coreCache=src;
 return coreCache;
}

// The block editor's file picker keeps its own size checks. Sounds may be up to 10 MB, which is
// 14 MB once the browser turns them into text, so the picker's ceiling is raised the same way.
const ASSET_JS='/js/25-studio-assets.js';
const ASSET_MARKS=[
 ['const MAXIMG=240000,MAXSND=300000;','const MAXIMG=240000,MAXSND=14000000;'],
 ["'That sound is too big. Try one under 250 KB.'","'That sound is too big. Sounds can be up to 10 MB.'"]
];
let assetCache=null;
function assetSource(){
 if(assetCache!==null)return assetCache;
 const f=path.join(__dirname,'public','js','25-studio-assets.js');
 let src=fs.readFileSync(f,'utf8');
 ASSET_MARKS.forEach(([mark,to])=>{
  if(src.indexOf(mark)<0){console.error('boot.js: upload limit marker missing ('+mark.slice(0,30)+'), using the old limit');return}
  src=src.split(mark).join(to);
 });
 assetCache=src;
 return assetCache;
}

// Uploads are stored by routes.js, which has its own size limits. They are raised here, in memory,
// by compiling a raised copy and putting it in the module cache before anything can require it.
const ROUTES_MARKS=[
 ['const MAXASSETS=8,MAXIMG=250000,MAXSND=320000,MAXTOTAL=900000;','const MAXASSETS=8,MAXIMG=250000,MAXSND=14000000,MAXTOTAL=32000000;'],
 ["'That sound is too big (about 250 KB max).'","'That sound is too big. Sounds can be up to 10 MB.'"]
];
function raiseUploadLimits(){
 const rf=path.join(__dirname,'routes.js');
 let src=fs.readFileSync(rf,'utf8');
 ROUTES_MARKS.forEach(([mark,to])=>{
  if(src.indexOf(mark)<0){console.error('boot.js: upload storage marker missing ('+mark.slice(0,30)+')');return}
  src=src.split(mark).join(to);
 });
 const mod=new Module(rf,module);
 mod.filename=rf;
 mod.paths=Module._nodeModulePaths(__dirname);
 mod._compile(src,rf);
 mod.loaded=true;
 require.cache[rf]=mod;
 return mod.exports;
}
try{raiseUploadLimits()}catch(e){console.error('boot.js: could not raise upload limits:',e&&e.message)}
