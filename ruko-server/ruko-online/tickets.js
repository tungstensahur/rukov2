// Tickets: the second currency. You earn them by playing and trade them in for Rukes.
// boot.js sends every /api/ticket* request here, with the game server's own helpers.
//   1) play time is reported by the game screen; the server decides what it is worth
//   2) 5 minutes of play = 10 Tickets, counting only time actually spent in a game
//   3) 100 Tickets = 10 Rukes
const PER=5*60*1000, PER_AWARD=10, RATE=100, RUKES=10;
const lastBeat=new Map(), lastSave=new Map();

const norm=me=>{me.tk=Math.max(0,Math.floor(+me.tk||0));me.pt=Math.max(0,Math.floor(+me.pt||0));return me};

function status(me){
 const m=norm(me);
 return {tickets:m.tk,coins:Math.max(0,Math.floor(+m.coins||0)),progress:m.pt,need:PER,award:PER_AWARD,rate:RATE,rukes:RUKES,next:Math.max(0,PER-m.pt)};
}

/* Add play time. `claimed` is what the browser says elapsed, `real` is how long it really has been
   since that player's last report, so a doctored message cannot mint tickets faster than the clock. */
function credit(me,claimed,real){
 const m=norm(me);
 const secs=Math.max(0,Math.min(70,Math.min(+claimed||0,+real||0)));
 m.pt+=Math.round(secs*1000);
 let gave=0;
 while(m.pt>=PER){
  m.pt-=PER;
  m.tk+=PER_AWARD;
  gave+=PER_AWARD;
 }
 return gave;
}

function convert(me,blocks){
 const m=norm(me);
 const n=Math.max(1,Math.min(200,Math.floor(+blocks||1)));
 const cost=n*RATE;
 if(m.tk<cost)return {error:'You need '+cost+' Tickets for that.',...status(m)};
 m.tk-=cost;
 m.coins=Math.max(0,Math.floor(+m.coins||0))+n*RUKES;
 return {ok:1,spent:cost,got:n*RUKES,...status(m)};
}

module.exports=function tickets(c){
 const {req,res,b,me,send,need,D,save,p}=c;
 if(!me)return need();
 const m=norm(me);
 const key=me.name;

 if(p==='/api/tickets'||p==='/api/tickets/'){
  return send(res,200,status(m));
 }

 if(p==='/api/tickets/play'){
  if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
  const now=Date.now();
  const prev=lastBeat.get(key)||0;
  // With no earlier report there is nothing to measure against, so one beat's worth is trusted.
  const real=prev?(now-prev)/1000:Math.min(Math.max(+b.s||0,0),35);
  lastBeat.set(key,now);
  const gave=credit(m,+b.s||0,real);
  // Written out when tickets change, and now and then so progress survives a restart.
  if(gave||now-(lastSave.get(key)||0)>150000){lastSave.set(key,now);save()}
  return send(res,200,{...status(m),gave});
 }

 if(p==='/api/tickets/convert'){
  if(req.method!=='POST')return send(res,405,{error:'Use POST.'});
  const r=convert(m,+b.n||1);
  if(r.error)return send(res,400,r);
  save();
  const st=status(m);
  return send(res,200,{ok:1,spent:r.spent,got:r.got,...st});
 }

 return send(res,200,status(m));
};

module.exports.status=status;
module.exports.credit=credit;
module.exports.convert=convert;
module.exports.PER=PER;
