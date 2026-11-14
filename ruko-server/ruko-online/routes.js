// Reports, the daily login bonus, creator stats, game likes, comments and analytics.
// boot.js hooks this module into the game server's own request handler, so it can use the
// server's live data store, user records and helpers without server.js itself being edited.
const DAY=864e5,MAXREASON=300,MAXREPORTS=500,MAXOPEN=10;
const MAXCOMMENT=300,MAXPERITEM=60,MAXTEXT=60;
const dayOf=ms=>new Date(ms).toISOString().slice(0,10);
const today=()=>dayOf(Date.now()),yesterday=()=>dayOf(Date.now()-DAY);
const rewardFor=n=>10+5*(Math.min(Math.max(n,1),7)-1);
const likesOf=(D,id)=>((D.likes||{})[id]||[]).length;
const playsOf=(D,id)=>((D.plays||{})[id]|0);
const clean=s=>String(s==null?'':s).replace(/\s+/g,' ').trim();

// Visits per game per day, so creators can see the last week. Called from the server's own
// play counter (boot.js splices a call there); the very next save() stores it.
function noteVisit(D,gid){
 if(!D||!gid)return;
 const vis=D.meta.visits=D.meta.visits||{},g=vis[gid]=vis[gid]||{};
 const d=today();
 g[d]=(g[d]|0)+1;
 const cutoff=dayOf(Date.now()-29*DAY);
 for(const k in g)if(k<cutoff)delete g[k];
}

function dailyStatus(D,me){
 const cfg=D.meta.streak||{},s=me.streak||{last:'',n:0},t=today();
 const claimed=s.last===t,cont=s.last===yesterday();
 const day=claimed?(s.n||1):(cont?(s.n||0)+1:1);
 const item=cfg.item?(D.hats||[]).find(h=>h.id===cfg.item):null;
 return {canClaim:!claimed,day,streak:claimed?(s.n||1):(cont?(s.n||0):0),reward:rewardFor(day),
  item:item?{id:item.id,name:item.name}:null,itemDay:5,coins:(me.coins|0),
  time:Date.now()};
}

