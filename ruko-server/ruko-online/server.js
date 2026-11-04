// Ruko server: accounts, shared hats/games, sales, live game servers. No dependencies.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000,DIR=process.env.DATA_DIR||path.join(__dirname,'data'),FILE=path.join(DIR,'data.json');
fs.mkdirSync(DIR,{recursive:true});
let D={users:{},sessions:{},hats:[],games:[],sales:{},likes:{},shirtImg:{},plays:{},meta:{},friends:{},freq:{},dm:{}};
// Storage: if UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, everything is saved to that free Redis
// database and survives restarts/redeploys. Otherwise it falls back to a local file (lost when the host wipes its disk).
const RURL=(process.env.UPSTASH_REDIS_REST_URL||'').replace(/\/$/,''),RTOK=process.env.UPSTASH_REDIS_REST_TOKEN||'',REDIS=!!(RURL&&RTOK);
let dirty=0,busy=0,last={};const save=()=>{dirty=1};
const views={
 users:()=>Object.entries(D.users).map(([k,v])=>[k,JSON.stringify(v)]),
 sessions:()=>Object.entries(D.sessions),
 hats:()=>D.hats.map(h=>[h.id,JSON.stringify(h)]),
 games:()=>D.games.map(g=>{const{thumb,...r}=g;return[g.id,JSON.stringify(r)]}),
 thumbs:()=>D.games.filter(g=>g.thumb).map(g=>[g.id,g.thumb]),
 sales:()=>Object.entries(D.sales).map(([k,v])=>[k,String(v)]),
 likes:()=>Object.entries(D.likes).map(([k,v])=>[k,JSON.stringify(v)]),
 shirtimgs:()=>Object.entries(D.shirtImg),
 plays:()=>Object.entries(D.plays).map(([k,v])=>[k,String(v)]),
 meta:()=>Object.entries(D.meta).map(([k,v])=>[k,JSON.stringify(v)]),
 friends:()=>Object.entries(D.friends).map(([k,v])=>[k,JSON.stringify(v)]),
 freq:()=>Object.entries(D.freq).map(([k,v])=>[k,JSON.stringify(v)]),
 dm:()=>Object.entries(D.dm).map(([k,v])=>[k,JSON.stringify(v)])};
