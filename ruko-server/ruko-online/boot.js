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
 const at=where==='after'?i+mark.length:i;
 return src.slice(0,at)+text+src.slice(at);
};

// The room client is created asynchronously (inside RM.join().then), so the in-game menu needs
// one hook for its handle and another, later, for the list of players in the server.
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
  const out=splice(src,mark,hook,where);
  if(out===null){console.error('boot.js: game core hook marker missing ('+mark.slice(0,26)+'), serving the core without that hook');return}
  src=out;
 });
 coreCache=src;
 return coreCache;
}

// The editor offers more blocks and triggers than the server's save sanitizer used to accept,
// so anything using them was silently deleted on save (and then gone when the editor reopened).
// These two snippets teach the sanitizer the rest of the editor's blocks.
const BLOCK_CASES="case 'note':r={t,m:sStr(b.m,120)};break;\n  case 'shake':r={t,s:clamp(b.s,.1,5,.6)};break;\n  case 'coins':r={t,n:clamp(b.n,-999,999,10)|0};break;\n  case 'launch':r={t,n:clamp(b.n,1,60,18)};break;\n  case 'freeze':r={t,s:clamp(b.s,.1,30,2)};break;\n  case 'fog':r={t,k:['off','near','far'].includes(b.k)?b.k:'near'};break;\n  case 'ru':r={t,c:sCond(b.c),b:sBlocks(b.b,d+1)};break;\n  case 'waitUntil':r={t,c:sCond(b.c)};break;\n  case 'scale':r={t,o:sUid(b.o),p:clamp(b.p,0,400,200),s:clamp(b.s,0,20,1)};break;\n  case 'fade':r={t,o:sUid(b.o),p:clamp(b.p,0,100,0),s:clamp(b.s,0,20,1)};break;\n  case 'turn':r={t,o:sUid(b.o),deg:clamp(b.deg,-360,360,90),s:clamp(b.s,0,20,1)};break;\n  case 'face':r={t,o:sUid(b.o)};break;\n  ";
const TRIGGER_CASES="else if(t=='release')H={t,o:sUid(h.o)};else if(t=='near')H={t,n:clamp(h.n,1,60,5),o:sUid(h.o)};else if(t=='press')H={t,k:['space','shift','control','f','e','r','1','2'].includes(h.k)?h.k:'space'};else if(t=='jump')H={t};else if(t=='land')H={t};else if(t=='fall')H={t,n:clamp(h.n,-200,200,-15)};else if(t=='die')H={t}";
// A block whose object field was left empty used to be saved as the literal text "undefined",
// which then pointed at no object and showed up as a missing object in the editor.
const UID_OLD="test(String(v))?String(v):''";
const UID_NEW="test(String(v==null?'':v))?String(v==null?'':v):''";
// Site chat, in-game chat and direct messages each build their text the same way. The filter runs
// straight after that, so a blocked message is never stored and never sent to anyone else.
const FILTER_HOOK="if(require('./chatfilter.js').blocked(text))return send(res,200,{ok:1,filtered:1});";
const CHAT_MARKS=[
 "const text=String(b.text||'').trim().slice(0,200);if(!text)return send(res,400,{error:'Empty message.'});",
 "const text=String(b.text||'').trim().slice(0,160);if(!text)return send(res,400,{error:'Empty message.'});",
 "const text=String(b.text||'').trim().slice(0,500);if(!text)return send(res,400,{error:'Empty message.'});"
];
const SERVER_MARKS=[
 ["D.plays[gid]=(D.plays[gid]||0)+1;","try{require('./routes.js').noteVisit(D,gid)}catch(e){}",'after'],
 [UID_OLD,UID_NEW,'replace'],
 ["case 'say':r={t,m:sStr(b.m,80)",BLOCK_CASES,'before'],
 ["else if(t=='chatCmd')H={t,m:sStr(h.m,30)};",TRIGGER_CASES,'after'],
 ...CHAT_MARKS.map(mark=>[mark,FILTER_HOOK,'after'])
];

const posts=require('./posts.js'),descs=require('./descs.js');
const create=http.createServer.bind(http);
http.createServer=function(handler){
 return create(function(req,res){
  const url=String(req.url||'').split('?')[0];
  if(url===CORE){
   try{const js=coreSource();res.writeHead(200,{'content-type':'application/javascript; charset=utf-8','cache-control':'public, max-age=3600'});return res.end(js)}
   catch(e){console.error('boot.js: game core serve failed:',e&&e.message)}
  }
  // The page itself is never cached, so a new deploy is picked up on the next visit instead of
  // serving whatever the browser kept from last time.
  if(url==='/'||url==='/index.html'){
   try{
    const html=fs.readFileSync(path.join(__dirname,'public','index.html'));
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store, must-revalidate'});
    return res.end(html);
   }catch(e){console.error('boot.js: could not serve the page:',e&&e.message)}
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
src=src.replace(MARK," if(p=='/api/reports'||p=='/api/daily'||p=='/api/stats'||p=='/api/glike'||p=='/api/comments'||p=='/api/analytics'){return require('./routes.js')({req,res,p,b,me,send,need,D,save,staff,PRICE});}\n"+MARK);
SERVER_MARKS.forEach(([mark,hook,where])=>{
 const out=splice(src,mark,hook,where);
 if(out===null){console.error('boot.js: block sanitizer marker missing ('+mark.slice(0,26)+'), saving without that patch');return}
 src=out;
});
const m=new Module(file,module);
m.filename=file;
m.paths=Module._nodeModulePaths(__dirname);
m._compile(src,file);