function reports(c){
 const {req,res,p,b,me,send,need,D,save,staff}=c;
 if(!me)return need();
 if(req.method!=='POST'){
  if(!staff(me))return send(res,403,{error:'Staff only.'});
  const all=(D.meta.reports||[]).slice().reverse().slice(0,200).map(r=>({id:r.id,kind:r.kind,name:r.name,item:r.item,creator:r.creator,reason:r.reason,by:r.by,at:r.at,done:!!r.done,by2:r.by2||'',at2:r.at2||0}));
  return send(res,200,{reports:all,open:all.filter(r=>!r.done).length});
 }
 const action=String(b.action||'');
 const all=D.meta.reports=D.meta.reports||[];
 if(action=='resolve'){
  if(!staff(me))return send(res,403,{error:'Staff only.'});
  const r=all.find(x=>x.id===String(b.id||''));
  if(!r)return send(res,404,{error:'That report is gone.'});
  r.done=true;r.by2=me.name;r.at2=Date.now();save();
  return send(res,200,{ok:1,open:all.filter(x=>!x.done).length});
 }
 if(action=='reopen'){
  if(!staff(me))return send(res,403,{error:'Staff only.'});
  const r=all.find(x=>x.id===String(b.id||''));
  if(!r)return send(res,404,{error:'That report is gone.'});
  r.done=false;r.by2='';r.at2=0;save();
  return send(res,200,{ok:1,open:all.filter(x=>!x.done).length});
 }
 const kind=b.kind==='game'?'game':'item';
 const id=String(b.id||'').slice(0,60);
 const reason=String(b.reason||'').replace(/\s+/g,' ').trim().slice(0,MAXREASON);
 if(!id)return send(res,400,{error:'Nothing to report.'});
 if(reason.length<4)return send(res,400,{error:'Say what is wrong, in a few words.'});
 let name=id,creator='';
 if(kind==='game'){
  const g=(D.games||[]).find(x=>x.id===id);
  if(!g)return send(res,404,{error:'That game is not in Ruko anymore.'});
  name=g.name;creator=g.creator||'';
 }else{
  const h=(D.hats||[]).find(x=>x.id===id);
  if(!h)return send(res,404,{error:'That item is not in Ruko anymore.'});
  name=h.name;creator=h.creator||'';
 }
 const open=all.filter(r=>!r.done);
 if(open.some(r=>r.by===me.name&&r.kind===kind&&r.item===id))return send(res,400,{error:'You already reported this. Staff will take a look.'});
 if(open.filter(r=>r.by===me.name).length>=MAXOPEN)return send(res,429,{error:'You have plenty of reports in review. Give staff a moment.'});
 all.push({id:'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),kind,item:id,name,creator,reason,by:me.name,at:Date.now(),done:false});
 if(all.length>MAXREPORTS)D.meta.reports=all.slice(-MAXREPORTS);
 save();
 return send(res,200,{ok:1,name});
}

function daily(c){
 const {req,res,b,me,send,need,D,save}=c;
 if(!me)return need();
 if(req.method!=='POST')return send(res,200,dailyStatus(D,me));
 const action=String(b.action||'claim');
 if(action==='set'){
  if(!me.admin)return send(res,403,{error:'Only the Ruko account can change the day 5 reward.'});
  const id=String(b.item||'');
  if(id&&!(D.hats||[]).some(h=>h.id===id))return send(res,404,{error:'Pick an item from the catalog.'});
  D.meta.streak={item:id,at:Date.now(),by:me.name};save();
  return send(res,200,{ok:1,item:id});
 }
 if(action!=='claim')return send(res,400,{error:'Unknown action.'});
 const s=me.streak=me.streak||{last:'',n:0};
 if(s.last===today())return send(res,400,{error:'You already collected today. Come back tomorrow.'});
 s.n=s.last===yesterday()?(s.n||0)+1:1;
 s.last=today();
 const reward=rewardFor(s.n);
 me.coins=Math.max(0,(me.coins|0)+reward);
 let item=null;
 const cfg=D.meta.streak||{};
 if(s.n%5===0&&cfg.item){
  const h=(D.hats||[]).find(x=>x.id===cfg.item);
  if(h){if((me.owned||[]).indexOf(h.id)<0)(me.owned=me.owned||[]).push(h.id);item={id:h.id,name:h.name};}
 }
 save();
 return send(res,200,{ok:1,day:s.n,reward,coins:me.coins,total:me.coins,item,status:dailyStatus(D,me)});
}

// Every game's likes and plays, plus running totals for each creator (their games' likes and
// plays, and the likes their catalog items collected). Small enough to fetch in one go.
function stats(c){
 const {req,res,me,send,D,PRICE}=c;
 const comments=D.meta.comments||{};
 const gs={},users={};
 const bucket=n=>(users[n]=users[n]||{visits:0,likes:0,games:0,itemLikes:0,sales:0});
 for(const g of D.games||[]){
  const lk=likesOf(D,g.id),pl=playsOf(D,g.id),cm=(comments['game:'+g.id]||[]).length;
  gs[g.id]={likes:lk,plays:pl,comments:cm};
  const u=bucket(g.creator||'Ruko');
  u.games++;u.visits+=pl;u.likes+=lk;
 }
 const items={};
 for(const id in (PRICE||{}))items[id]={id,creator:'Ruko'};
 for(const h of D.hats||[])items[h.id]={id:h.id,creator:h.creator||'Ruko'};
 for(const id in items){
  const lk=likesOf(D,id),sales=Math.max(0,(D.sales||{})[id]|0);
  const u=bucket(items[id].creator);
  u.itemLikes+=lk;u.likes+=lk;u.sales+=sales;
 }
 const liked=me?Object.keys(gs).filter(id=>((D.likes||{})[id]||[]).includes(me.name)):[];
 return send(res,200,{games:gs,users,liked});
}

function glike(c){
 const {req,res,b,me,send,need,D,save}=c;
 if(!me)return need();
 if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
 const id=String(b.id||'');
 const g=(D.games||[]).find(x=>x.id===id)||['g1','g2','g3'].map(x=>({id:x})).find(x=>x.id===id);
 if(!g)return send(res,404,{error:'No such game.'});
 const L=D.likes[id]=D.likes[id]||[],i=L.indexOf(me.name);
 if(i>=0)L.splice(i,1);else L.push(me.name);
 save();
 return send(res,200,{n:L.length,liked:i<0});
}

function comments(c){
 const {req,res,b,me,send,need,D,save,staff,PRICE}=c;
 if(!me)return need();
 if(req.method!=='POST'){
  const q=new URL(req.url,'http://x').searchParams;
  const kind=q.get('kind')==='game'?'game':'item',id=String(q.get('id')||'').slice(0,60);
  const list=((D.meta.comments||{})[kind+':'+id]||[]);
  return send(res,200,{kind,id,count:list.length,list:list.slice(-40).map(m=>({id:m.id,by:m.by,text:m.text,at:m.at,mine:m.by===me.name,staff:!!staff(me)}))});
 }
 const kind=b.kind==='game'?'game':'item';
 const id=String(b.id||'').slice(0,60);
 if(!id)return send(res,400,{error:'Nothing to comment on.'});
 const okTarget=kind==='game'?(D.games||[]).some(g=>g.id===id):((D.hats||[]).some(h=>h.id===id)||!!(PRICE&&id in PRICE));
 if(!okTarget)return send(res,404,{error:'That is not in Ruko anymore.'});
 const store=D.meta.comments=D.meta.comments||{};
 const key=kind+':'+id;
 const list=store[key]=store[key]||[];
 if(b.del){
  const i=list.findIndex(m=>m.id===String(b.del));
  if(i<0)return send(res,404,{error:'That comment is gone.'});
  if(list[i].by!==me.name&&!staff(me))return send(res,403,{error:'That is not your comment.'});
  list.splice(i,1);save();
  return send(res,200,{ok:1,count:list.length,list:list.slice(-40).map(m=>({id:m.id,by:m.by,text:m.text,at:m.at,mine:m.by===me.name,staff:!!staff(me)}))});
 }
 if(me.muted)return send(res,403,{error:'You are muted.'});
 const now=Date.now();
 if(now-(me.lastComment||0)<2500)return send(res,429,{error:'One comment at a time, please.'});
 const text=clean(b.text).slice(0,MAXCOMMENT);
 if(text.length<1)return send(res,400,{error:'Write something first.'});
 if(list.length>=MAXPERITEM)list.shift();
 const m={id:'m'+now.toString(36)+Math.random().toString(36).slice(2,6),by:me.name,text,at:now};
 list.push(m);me.lastComment=now;save();
 return send(res,200,{ok:1,comment:{id:m.id,by:m.by,text:m.text,at:m.at,mine:true,staff:!!staff(me)},count:list.length,list:list.slice(-40).map(x=>({id:x.id,by:x.by,text:x.text,at:x.at,mine:x.by===me.name,staff:!!staff(me)}))});
}

// A creator's own numbers: last 7 days of visits per game, likes, comments and item sales.
function analytics(c){
 const {req,res,me,send,need,D}=c;
 if(!me)return need();
 const vis=D.meta.visits||{},comments=D.meta.comments||{};
 const days=[];for(let i=6;i>=0;i--)days.push(dayOf(Date.now()-i*DAY));
 const mine=(D.games||[]).filter(g=>(g.creator||'').toLowerCase()===me.name.toLowerCase());
 const games=mine.map(g=>{
  const series=days.map(d=>((vis[g.id]||{})[d]|0));
  return {id:g.id,name:g.name,genre:g.genre||'Obby',plays:playsOf(D,g.id),likes:likesOf(D,g.id),
   comments:(comments['game:'+g.id]||[]).length,today:series[series.length-1],week:series.reduce((a,b)=>a+b,0),series};
 });
 const items=(D.hats||[]).filter(h=>(h.creator||'').toLowerCase()===me.name.toLowerCase()).map(h=>({id:h.id,name:h.name,likes:likesOf(D,h.id),sales:Math.max(0,(D.sales||{})[h.id]|0),comments:(comments['item:'+h.id]||[]).length}));
 games.sort((a,b)=>b.week-a.week||b.plays-a.plays);
 const series=days.map((d,i)=>games.reduce((a,g)=>a+g.series[i],0));
 const totals={plays:games.reduce((a,g)=>a+g.plays,0),likes:games.reduce((a,g)=>a+g.likes,0),
  comments:games.reduce((a,g)=>a+g.comments,0),week:series.reduce((a,b)=>a+b,0),
  games:games.length,itemLikes:items.reduce((a,h)=>a+h.likes,0),sales:items.reduce((a,h)=>a+h.sales,0)};
 return send(res,200,{days,games,items,totals,series,name:me.name});
}

/* ---------- Pictures and sounds for games ----------
   Uploads are small by design: the browser shrinks pictures before sending them, and everything
   here is capped so one game cannot fill the data store. Reading a file back needs no login,
   because the game itself loads it through an <img> or an <audio> tag. */
const MAXASSETS=8,MAXIMG=250000,MAXSND=320000,MAXTOTAL=900000;
const ASSET_RE=/^data:(image\/(?:png|jpeg|webp|gif)|audio\/(?:mpeg|mp3|wav|ogg|webm));base64,([A-Za-z0-9+/=]+)$/;
const newAssetId=()=>'a'+Math.random().toString(36).slice(2,10);
function ownsGame(D,me,gid){
 const g=(D.games||[]).find(x=>x.id===gid);
 if(!g)return {error:'No such game.',code:404};
 if((g.creator||'').toLowerCase()!==me.name.toLowerCase()&&!me.admin)return {error:'That game is not yours.',code:403};
 return {g};
}
function assets(c){
 const {req,res,p,b,me,send,need,D,save}=c;
 if(p==='/api/assets'){
  if(!me)return need();
  const gid=String(new URL(req.url,'http://x').searchParams.get('game')||'');
  const box=(D.assets||{})[gid]||{};
  return send(res,200,{assets:Object.keys(box).map(id=>({id,k:box[id].k,n:box[id].n||'',size:(box[id].d||'').length}))});
 }
 if(p==='/api/assets/upload'){
  if(!me)return need();
  const gid=String(b.game||'');
  const own=ownsGame(D,me,gid);
  if(own.error)return send(res,own.code||404,{error:own.error});
  const kind=b.kind==='snd'?'snd':'img';
  const data=String(b.data||'');
  const m=ASSET_RE.exec(data);
  if(!m)return send(res,400,{error:'That file type is not allowed.'});
  if((m[1].indexOf('image/')===0)!==(kind==='img'))return send(res,400,{error:'That file does not belong in this slot.'});
  if(data.length>(kind==='snd'?MAXSND:MAXIMG))return send(res,413,{error:kind==='snd'?'That sound is too big (about 250 KB max).':'That picture is too big.'});
  const box=D.assets=D.assets||{};
  const mine=box[gid]=box[gid]||{};
  const ids=Object.keys(mine);
  if(ids.length>=MAXASSETS)return send(res,400,{error:'This game already has '+MAXASSETS+' files. Remove one first.'});
  const total=ids.reduce((a,id)=>a+(mine[id].d||'').length,0);
  if(total+data.length>MAXTOTAL)return send(res,400,{error:'This game is out of upload space.'});
  let id;do{id=newAssetId()}while(mine[id]);
  mine[id]={k:kind,m:m[1],n:clean(b.name).slice(0,40),d:m[2],at:Date.now()};
  save();
  return send(res,200,{id,url:'/api/asset/'+encodeURIComponent(gid)+'/'+id});
 }
 if(p==='/api/assets/delete'){
  if(!me)return need();
  const gid=String(b.game||'');
  const own=ownsGame(D,me,gid);
  if(own.error)return send(res,own.code||404,{error:own.error});
  const box=(D.assets||{})[gid];
  const id=String(b.id||'');
  if(!box||!box[id])return send(res,404,{error:'No such file.'});
  delete box[id];
  if(!Object.keys(box).length)delete D.assets[gid];
  save();
  return send(res,200,{ok:1});
 }
 return serveAsset(c);
}
// Reading a file back: no login needed, cached forever (ids never change).
function serveAsset(c){
 const {res,D}=c;
 const m=/^\/api\/asset\/([\w-]{1,40})\/([a-z0-9]{4,14})$/.exec(c.p);
 if(!m)return false;
 const box=(D.assets||{})[m[1]]||{},a=box[m[2]];
 if(!a){res.writeHead(404,{'content-type':'text/plain'});res.end('Not found');return true}
 res.writeHead(200,{'content-type':a.m,'cache-control':'public, max-age=31536000, immutable'});
 res.end(Buffer.from(a.d||'','base64'));
 return true;
}

module.exports=function(ctx){
 const p=ctx.p;
 if(p.indexOf('/api/asset')===0)return assets(ctx);
 if(p==='/api/daily')return daily(ctx);
 if(p==='/api/reports')return reports(ctx);
 if(p==='/api/stats')return stats(ctx);
 if(p==='/api/glike')return glike(ctx);
 if(p==='/api/comments')return comments(ctx);
 if(p==='/api/analytics')return analytics(ctx);
 return reports(ctx);
};
module.exports.rewardFor=rewardFor;
module.exports.dailyStatus=dailyStatus;
module.exports.noteVisit=noteVisit;