const rcall=async(path,body)=>{const r=await fetch(RURL+path,{method:'POST',headers:{Authorization:'Bearer '+RTOK,'content-type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error('Redis HTTP '+r.status);return r.json()};
const hall=async c=>{const j=await rcall('',['HGETALL','ruko:'+c]);if(j.error)throw new Error(j.error);const a=j.result||[],o={};for(let i=0;i<a.length;i+=2)o[a[i]]=a[i+1];return o};
async function loadRedis(){
 const[u,s,h,g,t,sa,l,si,pl,mt,fr,fq,dm]=await Promise.all(['users','sessions','hats','games','thumbs','sales','likes','shirtimgs','plays','meta','friends','freq','dm'].map(hall));D.meta=Object.fromEntries(Object.entries(mt).map(([k,v])=>[k,JSON.parse(v)]));D.friends=Object.fromEntries(Object.entries(fr).map(([k,v])=>[k,JSON.parse(v)]));D.freq=Object.fromEntries(Object.entries(fq).map(([k,v])=>[k,JSON.parse(v)]));D.dm=Object.fromEntries(Object.entries(dm).map(([k,v])=>[k,JSON.parse(v)]));D.shirtImg=si;D.plays=Object.fromEntries(Object.entries(pl).map(([k,v])=>[k,+v]));
 D.users=Object.fromEntries(Object.entries(u).map(([k,v])=>[k,JSON.parse(v)]));D.sessions=s;
 D.hats=Object.values(h).map(x=>JSON.parse(x)).sort((a,b)=>(a.at||0)-(b.at||0));
 D.games=Object.values(g).map(x=>JSON.parse(x)).sort((a,b)=>(a.at||0)-(b.at||0));D.games.forEach(x=>{if(t[x.id])x.thumb=t[x.id]});
 D.sales=Object.fromEntries(Object.entries(sa).map(([k,v])=>[k,+v]));D.likes=Object.fromEntries(Object.entries(l).map(([k,v])=>[k,JSON.parse(v)]));
 last={};for(const c in views)last[c]=new Map(views[c]());
 return Object.keys(D.users).length>0}
async function flush(){
 if(!dirty||busy)return;busy=1;dirty=0;
 try{
  if(REDIS){
   const cmds=[],next={};
   for(const c in views){const cur=new Map(views[c]()),prev=last[c]||new Map();for(const[k,v]of cur)if(prev.get(k)!==v)cmds.push(['HSET','ruko:'+c,k,v]);for(const k of prev.keys())if(!cur.has(k))cmds.push(['HDEL','ruko:'+c,k]);next[c]=cur}
   let chunk=[],size=0;const go=async()=>{if(!chunk.length)return;const j=await rcall('/pipeline',chunk);const bad=Array.isArray(j)&&j.find(x=>x&&x.error);if(bad)throw new Error(bad.error);chunk=[];size=0};
   for(const c of cmds){const n=JSON.stringify(c).length;if(size+n>700000)await go();chunk.push(c);size+=n}
   await go();last=next;
  }else{fs.writeFileSync(FILE+'.tmp',JSON.stringify(D));fs.renameSync(FILE+'.tmp',FILE)}
 }catch(e){dirty=1;console.error('Save failed, will retry:',e.message)}
 finally{busy=0}}
setInterval(flush,4000);
process.on('SIGTERM',async()=>{dirty=1;busy=0;try{await flush()}catch(e){}process.exit(0)});
const INDEX=fs.readFileSync(path.join(__dirname,'public','index.html'));
const PRICE={r1:50,r2:120,r3:200,r4:400,r5:30,r6:80};
const rnd=n=>crypto.randomBytes(n).toString('hex');
// The built-in games are ordinary games owned by Ruko (so the owner can edit or delete them). They are created once, and stay deleted if the owner deletes them.
const hsl2hex=(h,s,l)=>{h/=360;s/=100;l/=100;const f=n=>{const k=(n+h*12)%12,a=s*Math.min(l,1-l);return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return '#'+[f(0),f(8),f(4)].map(x=>x.toString(16).padStart(2,'0')).join('')};
const BUILTIN=[{id:'g1',name:'Sky Steps',desc:'Jump up the floating obby to the golden platform.',mode:'obby',sky:'#8fd3ff',ground:'#5bd16a',seed:7,size:18,genre:'Obby'},{id:'g2',name:'Coin Rush',desc:'Grab every coin in the park.',mode:'coins',sky:'#ffd9a0',ground:'#7bc96f',seed:3,size:20,genre:'Adventure'},{id:'g3',name:'Ruko Park',desc:'Free roam. Show off your hats.',mode:'roam',sky:'#b7e3ff',ground:'#9fd3a0',seed:11,size:12,genre:'Chill'}];
function builtinObjs(g){let sd=(+g.seed||1)%2147483646+1;const r=()=>(sd=(sd*16807)%2147483647)/2147483647,o=[{k:'s',x:0,y:0,z:0}],P=(x,y,z,sx,sz,c,t)=>o.push({k:'p',t:t||'solid',x:+x.toFixed(2),y:+y.toFixed(2),z:+z.toFixed(2),sx,sz,th:.5,c});
 if(g.mode=='obby'){P(0,0,0,6,6,g.ground);let x=0,y=0,z=0;const n=Math.max(5,Math.min(40,g.size));for(let i=0;i<n;i++){x+=(r()-.5)*6;y+=.3+r()*.9;z-=4.5+r()*1.5;P(x,y,z,3,3,i==n-1?'#ffd23f':hsl2hex(i*37%360,70,60),i==n-1?'goal':'solid')}}
 else{P(0,0,0,60,60,g.ground);for(let i=0;i<(g.mode=='roam'?12:6);i++){const x=(r()-.5)*40,y=.8+r()*2,z=(r()-.5)*40;P(x,y,z,3,3,hsl2hex(r()*360,60,60))}
  if(g.mode=='coins')for(let i=0;i<25;i++)o.push({k:'c',x:+((r()-.5)*40).toFixed(2),y:+(.9+r()*1.4).toFixed(2),z:+((r()-.5)*40).toFixed(2)})}
 return o}
function seedBuiltins(){const rm=D.meta.__removed||{};let n=0;for(const b of BUILTIN){if(rm[b.id]||D.games.some(g=>g.id==b.id))continue;D.games.push({id:b.id,creator:'Ruko',name:b.name,desc:b.desc,genre:b.genre,mode:'custom',sky:b.sky,ground:b.ground,size:16,seed:1,spd:7,jmp:9,grav:22,coinN:25,cps:false,pvp:false,hp:100,resp:3,weapons:[],startW:[],light:1,fog:true,killY:-15,objs:builtinObjs(b),tv:0,at:0});n++}if(n)save();return n}

// Block code: scripts are plain data (never executed as code on the server or client). Everything is whitelisted and clamped here.
const sStr=(v,n)=>String(v==null?'':v).slice(0,n),sUid=v=>/^[\w-]{1,10}$/.test(String(v))?String(v):'';
const sCond=c=>{c=c||{};const v=['score','A','B','C','y','time','coins','chance'].includes(c.v)?c.v:'score';return{v,o:['>','<','='].includes(c.o)?c.o:'>',n:clamp(c.n,-99999,99999,0)}};
let scBudget=0;
function sBlocks(list,d){if(!Array.isArray(list)||d>5)return[];const out=[];for(const b of list.slice(0,80)){if(!b||scBudget<=0)break;const t=b.t;let r=null;
 switch(t){
  case 'say':r={t,m:sStr(b.m,80),s:clamp(b.s,0,30,2)};break;
  case 'sound':r={t,k:['beep','coin','jump','boom','win','hurt'].includes(b.k)?b.k:'beep'};break;
  case 'wait':r={t,s:clamp(b.s,0,60,1)};break;
  case 'tp':r={t,w:['spawn','obj','pos'].includes(b.w)?b.w:'spawn',o:sUid(b.o),x:clamp(b.x,-300,300,0),y:clamp(b.y,-30,300,0),z:clamp(b.z,-300,300,0)};break;
  case 'respawn':case 'stop':r={t};break;
  case 'win':r={t,m:sStr(b.m,80)};break;
  case 'score':r={t,op:b.op=='set'?'set':'add',n:clamp(b.n,-99999,99999,1)};break;
  case 'var':r={t,v:['A','B','C'].includes(b.v)?b.v:'A',op:b.op=='set'?'set':'add',n:clamp(b.n,-99999,99999,1)};break;
  case 'phys':{const k=['speed','jump','gravity'].includes(b.k)?b.k:'speed',R={speed:[2,40,7],jump:[3,40,9],gravity:[3,80,22]}[k];r={t,k,n:clamp(b.n,R[0],R[1],R[2])};break}
  case 'show':r={t,o:sUid(b.o),on:b.on=='hide'?'hide':'show'};break;
  case 'color':r={t,o:sUid(b.o),c:col(b.c)};break;
  case 'move':r={t,o:sUid(b.o),x:clamp(b.x,-200,200,0),y:clamp(b.y,-200,200,0),z:clamp(b.z,-200,200,0),s:clamp(b.s,0,30,1)};break;
  case 'sky':r={t,c:col(b.c)};break;
  case 'rep':r={t,n:clamp(b.n,1,100,3)|0,b:sBlocks(b.b,d+1)};break;
  case 'forever':r={t,b:sBlocks(b.b,d+1)};break;
  case 'if':r={t,c:sCond(b.c),y:sBlocks(b.y,d+1),n:sBlocks(b.n,d+1)};break}
 if(r){scBudget--;out.push(r)}}return out}
function sScripts(list){scBudget=300;if(!Array.isArray(list))return[];return list.slice(0,40).map(s=>{const h=(s&&s.h)||{},t=h.t;let H=null;
 if(t=='start')H={t};else if(t=='touch')H={t,o:sUid(h.o)};else if(t=='timer')H={t,n:clamp(h.n,.2,300,5)};else if(t=='action')H={t,k:+h.k==2?2:1};else if(t=='score')H={t,n:clamp(h.n,-99999,99999,10)};
 return H?{h:H,b:sBlocks(s.b,0)}:null}).filter(Boolean)}
const bc=(r,o)=>{const m='data: '+JSON.stringify({ev:o})+'\n\n';for(const x of r.cl.values())x.res.write(m)};
const DEFNAME={r1:'Ruko Cap',r2:'Top Hat',r3:'Wizard Hat',r4:'Golden Halo',r5:'Party Cone',r6:'Crate Head'};
// Game visits: when someone joins a server of a game, its creator earns 10 Rukos (once per visitor per game every 10 minutes, never for your own visits).
const vcool=new Map();
const payVisit=(id,me)=>{const gid=id.slice(3).replace(/x\d+$/,''),g=D.games.find(x=>x.id==gid),cname=g?g.creator:(['g1','g2','g3'].includes(gid)?'Ruko':null);if(!cname)return;const cu=D.users[cname.toLowerCase()];if(!cu||cu.name===me.name)return;const key=me.name+'|'+gid,now=Date.now();if(now-(vcool.get(key)||0)<600000)return;vcool.set(key,now);cu.coins+=10;cu.ernVisits=(cu.ernVisits||0)+10;save()};
// Friends and DMs. D.friends[name] = [names]. D.freq[name] = {from: ts} pending requests received. D.dm[convoKey] = [{from,text,t}], convoKey = sorted lowercase names joined by '|'.
const convoKey=(a,b)=>[a.toLowerCase(),b.toLowerCase()].sort().join('|');
const dmlc=new Map();
const staff=u=>!!u&&!!(u.admin||u.mod);
const priceOf=(id,h)=>{const m=D.meta[id];return m&&m.price!=null?m.price:h?h.price:PRICE[id]};
const ammoOf=(r,c)=>{const w=r.pv.wd[c.cw];return w&&w.mag>0?(c.am[c.cw]!=null?c.am[c.cw]:w.mag):-1};
function rayBox3(ox,oy,oz,dx,dz,sl,b){let t0=0,t1=1e9;for(const[o,d,a,z]of[[ox,dx,b.x0,b.x1],[oz,dz,b.z0,b.z1]]){if(Math.abs(d)<1e-9){if(o<a||o>z)return null}else{let s=(a-o)/d,e=(z-o)/d;if(s>e){const q=s;s=e;e=q}t0=Math.max(t0,s);t1=Math.min(t1,e);if(t0>t1)return null}}if(t0<=0)return null;const h0=oy+sl*t0,h1=oy+sl*t1,lo=Math.min(h0,h1),hi=Math.max(h0,h1);return hi<b.y0||lo>b.y1?null:t0}
function rayBox(ox,oy,oz,dx,dz,b){if(oy<b.y0||oy>b.y1)return null;let t0=0,t1=1e9;for(const[o,d,a,z]of[[ox,dx,b.x0,b.x1],[oz,dz,b.z0,b.z1]]){if(Math.abs(d)<1e-9){if(o<a||o>z)return null}else{let s=(a-o)/d,e=(z-o)/d;if(s>e){const q=s;s=e;e=q}t0=Math.max(t0,s);t1=Math.min(t1,e);if(t0>t1)return null}}return t0>0?t0:null}
const pubUser=u=>({name:u.name,coins:u.coins,owned:u.owned,worn:u.worn,av:u.av,admin:!!u.admin,mod:!!u.mod,ernSales:u.ernSales||0,ernVisits:u.ernVisits||0,log:(u.log||[]).slice(-10),bio:u.bio||'',joined:u.joined||0,pend:(u.admin||u.mod)?D.hats.filter(h=>h.status==='pending').length:undefined});
const hashPw=(p,s)=>crypto.scryptSync(p,s,32).toString('hex');
const clamp=(v,a,b,d)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:d));
const col=c=>/^#[0-9a-fA-F]{6}$/.test(c)?c:'#888888';
const av=a=>a&&typeof a=='object'?{skin:col(a.skin),shirt:col(a.shirt),pants:col(a.pants),face:clamp(a.face,0,40,0)|0,tee:typeof a.tee=='string'&&/^[\w-]{1,30}$/.test(a.tee)?a.tee:undefined}:null;
const send=(res,c,o)=>{res.writeHead(c,{'content-type':'application/json'});res.end(JSON.stringify(o))};
const body=req=>new Promise((ok,no)=>{let s='';req.on('data',d=>{s+=d;if(s.length>400000){no();req.destroy()}});req.on('end',()=>ok(s))});
const who=req=>{const t=(req.headers.authorization||'').slice(7)||new URL(req.url,'http://x').searchParams.get('token'),k=D.sessions[t];const u=k&&D.users[k]&&!D.users[k].banned?D.users[k]:null;if(u)seen.set(u.name,Date.now());return u};
const tries={},rooms={},lc=new Map(),seen=new Map(),chat=[];let cid=0;
// Players who were just assigned a server hold a slot for 15 seconds so two people can't be sent to the last free spot.
const resv=new Map();
const roomLoad=(id,name,now)=>{const r=rooms[id];let n=r?r.cl.size:0;const m=resv.get(id);if(m)for(const[k,t]of[...m]){if(t<now)m.delete(k);else if(k!==name&&!(r&&[...r.cl.values()].some(c=>c.name===k)))n++}return n};
const reserve=(id,name,now)=>{if(!resv.has(id))resv.set(id,new Map());resv.get(id).set(name,now+15000)};
// Admin account "Ruko": password comes from the ADMIN_PASSWORD environment variable (never stored in the code).
function seedAdmin(){const AP=process.env.ADMIN_PASSWORD;
if(AP){const old=D.users.ruko||{name:'Ruko',coins:500,owned:['r1'],worn:'r1',av:null,earn:[]},s=old.salt||rnd(16);D.users.ruko=Object.assign(old,{name:'Ruko',admin:true,salt:s,hash:hashPw(AP,s)});save()}
else{if(D.users.ruko)D.users.ruko.admin=false;console.log('ADMIN_PASSWORD not set: the Ruko admin account is disabled.')}}
const room=id=>{if(rooms[id])return rooms[id];const gid=id.slice(3).replace(/x\d+$/,''),gm=D.games.find(x=>x.id==gid),r={cl:new Map(),dirty:0};
 if(gm&&gm.pvp)r.pv={wd:gm.weapons||[],hp:gm.hp||100,resp:gm.resp||3,startW:(gm.startW||[]).filter(i=>gm.weapons&&gm.weapons[i]),objs:gm.objs||[],occ:(gm.objs||[]).filter(o=>o.k=='p'&&!o.mv).map(o=>({x0:o.x-o.sx/2,x1:o.x+o.sx/2,z0:o.z-o.sz/2,z1:o.z+o.sz/2,y0:o.y-(o.th||.5),y1:o.y}))};
 return rooms[id]=r};
const server=http.createServer(async(req,res)=>{
 const p=new URL(req.url,'http://x').pathname;
 if(!p.startsWith('/api/')){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});return res.end(INDEX)}
 let b={};if(req.method=='POST'){try{b=JSON.parse(await body(req)||'{}')}catch(e){return send(res,400,{error:'Bad request'})}}
 const me=who(req),need=()=>send(res,401,{error:'Please log in again.'});
 try{
 if(p=='/api/signup'||p=='/api/login'){
  const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0],now=Date.now();
  tries[ip]=(tries[ip]||[]).filter(t=>t>now-60000);if(tries[ip].length>=10)return send(res,429,{error:'Too many attempts. Wait a minute.'});tries[ip].push(now);
  const name=String(b.name||'').trim(),k=name.toLowerCase(),pw=String(b.pass||'');
  if(p=='/api/signup'){
   if(!/^\w{3,16}$/.test(name))return send(res,400,{error:'Username: 3-16 letters, numbers or underscores.'});
   if(k=='ruko')return send(res,400,{error:'That name is reserved.'});
   if(pw.length<6||pw.length>100)return send(res,400,{error:'Password needs 6+ characters.'});
   if(D.users[k])return send(res,400,{error:'Username taken.'});
   const salt=rnd(16);D.users[k]={name,salt,hash:hashPw(pw,salt),joined:Date.now(),bio:'',coins:500,owned:['r1'],worn:'r1',av:null,earn:[]};
  }else{const x=D.users[k];if(!x||hashPw(pw,x.salt)!==x.hash)return send(res,400,{error:'Wrong username or password.'});if(x.banned)return send(res,403,{error:'This account is banned.'})}
  const t=rnd(24);D.sessions[t]=k;save();return send(res,200,{token:t,me:pubUser(D.users[k])});
 }
 if(p=='/api/me'){if(!me)return need();if(req.method=='POST'){if(b.av){const a=av(b.av);if(a&&a.tee&&!me.owned.includes(a.tee))delete a.tee;me.av=a}if(typeof b.bio=='string')me.bio=b.bio.replace(/\s+/g,' ').trim().slice(0,160);if(b.worn===null||me.owned.includes(b.worn))me.worn=b.worn;save()}return send(res,200,{me:pubUser(me)})}
 if(p=='/api/hats'){
  if(req.method=='GET'){const lk={};for(const id in D.likes)lk[id]=D.likes[id].length;return send(res,200,{hats:D.hats.filter(h=>h.status!=='pending'&&h.status!=='rejected'),mine:me?D.hats.filter(h=>h.creator===me.name&&(h.status==='pending'||h.status==='rejected')):[],sales:D.sales,meta:D.meta,likes:lk,liked:me?Object.keys(D.likes).filter(id=>D.likes[id].includes(me.name)):[]})}
  if(!me)return need();
  if(D.hats.filter(h=>h.creator==me.name).length>=50)return send(res,400,{error:'Hat limit reached (50).'});
  const parts=(Array.isArray(b.parts)?b.parts:[]).slice(0,24).map(q=>({t:['cylinder','cone','dome','sphere','box','torus','pyramid','prism','octa','ico','star','heart','cross','hexagon','spike'].includes(q.t)?q.t:'box',c:col(q.c),f:['matte','shiny','metal','glass','neon'].includes(q.f)?q.f:'matte',sx:clamp(q.sx,.05,3,.5),sy:clamp(q.sy,.05,3,.5),sz:clamp(q.sz,.05,3,.5),x:clamp(q.x,-1.6,1.6,0),y:clamp(q.y,-1.5,2.5,0),z:clamp(q.z,-1.6,1.6,0),r:clamp(q.r,-90,90,0),q:clamp(q.q,-90,90,0),ry:clamp(q.ry,-180,180,0),rep:clamp(q.rep,1,12,1)|0,op:clamp(q.op,.1,1,1),m:!!q.m}));
  if(!parts.length)return send(res,400,{error:'A hat needs at least one part.'});
  const id=/^h[0-9a-z]{6,20}$/.test(b.id)&&!D.hats.some(h=>h.id==b.id)?b.id:'h'+rnd(5);
  D.hats.push({id,name:String(b.name||'Untitled').slice(0,20),creator:me.name,price:clamp(b.price,0,1000,100)|0,parts,slot:['head','face','back'].includes(b.slot)?b.slot:'head',base:0,at:Date.now()});save();return send(res,200,{id});
 }
 if(p.startsWith('/api/thumb/')){const g=D.games.find(x=>x.id==p.slice(11)),m=g&&g.thumb&&/^data:(image\/\w+);base64,(.*)$/.exec(g.thumb);if(!m){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':m[1],'cache-control':'public, max-age=86400'});return res.end(Buffer.from(m[2],'base64'))}
 if(p=='/api/chat'){
  if(!me)return need();
  if(req.method=='GET')return send(res,200,{msgs:chat.slice(-60)});
  if(me.muted)return send(res,403,{error:'You are muted.'});
  const now=Date.now();if(now-(lc.get(me.name)||0)<700)return send(res,429,{error:'Slow down.'});lc.set(me.name,now);
  const text=String(b.text||'').trim().slice(0,200);if(!text)return send(res,400,{error:'Empty message.'});
  chat.push({id:++cid,name:me.name,text,t:now,admin:!!me.admin,mod:!!me.mod});if(chat.length>200)chat.shift();return send(res,200,{ok:1});
 }
 if(p=='/api/like'){
  if(!me)return need();
  const id=String(b.id);if(!(id in PRICE)&&!D.hats.some(h=>h.id==id))return send(res,404,{error:'No such item.'});
  const L=D.likes[id]=D.likes[id]||[],i=L.indexOf(me.name);if(i>=0)L.splice(i,1);else L.push(me.name);save();return send(res,200,{n:L.length,liked:i<0});
 }
 if(p=='/api/mine/delete'){
  if(!me)return need();
  const L=b.kind=='hat'?D.hats:D.games,i=L.findIndex(x=>x.id==b.id);if(i<0)return send(res,404,{error:'Not found.'});
  if(L[i].creator!==me.name&&!me.admin)return send(res,403,{error:'That is not yours.'});
  L.splice(i,1);if(b.kind!='hat'&&BUILTIN.some(x=>x.id==b.id))(D.meta.__removed=D.meta.__removed||{})[b.id]=1;if(b.kind=='hat'){delete D.sales[b.id];delete D.likes[b.id];delete D.shirtImg[b.id];delete D.meta[b.id]}save();return send(res,200,{ok:1});
 }
 if(p=='/api/admin/chatdel'){
  if(!me)return need();if(!staff(me))return send(res,403,{error:'Staff only.'});
  const i=chat.findIndex(m=>m.id==b.id);if(i>=0)chat.splice(i,1);return send(res,200,{ok:1});
 }
 if(p=='/api/profile'){
  if(!me)return need();
  const u=D.users[String(new URL(req.url,'http://x').searchParams.get('name')||'').toLowerCase()];
  if(!u||(u.banned&&!me.admin))return send(res,404,{error:'No such player.'});
  let playing=null;for(const id in rooms)for(const c of rooms[id].cl.values())if(c.name===u.name)playing=id.slice(3);
  return send(res,200,{p:{name:u.name,admin:!!u.admin,mod:!!u.mod,friend:me?(D.friends[me.name]||[]).includes(u.name):false,joined:u.joined||0,bio:u.bio||'',av:u.av,worn:u.worn,owned:u.owned,online:(seen.get(u.name)||0)>Date.now()-120000,playing}});
 }
 if(p=='/api/players'){
  if(!me)return need();
  const q=String(new URL(req.url,'http://x').searchParams.get('q')||'').toLowerCase();
  return send(res,200,{players:Object.values(D.users).filter(u=>!u.banned&&(!q||u.name.toLowerCase().includes(q))).map(u=>({name:u.name,admin:!!u.admin,mod:!!u.mod,online:(seen.get(u.name)||0)>Date.now()-120000})).sort((a,b)=>b.online-a.online||a.name.localeCompare(b.name)).slice(0,30)});
 }
 if(p=='/api/admin/export'){
  if(!me)return need();if(!me.admin)return send(res,403,{error:'Admins only.'});
  return send(res,200,D);
 }
 if(p=='/api/shirts'){
  if(!me)return need();
  const img=String(b.img||'');if(!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(img)||img.length>180000)return send(res,400,{error:'The shirt image is too large or not a valid image.'});
  const mineS=D.hats.filter(h=>h.kind=='shirt'&&h.creator===me.name);
  if(mineS.length>=30)return send(res,400,{error:'Shirt limit reached (30).'});
  if(mineS.filter(h=>h.status=='pending').length>=5)return send(res,400,{error:'You already have 5 shirts waiting for review.'});
  const id='s'+rnd(5),status=me.admin?'approved':'pending';
  D.hats.push({id,kind:'shirt',slot:'shirt',name:String(b.name||'My Shirt').slice(0,20),creator:me.name,price:clamp(b.price,0,1000,50)|0,status,tv:Date.now(),at:Date.now(),base:0});
  D.shirtImg[id]=img;save();return send(res,200,{id,status});
 }
 if(p.startsWith('/api/shirt/')){
  const id=p.slice(11),h=D.hats.find(x=>x.id==id&&x.kind=='shirt'),img=D.shirtImg[id],m=img&&/^data:(image\/\w+);base64,(.*)$/.exec(img);
  if(!h||!m)return send(res,404,{error:'Not found'});
  if(h.status!=='approved'&&!(me&&(me.admin||me.name===h.creator)))return send(res,404,{error:'Not found'});
  res.writeHead(200,{'content-type':m[1],'cache-control':h.status==='approved'?'public, max-age=86400':'private, no-store'});return res.end(Buffer.from(m[2],'base64'));
 }
 if(p=='/api/admin/all'){
  if(!me)return need();if(!staff(me))return send(res,403,{error:'Staff only.'});
  return send(res,200,{hats:D.hats,games:D.games.map(g=>({id:g.id,name:g.name,desc:g.desc,creator:g.creator,genre:g.genre,pvp:!!g.pvp,ht:!!g.thumb,n:g.objs?g.objs.length:0,at:g.at||0})),plays:D.plays,sales:D.sales,likes:Object.fromEntries(Object.entries(D.likes).map(([k,v])=>[k,v.length])),meta:D.meta});
 }
 if(p=='/api/friends'){
  if(!me)return need();
  if(req.method=='GET'){const mine=D.friends[me.name]||[],inc=Object.entries(D.freq[me.name]||{}).map(([n])=>n),out=Object.entries(D.freq).filter(([,v])=>v[me.name]).map(([n])=>n);
   return send(res,200,{friends:mine.map(n=>({name:n,online:(seen.get(n)||0)>Date.now()-120000})),incoming:inc,outgoing:out});}
  const target=String(b.name||'').trim(),tk=target.toLowerCase(),tu=D.users[tk];
  if(!tu||tu.banned||tk===me.name.toLowerCase())return send(res,400,{error:'No such player.'});
  if(b.action=='request'){if((D.friends[me.name]||[]).includes(tu.name))return send(res,400,{error:'Already friends.'});
   if(D.freq[tu.name]&&D.freq[tu.name][me.name])return send(res,400,{error:'Request already sent.'});
   if(D.freq[me.name]&&D.freq[me.name][tu.name]){delete D.freq[me.name][tu.name];(D.friends[me.name]=D.friends[me.name]||[]).push(tu.name);(D.friends[tu.name]=D.friends[tu.name]||[]).push(me.name);save();return send(res,200,{ok:1,matched:1})}
   D.freq[tu.name]=D.freq[tu.name]||{};D.freq[tu.name][me.name]=Date.now();save();return send(res,200,{ok:1});}
  if(b.action=='accept'){if(!D.freq[me.name]||!D.freq[me.name][tu.name])return send(res,400,{error:'No request from that player.'});delete D.freq[me.name][tu.name];
   (D.friends[me.name]=D.friends[me.name]||[]).push(tu.name);(D.friends[tu.name]=D.friends[tu.name]||[]).push(me.name);save();return send(res,200,{ok:1});}
  if(b.action=='decline'){if(D.freq[me.name])delete D.freq[me.name][tu.name];save();return send(res,200,{ok:1});}
  if(b.action=='cancel'){if(D.freq[tu.name])delete D.freq[tu.name][me.name];save();return send(res,200,{ok:1});}
  if(b.action=='remove'){D.friends[me.name]=(D.friends[me.name]||[]).filter(n=>n!==tu.name);D.friends[tu.name]=(D.friends[tu.name]||[]).filter(n=>n!==me.name);save();return send(res,200,{ok:1});}
  return send(res,400,{error:'Unknown action.'});
 }
 if(p=='/api/dm'){
  if(!me)return need();
  if(req.method=='GET'){const other=String(new URL(req.url,'http://x').searchParams.get('with')||'');const ou=D.users[other.toLowerCase()];if(!ou)return send(res,404,{error:'No such player.'});
   const key=convoKey(me.name,ou.name),msgs=(D.dm[key]||[]).slice(-200);return send(res,200,{msgs,withName:ou.name});}
  const other=String(b.to||''),ou=D.users[other.toLowerCase()];
  if(!ou||ou.banned)return send(res,404,{error:'No such player.'});
  if(ou.name===me.name)return send(res,400,{error:"You can't message yourself."});
  if(!me.admin&&!(D.friends[me.name]||[]).includes(ou.name))return send(res,403,{error:'You can only message friends.'});
  if(me.muted)return send(res,403,{error:'You are muted.'});
  const now=Date.now();if(now-(dmlc.get(me.name)||0)<500)return send(res,429,{error:'Slow down.'});dmlc.set(me.name,now);
  const text=String(b.text||'').trim().slice(0,500);if(!text)return send(res,400,{error:'Empty message.'});
  const key=convoKey(me.name,ou.name);(D.dm[key]=D.dm[key]||[]).push({from:me.name,text,t:now});if(D.dm[key].length>200)D.dm[key].shift();save();return send(res,200,{ok:1});
 }
 if(p=='/api/conversations'){
  if(!me)return need();const names=new Set();Object.keys(D.dm).forEach(k=>{const[a,b2]=k.split('|');if(a===me.name.toLowerCase())names.add(b2);else if(b2===me.name.toLowerCase())names.add(a)});
  const list=[...names].map(n=>{const u=D.users[n];if(!u)return null;const key=convoKey(me.name,u.name),msgs=D.dm[key]||[],last=msgs[msgs.length-1];return{name:u.name,last:last?last.text:'',t:last?last.t:0,online:(seen.get(u.name)||0)>Date.now()-120000}}).filter(Boolean).sort((a,b)=>b.t-a.t);
  return send(res,200,{convos:list});
 }
 if(p=='/api/admin/pending'){
  if(!me)return need();if(!staff(me))return send(res,403,{error:'Staff only.'});
  return send(res,200,{items:D.hats.filter(h=>h.status==='pending')});
 }
 if(p=='/api/admin/review'){
  if(!me)return need();if(!staff(me))return send(res,403,{error:'Staff only.'});
  const h=D.hats.find(x=>x.id==b.id&&x.kind=='shirt');if(!h)return send(res,404,{error:'Not found.'});
  h.status=b.approve?'approved':'rejected';h.at=Date.now();if(!b.approve)h.note=String(b.note||'').slice(0,80);save();return send(res,200,{ok:1});
 }
 if(p=='/api/game'){const g=D.games.find(x=>x.id==new URL(req.url,'http://x').searchParams.get('id'));return g?send(res,200,{game:{...g,thumb:undefined}}):send(res,404,{error:'Not found.'})}
 if(p=='/api/games'){
  if(req.method=='GET')return send(res,200,{games:D.games.map(g=>({...g,objs:undefined,scripts:undefined,thumb:undefined,ht:!!g.thumb,n:g.objs?g.objs.length:0,sc:g.scripts?g.scripts.length:0})),plays:D.plays});
  if(!me)return need();
  const objs=Array.isArray(b.objs)?b.objs.slice(0,300).map(o=>{const k=['p','c','s','d','w'].includes(o&&o.k)?o.k:null;if(!k)return null;const r={k,x:clamp(o.x,-200,200,0),y:clamp(o.y,-20,200,0),z:clamp(o.z,-200,200,0)};
   if(k=='p'){r.t=['solid','lava','bounce','check','goal','crumble'].includes(o.t)?o.t:'solid';r.sx=clamp(o.sx,.5,200,3);r.sz=clamp(o.sz,.5,200,3);r.th=clamp(o.th,.25,40,.5);r.c=col(o.c);if(o.mv&&['x','y','z'].includes(o.mv.a))r.mv={a:o.mv.a,d:clamp(o.mv.d,0,30,4),s:clamp(o.mv.s,.1,6,1)}}
   if(k=='d'){r.shape=['box','sphere','cone','cylinder','pyramid','prism'].includes(o.shape)?o.shape:'box';r.sx=clamp(o.sx,.1,40,2);r.sy=clamp(o.sy,.1,40,2);r.sz=clamp(o.sz,.1,40,2);r.c=col(o.c)}
   if(k=='w')r.wi=clamp(o.wi,0,5,0)|0;if(typeof o.nm=='string'&&o.nm)r.nm=o.nm.slice(0,16);if(typeof o.u=='string'&&/^[\w-]{1,10}$/.test(o.u))r.u=o.u;return r}).filter(Boolean):null;
  if(objs&&!objs.some(o=>o.k=='p'))return send(res,400,{error:'Add at least one platform.'});
  let th=null;if(typeof b.thumb=='string'){if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(b.thumb)||b.thumb.length>90000)return send(res,400,{error:'Thumbnail must be a small image.'});th=b.thumb}
  const ex=b.update?D.games.find(g=>g.id==b.id):null;
  if(ex&&ex.creator!==me.name&&!me.admin)return send(res,403,{error:'That is not your game.'});
  if(!ex&&D.games.filter(g=>g.creator==me.name).length>=30)return send(res,400,{error:'Game limit reached (30).'});
  const W=Array.isArray(b.weapons)?b.weapons.slice(0,6).map(w=>({n:String(w.n||'Weapon').slice(0,16),t:w.t=='melee'?'melee':'gun',dmg:clamp(w.dmg,1,100,15),cd:clamp(w.cd,.1,3,.4),rng:clamp(w.rng,2,200,w.t=='melee'?4.5:80),pel:clamp(w.pel,1,8,1)|0,spr:clamp(w.spr,0,20,0),m:['blade','knife','hammer','pistol','smg','rifle','shotgun','sniper'].includes(w.m)?w.m:(w.t=='melee'?'blade':'pistol'),mag:clamp(w.mag,0,100,0)|0,rel:clamp(w.rel,.5,5,1.5),auto:w.auto!==false,c:col(w.c)})):[];
  const SW=Array.isArray(b.startW)?b.startW.map(i=>i|0).filter((i,n,a)=>i>=0&&i<W.length&&a.indexOf(i)==n).slice(0,3):[];
  const f={name:String(b.name||'Untitled').slice(0,24),desc:String(b.desc||'').slice(0,80),genre:['Obby','Adventure','Parkour','Chill','Puzzle'].includes(b.genre)?b.genre:'Obby',mode:['obby','coins','roam','custom'].includes(b.mode)?b.mode:'obby',sky:col(b.sky),ground:col(b.ground),size:clamp(b.size,5,40,16)|0,seed:clamp(b.seed,1,999999,1)|0,spd:clamp(b.spd,4,14,7),jmp:clamp(b.jmp,6,16,9),grav:clamp(b.grav,10,40,22),coinN:clamp(b.coinN,5,60,25)|0,cps:!!b.cps,scripts:sScripts(b.scripts),pvp:!!b.pvp&&W.length>0,hp:clamp(b.hp,20,500,100)|0,resp:clamp(b.resp,1,15,3),weapons:W,startW:SW,light:clamp(b.light,.3,1.6,1),fog:b.fog!==false,killY:clamp(b.killY,-80,-5,-15),objs};
  if(ex){Object.assign(ex,f);if(th){ex.thumb=th;ex.tv=Date.now()}else if(b.dropThumb){delete ex.thumb;ex.tv=0}save();return send(res,200,{id:ex.id})}
  const id=/^c\d{10,14}$/.test(b.id)&&!D.games.some(g=>g.id==b.id)?b.id:'c'+Date.now()+rnd(1).replace(/\D/g,'');
  D.games.push({id,creator:me.name,...f,thumb:th||undefined,tv:th?Date.now():0,at:Date.now()});save();return send(res,200,{id});
 }
 if(p=='/api/buy'){
  if(!me)return need();
  const id=String(b.id),h=D.hats.find(x=>x.id==id),price=priceOf(id,h);
  if(price==null||(h&&h.status&&h.status!=='approved'))return send(res,404,{error:'No such hat.'});
  if(D.meta[id]&&D.meta[id].off)return send(res,400,{error:'This item is off sale.'});
  if(me.owned.includes(id))return send(res,400,{error:'You already own this.'});
  if(me.coins<price)return send(res,400,{error:'Not enough Rukos.'});
  me.coins-=price;me.owned.push(id);D.sales[id]=(D.sales[id]||0)+1;
  {const c=D.users[(h?h.creator:'Ruko').toLowerCase()],cut=Math.floor(price*0.5);if(c&&c!==me&&cut>0){c.coins+=cut;c.ernSales=(c.ernSales||0)+cut;(c.log=c.log||[]).push({t:Date.now(),n:cut,w:h?h.name:(DEFNAME[id]||id),by:me.name});if(c.log.length>30)c.log.shift()}}
  save();return send(res,200,{me:pubUser(me)});
 }
 if(p=='/api/earn'){
  if(!me)return need();
  const now=Date.now(),n=clamp(b.n,0,150,0)|0;me.earn=(me.earn||[]).filter(e=>e[0]>now-600000);
  const g=Math.max(0,Math.min(n,400-me.earn.reduce((a,e)=>a+e[1],0)));
  if(g){/* coins collected inside games no longer count toward the account balance */}return send(res,200,{me:pubUser(me)});
 }
 if(p=='/api/admin/restore'){
  if(!me)return need();if(!me.admin)return send(res,403,{error:'Admins only.'});
  delete D.meta.__removed;const n=seedBuiltins();save();return send(res,200,{ok:1,restored:n});
 }
 if(p=='/api/admin/item'){
  if(!me)return need();if(!staff(me))return send(res,403,{error:'Staff only.'});
  const id=String(b.id),h=D.hats.find(x=>x.id==id);if(!h&&!(id in PRICE))return send(res,404,{error:'No such item.'});
  if((b.special!=null||b.price!=null)&&!me.admin)return send(res,403,{error:'Only the owner can change Special or price.'});
  const m=D.meta[id]=D.meta[id]||{};
  if(b.off!=null)m.off=!!b.off;
  if(b.special!=null)m.special=!!b.special;
  if(b.price!=null){const pr=clamp(b.price,0,100000,0)|0;if(pr==(h?h.price:PRICE[id]))delete m.price;else m.price=pr}
  if(b.name!=null&&h&&String(b.name).trim())h.name=String(b.name).trim().slice(0,20);
  if(!m.off&&!m.special&&m.price==null)delete D.meta[id];
  save();return send(res,200,{ok:1});
 }
 if(p=='/api/admin/hat'||p=='/api/admin/game'){
  if(!me)return need();if(!staff(me))return send(res,403,{error:'Staff only.'});
  const hat=p.endsWith('hat'),L=hat?D.hats:D.games,i=L.findIndex(x=>x.id==b.id);if(i<0)return send(res,404,{error:'Not found.'});
  if(b.action=='delete'){if(!me.admin)return send(res,403,{error:'Only the owner can delete.'});L.splice(i,1);if(hat){delete D.sales[b.id];delete D.shirtImg[b.id];delete D.meta[b.id]}if(!hat&&BUILTIN.some(x=>x.id==b.id))(D.meta.__removed=D.meta.__removed||{})[b.id]=1}
  else if(b.action=='edit'){const x=L[i];if(b.name)x.name=String(b.name).slice(0,hat?20:24);if(hat){if(me.admin)x.price=clamp(b.price,0,1000,x.price)|0}else if(typeof b.desc=='string')x.desc=b.desc.slice(0,80);if(!hat&&b.dropThumb){delete x.thumb;x.tv=0}}
  save();return send(res,200,{ok:1});
 }
 if(p=='/api/admin/users'){
  if(!me)return need();if(!staff(me))return send(res,403,{error:'Staff only.'});
  return send(res,200,{users:Object.values(D.users).map(u=>({name:u.name,coins:u.coins,owned:u.owned.length,banned:!!u.banned,muted:!!u.muted,admin:!!u.admin,mod:!!u.mod,joined:u.joined||0,online:(seen.get(u.name)||0)>Date.now()-120000}))});
 }
 if(p=='/api/admin/grant'){
  if(!me)return need();if(!staff(me))return send(res,403,{error:'Staff only.'});
  const OWN=!!me.admin;
  if((b.all||b.coins!=null||b.hat||b.ban!=null||b.mod!=null)&&!OWN)return send(res,403,{error:'Only the owner can do that.'});
  if(b.all){const n=clamp(b.coins,-1e6,1e6,0)|0;for(const u of Object.values(D.users))u.coins=Math.max(0,u.coins+n);save();return send(res,200,{ok:1})}
  const u=D.users[String(b.user||'').toLowerCase()];if(!u)return send(res,404,{error:'No such player.'});
  if(b.coins!=null)u.coins=Math.max(0,u.coins+(clamp(b.coins,-1e6,1e6,0)|0));
  if(b.hat){const id=String(b.hat);if(!(id in PRICE)&&!D.hats.some(h=>h.id==id))return send(res,404,{error:'No such item.'});const i=u.owned.indexOf(id);if(b.take){if(i>=0)u.owned.splice(i,1);if(u.worn==id)u.worn=null}else if(i<0)u.owned.push(id)}
  if(b.ban!=null&&!u.admin)u.banned=!!b.ban;
  if(b.mute!=null&&!u.admin&&(OWN||!u.mod))u.muted=!!b.mute;
  if(b.mod!=null&&!u.admin)u.mod=!!b.mod;
  save();return send(res,200,{ok:1});
 }
 if(p=='/api/servers/assign'){
  if(!me)return need();
  const gid=String(b.game||'');if(!/^\w{1,30}$/.test(gid)||(!D.games.some(g=>g.id==gid)&&!['g1','g2','g3'].includes(gid)))return send(res,404,{error:'No such game.'});
  const now=Date.now();
  for(let n=1;n<=50;n++){const id='srv'+gid+'x'+n;if(roomLoad(id,me.name,now)<10){reserve(id,me.name,now);D.plays[gid]=(D.plays[gid]||0)+1;save();return send(res,200,{server:gid+'x'+n})}}
  return send(res,503,{error:'All servers are full right now. Try again soon.'});
 }
 if(p=='/api/servers'){const players=[];for(const id in rooms)for(const c of rooms[id].cl.values())players.push({server:id.slice(3),name:c.name});return send(res,200,{players})}
 if(p.startsWith('/api/room/')){
  if(!me)return need();
  const id=decodeURIComponent(p.split('/')[3]||'');if(!/^srv\w{1,40}$/.test(id))return send(res,400,{error:'Bad room'});
  if(p.endsWith('/stream')){
   const r=room(id);if(roomLoad(id,me.name,Date.now())>=10)return send(res,409,{error:'Server full'});
   const peer=rnd(6);if(resv.get(id))resv.get(id).delete(me.name);payVisit(id,me);res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache','x-accel-buffering':'no'});
   res.write('retry: 3000\n\n');r.cl.set(peer,{res,name:me.name,presence:null,hp:r.pv?r.pv.hp:0,k:0,d:0,own:r.pv?[...r.pv.startW]:[],cw:r.pv&&r.pv.startW.length?r.pv.startW[0]:-1,dead:0,inv:Date.now()+2000,lf:0,rt:0,am:{},rl:0,rw:-1});res.write('data: '+JSON.stringify({hello:peer})+'\n\n');r.dirty=1;
   req.on('close',()=>{r.cl.delete(peer);r.dirty=1;if(!r.cl.size&&rooms[id]===r)delete rooms[id]});return;
  }
  if(p.endsWith('/fire')||p.endsWith('/pick')||p.endsWith('/sw')||p.endsWith('/reload')){
   const r=rooms[id],c=r&&r.cl.get(String(b.peer));if(!c||c.name!==me.name||!r.pv)return send(res,404,{});
   const pv=r.pv,now=Date.now(),ps=c.presence;
   if(p.endsWith('/sw')){const i=b.i|0;if(c.own.includes(i)){c.cw=i;c.rl=0;r.dirty=1}return send(res,200,{ok:1})}
   if(p.endsWith('/reload')){const w=pv.wd[c.cw];if(w&&w.mag>0&&!c.rl&&!c.dead&&(c.am[c.cw]!=null?c.am[c.cw]:w.mag)<w.mag){c.rl=now+w.rel*1000;c.rw=c.cw;r.dirty=1}return send(res,200,{ok:1})}
   if(p.endsWith('/pick')){const o=pv.objs[b.i|0];if(o&&o.k=='w'&&pv.wd[o.wi]&&ps&&Math.hypot(o.x-ps.x,o.z-ps.z)<3.5&&Math.abs(o.y-ps.y)<4&&!c.dead){if(!c.own.includes(o.wi))c.own.push(o.wi);c.cw=o.wi;r.dirty=1}return send(res,200,{ok:1})}
   const wd=pv.wd[c.cw];if(c.dead||!wd||!ps)return send(res,200,{ok:0});
   if(c.rl&&now<c.rl)return send(res,200,{ok:0});
   if(now-c.lf<wd.cd*1000-120)return send(res,200,{ok:0});c.lf=now;
   if(wd.mag>0){const cur=c.am[c.cw]!=null?c.am[c.cw]:wd.mag;if(cur<=0){c.rl=now+wd.rel*1000;c.rw=c.cw;r.dirty=1;return send(res,200,{ok:0})}c.am[c.cw]=cur-1;if(cur-1<=0){c.rl=now+wd.rel*1000;c.rw=c.cw}r.dirty=1}
   let dx=+b.dx||0,dz=+b.dz||0;const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;const sl0=Math.max(-3,Math.min(3,+b.s||0));
   const oy=ps.y+1.6,dmg=new Map(),fx=[],targets=[...r.cl].filter(([k,v])=>v!==c&&!v.dead&&v.presence&&v.inv<=now);
   if(wd.t=='melee'){
    for(const[k,v]of targets){const vx=v.presence.x-ps.x,vz=v.presence.z-ps.z,dist=Math.hypot(vx,vz);if(dist<=wd.rng&&(dist<.4||(vx*dx+vz*dz)/dist>.25)&&Math.abs(v.presence.y-ps.y)<3)dmg.set(k,(dmg.get(k)||0)+wd.dmg)}
   }else for(let n=0;n<wd.pel;n++){
    let ax=dx,az=dz,sl=sl0;if(wd.spr){sl+=(Math.random()-.5)*wd.spr*Math.PI/180;const a=(Math.random()-.5)*wd.spr*Math.PI/180;ax=dx*Math.cos(a)-dz*Math.sin(a);az=dx*Math.sin(a)+dz*Math.cos(a)}
    let bt=wd.rng;for(const o of pv.occ){const t=rayBox3(ps.x,oy,ps.z,ax,az,sl,o);if(t!=null&&t<bt)bt=t}
    let best=null;for(const[k,v]of targets){const vx=v.presence.x-ps.x,vz=v.presence.z-ps.z,t=vx*ax+vz*az;if(t>0&&t<bt&&Math.abs(vx*az-vz*ax)<.9&&(oy+sl*t)>=v.presence.y-.3&&(oy+sl*t)<=v.presence.y+3.5){best=k;bt=t}}
    if(best)dmg.set(best,(dmg.get(best)||0)+wd.dmg);
    fx.push({f:[+ps.x.toFixed(1),+oy.toFixed(1),+ps.z.toFixed(1)],t:[+(ps.x+ax*bt).toFixed(1),+(oy+sl*bt).toFixed(1),+(ps.z+az*bt).toFixed(1)]});
   }
   if(fx.length)bc(r,{t:'fx',peer:String(b.peer),w:fx});
   for(const[k,d]of dmg){const v=r.cl.get(k);v.hp-=d;bc(r,{t:'hit',target:k,by:String(b.peer)});
    if(v.hp<=0){v.hp=0;v.dead=1;v.rt=now+pv.resp*1000;v.d++;c.k++;v.own=[];v.cw=-1;v.am={};v.rl=0;bc(r,{t:'kill',by:String(b.peer),target:k,bn:c.name,tn:v.name})}}
   r.dirty=1;return send(res,200,{ok:1});
  }
  if(p.endsWith('/chat')){
   const r=rooms[id],c=r&&r.cl.get(String(b.peer));if(!c||c.name!==me.name)return send(res,404,{});
   if(me.muted)return send(res,403,{error:'You are muted.'});
   const now=Date.now();if(now-(lc.get(me.name)||0)<700)return send(res,429,{error:'Slow down.'});lc.set(me.name,now);
   const text=String(b.text||'').trim().slice(0,160);if(!text)return send(res,400,{error:'Empty message.'});
   const m='data: '+JSON.stringify({chat:{peer:b.peer,name:me.name,text}})+'\n\n';for(const x of r.cl.values())x.res.write(m);return send(res,200,{ok:1});
  }
  if(p.endsWith('/pos')){
   const r=rooms[id],c=r&&r.cl.get(String(b.peer));if(!c||c.name!==me.name)return send(res,404,{});
   const q=b.presence||{},ps={};for(const k of ['x','y','z','r'])ps[k]=clamp(q[k],-500,500,0);
   ps.hat=typeof q.hat=='string'?q.hat.slice(0,30):null;ps.av=av(q.av);c.presence=ps;r.dirty=1;return send(res,200,{ok:1});
  }
 }
 send(res,404,{error:'Not found'});
 }catch(e){console.error(e);send(res,500,{error:'Server error'})}
});
setInterval(()=>{for(const id in rooms){const r=rooms[id];if(r.pv){const now=Date.now();for(const c of r.cl.values()){if(c.rl&&now>=c.rl){const w=r.pv.wd[c.rw];if(w)c.am[c.rw]=w.mag;c.rl=0;r.dirty=1}if(c.dead&&now>=c.rt){c.dead=0;c.hp=r.pv.hp;c.own=[...r.pv.startW];c.cw=c.own.length?c.own[0]:-1;c.am={};c.rl=0;c.inv=now+2000;r.dirty=1}}}if(!r.dirty)continue;r.dirty=0;const m='data: '+JSON.stringify({peers:[...r.cl].map(([peer,c])=>({peer,name:c.name,presence:c.presence||{},...(r.pv?{hp:c.hp,mx:r.pv.hp,k:c.k,d:c.d,w:c.cw,own:c.own,dead:c.dead,am:ammoOf(r,c),rl:c.rl>0?1:0}:{})}))})+'\n\n';for(const c of r.cl.values())c.res.write(m)}},100);
setInterval(()=>{for(const r of Object.values(rooms))for(const c of r.cl.values())c.res.write(': ping\n\n')},15000);

(async()=>{
 let fileData=null;try{fileData=JSON.parse(fs.readFileSync(FILE,'utf8'))}catch(e){}
 if(REDIS){
  let had=false;try{had=await loadRedis()}catch(e){console.error('Could not read from Redis. Not starting, so no data gets overwritten:',e.message);process.exit(1)}
  if(!had&&fileData){Object.assign(D,fileData);D.likes=D.likes||{};dirty=1;console.log('Redis was empty: copying the local data file into it.')}
  else console.log(had?'Loaded all data from Redis.':'Redis is empty: starting fresh.');
 }else{if(fileData)Object.assign(D,fileData);console.log('No Redis configured: saving to a local file (lost if the host resets its disk).')}
 seedAdmin();seedBuiltins();server.listen(PORT,()=>console.log('Ruko running on port '+PORT));
})();
