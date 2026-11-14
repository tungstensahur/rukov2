// Entry point. Adds the news, description, report and daily-bonus routes, then starts the game
// server exactly as it is on disk: server.js itself is never edited, the extra routes are
// spliced into its request handler in memory.
const http=require('http'),fs=require('fs'),path=require('path'),Module=require('module');
// Two small snippets spliced into the game core so the in-game menu can respawn and list
// players. The file on disk is never modified; only the copy served to browsers carries them.
// Each entry: [marker, snippet, where] where "where" is before or after the marker.
// The room client is created asynchronously (inside RM.join().then), so the player list has to
// hook in there rather than next to the exit button.
const CORE='/js/00-boot-and-core.js';
const CORE_MARKS=[
 ["$('#ex').onclick=()=>{","window.RKPLAY={respawn:()=>{try{rsp()}catch(e){}},exit:()=>{try{document.getElementById('ex').click()}catch(e){}},game:g.name,solo:!srv};\n",'before'],
 ["rr=r;","if(rr.onPeers){try{rr.onPeers(function(ps){window.RKROSTER=(ps&&ps.peers)||[];try{dispatchEvent(new Event('rk-roster'))}catch(e){}})}catch(e){}}",'after']
];
let coreCache=null;
function coreSource(){
 if(coreCache!==null)return coreCache;
 const f=path.join(__dirname,'public','js','00-boot-and-core.js');
 let src=fs.readFileSync(f,'utf8');
 CORE_MARKS.forEach(([mark,hook,where])=>{
  const i=src.indexOf(mark);
  if(i<0){console.error('boot.js: game core hook marker missing ('+mark.slice(0,26)+'), serving the core without that hook');return}
  const at=where==='after'?i+mark.length:i;
  src=src.slice(0,at)+hook+src.slice(at);
 });
 coreCache=src;
 return coreCache;
}
const posts=require('./posts.js'),descs=require('./descs.js');
const create=http.createServer.bind(http);
http.createServer=function(handler){
 return create(function(req,res){
  const url=String(req.url||'').split('?')[0];
  if(url===CORE){
   try{const js=coreSource();res.writeHead(200,{'content-type':'application/javascript; charset=utf-8','cache-control':'public, max-age=3600'});return res.end(js)}
   catch(e){console.error('boot.js: game core serve failed:',e&&e.message)}
  }
  const mod=url==='/api/posts'?posts:url==='/api/descs'?descs:null;
  if(mod){
   mod(req,res).catch(e=>{console.error('extra api:',e&&e.message);try{res.writeHead(500,{'content-type':'application/json'});res.end('{"error":"Server error."}')}catch(_){}});
   return;
  }
  return handler(req,res);
 });
};
const file=path.join(__dirname,'server.js');
let src=fs.readFileSync(file,'utf8');
const MARK=" if(p=='/api/profile'){";
if(src.indexOf(MARK)<0)throw new Error('boot.js: could not find the route marker in server.js');
src=src.replace(MARK," if(p=='/api/reports'||p=='/api/daily'){return require('./routes.js')({req,res,p,b,me,send,need,D,save,staff});}\n"+MARK);
const m=new Module(file,module);
m.filename=file;
m.paths=Module._nodeModulePaths(__dirname);
m._compile(src,file);
