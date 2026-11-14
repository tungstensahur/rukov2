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
 ["if(f.i>=f.list.length){if(f.rep&&--f.n>0)","if(f.i>=f.list.length){if(f.wl){if(!scCond(f.wl)||(f.wc=(f.wc||0)+1)>500){run.stack.pop();continue}f.i=0;continue}if(f.rep&&--f.n>0)",'replace']
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
// Two small validators the newer blocks need: an uploaded file id, and a value name.
const BLOCK_ASSET="const sA=v=>/^a[0-9a-z]{4,12}$/.test(String(v))?String(v):'';const sV=v=>['score','A','B','C','D','E','F','y','px','pz','time','coins','hp','kills'].includes(v)?v:'score';\n";
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
// The 34-block pack: weather, on-screen text, pictures, uploaded sound and simple enemy AI.
const BLOCK_CASES2=[
"case 'fogCol':r={t,c:col(b.cc)};break;",
"case 'bright':r={t,p:clamp(b.p,0,300,100)};break;",
"case 'rain':case 'snow':case 'weatherOff':r={t};break;",
"case 'hudText':r={t,m:sStr(b.m,120)};break;",
"case 'hudClear':r={t};break;",
"case 'hudValue':r={t,v:sV(b.v),m:sStr(b.m,24)};break;",
"case 'flash':r={t,c:col(b.cc),s:clamp(b.s,.1,3,.4)};break;",
"case 'bar':r={t,p:clamp(b.p,0,100,50),c:col(b.cc)};break;",
"case 'vibrate':r={t,s:clamp(b.s,.1,3,.3)};break;",
"case 'picture':r={t,a:sA(b.a),p:clamp(b.p,10,100,60)};break;",
"case 'pictureHide':r={t};break;",
"case 'texture':r={t,o:sUid(b.o),a:sA(b.a)};break;",
"case 'playsound':r={t,a:sA(b.a)};break;",
"case 'music':r={t,a:sA(b.a)};break;",
"case 'musicStop':r={t};break;",
"case 'volume':r={t,p:clamp(b.p,0,100,80)};break;",
"case 'chase':r={t,o:sUid(b.o),n:clamp(b.n,.5,30,6)};break;",
"case 'flee':r={t,o:sUid(b.o),n:clamp(b.n,.5,30,6)};break;",
"case 'orbit':r={t,o:sUid(b.o),n:clamp(b.n,.5,30,4)};break;",
"case 'follow':r={t,o:sUid(b.o),n:clamp(b.n,1,30,4)};break;",
"case 'bounce':r={t,o:sUid(b.o),n:clamp(b.n,.2,10,2)};break;",
"case 'patrol':r={t,o:sUid(b.o),n:clamp(b.n,.2,10,4),x:clamp(b.x,1,60,2)};break;",
"case 'damageNear':r={t,o:sUid(b.o),n:clamp(b.n,1,500,20),x:clamp(b.x,1,40,3)};break;",
"case 'pushAway':r={t,o:sUid(b.o),n:clamp(b.n,1,60,12)};break;",
"case 'despawn':r={t,o:sUid(b.o)};break;",
"case 'resetPos':r={t,o:sUid(b.o)};break;",
"case 'opacity':r={t,o:sUid(b.o),p:clamp(b.p,0,100,100)};break;",
"case 'nameTag':r={t,o:sUid(b.o),m:sStr(b.m,24)};break;",
"case 'labelHide':r={t,o:sUid(b.o)};break;",
"case 'spawnCoin':r={t,o:sUid(b.o),x:clamp(b.x,-60,60,0),y:clamp(b.y,-30,30,0),z:clamp(b.z,-60,60,0)};break;",
"case 'slowPlayer':r={t,p:clamp(b.p,10,100,40),s:clamp(b.s,.2,20,2)};break;",
"case 'jumpBoost':r={t,p:clamp(b.p,100,400,200),s:clamp(b.s,.2,20,3)};break;"
].join('\n  ');
// Drafts: a game can be saved without being published. A draft is invisible to everyone else,
// cannot be opened or joined by another player, and the creator can publish it later.
const DRAFT_F="const f={name:String(b.name||'Untitled')";
const DRAFT_F_NEW="const f={draft:!!b.draft,name:String(b.name||'Untitled')";
const DRAFT_LIST="games:D.games.map(g=>({...g,";
const DRAFT_LIST_NEW="games:D.games.filter(g=>!g.draft).map(g=>({...g,";
const GAME_GET="if(p=='/api/game'){const g=D.games.find(x=>x.id==new URL(req.url,'http://x').searchParams.get('id'));return g?";
const GAME_GET_NEW="if(p=='/api/game'){const g=D.games.find(x=>x.id==new URL(req.url,'http://x').searchParams.get('id'));if(g&&g.draft&&(!me||(g.creator!==me.name&&!me.admin)))return send(res,404,{error:'Not found.'});return g?";
const JOIN_MARK="const gid=String(b.game||'');if(!/^\\w{1,30}$/.test(gid)";
const JOIN_NEW="const gid=String(b.game||'');{const gd=(D.games||[]).find(x=>x.id===gid);if(gd&&gd.draft&&gd.creator!==me.name&&!me.admin)return send(res,403,{error:'That game is not published yet.'});}if(!/^\\w{1,30}$/.test(gid)";
// The 17 "code" blocks: maths on variables, measuring, keys, a stopwatch and a while loop.
const BLOCK_CASES3=[
"case 'whileVar':r={t,c:sCond(b.c),b:sBlocks(b.b,d+1)};break;",
"case 'clampVar':r={t,v:sV(b.v),lo:clamp(b.lo,-9999,9999,0),hi:clamp(b.hi,-9999,9999,10)};break;",
"case 'copyVar':r={t,v:sV(b.v),v2:sV(b.v2)};break;",
"case 'swapVar':r={t,v:sV(b.v),v2:sV(b.v2)};break;",
"case 'roundVar':r={t,v:sV(b.v),step:clamp(b.step,.1,100,1)};break;",
"case 'absVar':r={t,v:sV(b.v)};break;",
"case 'powVar':r={t,v:sV(b.v),x:clamp(b.x,-4,4,2)};break;",
"case 'modVar':r={t,v:sV(b.v),x:clamp(b.x,1,100,2)};break;",
"case 'distVar':r={t,v:sV(b.v),o:sUid(b.o)};break;",
"case 'posVar':r={t,v:sV(b.v),o:sUid(b.o),ax:['x','y','z'].includes(b.ax)?b.ax:'x'};break;",
"case 'angleVar':r={t,v:sV(b.v),o:sUid(b.o)};break;",
"case 'nearCount':r={t,v:sV(b.v),r:clamp(b.r,1,100,10)};break;",
"case 'keyHeld':r={t,v:sV(b.v),k:['space','shift','control','f','e','r'].includes(b.k)?b.k:'space'};break;",
"case 'timerReset':r={t};break;",
"case 'timerVar':r={t,v:sV(b.v)};break;",
"case 'hudMix':r={t,m:sStr(b.m,60),v:sV(b.v)};break;"
].join('\n  ');
const SERVER_MARKS=[
 ["['score','A','B','C']","['score','A','B','C','D','E','F']",'replace-all'],
 ["['A','B','C']","['A','B','C','D','E','F']",'replace-all'],
 ["list.slice(0,80)","list.slice(0,300)",'replace'],
 ["D.plays[gid]=(D.plays[gid]||0)+1;","try{require('./routes.js').noteVisit(D,gid)}catch(e){}",'after'],
 // Uploaded sounds are bigger than any other request, so the body reader gets a bigger ceiling.
 ["if(s.length>400000){no();req.destroy()}","if(s.length>1048576){no();req.destroy()}",'replace'],
 [DRAFT_F,DRAFT_F_NEW,'replace'],
 [DRAFT_LIST,DRAFT_LIST_NEW,'replace'],
 [GAME_GET,GAME_GET_NEW,'replace'],
 [JOIN_MARK,JOIN_NEW,'replace'],
 [UID_OLD,UID_NEW,'replace'],
 ["const sStr=(v,n)=>",BLOCK_ASSET,'before'],
 ["case 'say':r={t,m:sStr(b.m,80)",BLOCK_CASES3,'before'],
 ["case 'say':r={t,m:sStr(b.m,80)",BLOCK_CASES2,'before'],
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
src=src.replace(MARK," if(p=='/api/reports'||p=='/api/daily'||p=='/api/stats'||p=='/api/glike'||p=='/api/comments'||p=='/api/analytics'||p=='/api/drafts'||p.indexOf('/api/asset')===0){return require('./routes.js')({req,res,p,b,me,send,need,D,save,staff,PRICE});}\n"+MARK);
SERVER_MARKS.forEach(([mark,hook,where])=>{
 const out=splice(src,mark,hook,where);
 if(out===null){console.error('boot.js: block sanitizer marker missing ('+mark.slice(0,26)+'), saving without that patch');return}
 src=out;
});
const m=new Module(file,module);
m.filename=file;
m.paths=Module._nodeModulePaths(__dirname);
m._compile(src,file);
