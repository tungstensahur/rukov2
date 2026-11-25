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
