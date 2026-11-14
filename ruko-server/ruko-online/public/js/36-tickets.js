/* ---------- v36: Tickets, the second currency ---------- */
/* Tickets are earned by playing: five minutes in a game pays ten of them. They can be traded for
   Rukes on their own page, 100 Tickets for 10 Rukes. The server keeps both the balance and the play
   clock, so closing the tab or editing the page cannot mint Tickets. */
(function(){
 if(window.RKTICKETS)return;
 window.RKTICKETS=1;

 let T={tickets:0,coins:0,progress:0,need:300000,award:10,rate:100,rukes:10,next:300000};
 const pull=()=>Promise.resolve().then(()=>api('/api/tickets')).then(r=>{
  if(r&&typeof r.tickets==='number'){T=Object.assign(T,r);put()}
  return T;
 }).catch(()=>T);

 /* the counter beside the Ruke balance in the top bar */
 const put=()=>{
  const c=document.querySelector('#coins');
  if(!c||!c.parentNode)return;
  let b=document.querySelector('#tkcoins');
  if(!b){
   b=document.createElement('span');
   b.id='tkcoins';b.title='Tickets — earned by playing';
   b.style.cssText='margin-left:10px';
   c.parentNode.insertBefore(b,c.nextSibling);
  }
  b.textContent='🎟️ '+T.tickets;
 };

 const mins=ms=>{
  const s=Math.max(0,Math.round((ms||0)/1000));
  return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
 };

 /* ---------- the Tickets page ---------- */
 function view(){
  const me=cur();
  if(!me)return;
  const draw=()=>{
   const blocks=Math.floor((T.tickets||0)/(T.rate||100));
   const pct=Math.min(100,Math.round(((T.progress||0)/(T.need||300000))*100));
   app.innerHTML=`<h2>Tickets <span class="mut" style="font-size:13px;font-weight:400">Earned by playing</span></h2>
   <div class="card" style="margin-bottom:12px">
     <div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-end">
       <div><div class="mut" style="font-size:12px">Tickets</div><div style="font-size:34px;font-weight:700">🎟️ ${(T.tickets||0).toLocaleString()}</div></div>
       <div><div class="mut" style="font-size:12px">Rukes</div><div style="font-size:26px;font-weight:600">🪙 ${(T.coins||0).toLocaleString()}</div></div>
     </div>
   </div>
   <div class="card" style="margin-bottom:12px">
     <div style="display:flex;justify-content:space-between;font-size:13px"><span>Next ${T.award||10} Tickets</span><span class="mut">${mins(T.progress)} / ${mins(T.need)}</span></div>
     <div style="height:10px;border-radius:6px;background:var(--bg);overflow:hidden;margin-top:6px"><div style="height:100%;width:${pct}%;background:#ffd23f"></div></div>
     <p class="mut" style="font-size:13px;margin:10px 0 0">Every 5 minutes you spend in a game gives you ${T.award||10} Tickets. Only time actually playing counts.</p>
   </div>
   <div class="card">
     <h3 style="margin-top:0">Trade Tickets for Rukes</h3>
     <p class="mut" style="font-size:13px">${T.rate||100} Tickets become ${T.rukes||10} Rukes.</p>
     <div style="display:flex;gap:8px;flex-wrap:wrap">
       <button class="pri" data-cv="1" ${blocks<1?'disabled':''}>100 Tickets → 10 Rukes</button>
       <button data-cv="5" ${blocks<5?'disabled':''}>500 Tickets → 50 Rukes</button>
       <button data-cv="${blocks||0}" ${blocks<1?'disabled':''}>All ${blocks?blocks*100:0} Tickets → ${blocks?blocks*10:0} Rukes</button>
     </div>
     ${blocks<1?`<p class="mut" style="font-size:13px;margin-bottom:0">You need ${T.rate||100} Tickets to trade. Play some games to fill up.</p>`:''}
   </div>
   <p class="mut" style="font-size:13px">Your Tickets are saved to your account. <button id="tkgo" style="font-size:12px;padding:3px 9px">Play a game</button></p>`;
   app.querySelectorAll('[data-cv]').forEach(b=>b.onclick=async()=>{
    const n=Math.max(1,Math.floor(+b.dataset.cv||1));
    b.disabled=true;
    const r=await api('/api/tickets/convert',{n}).catch(()=>null);
    if(!r||!r.ok){toast((r&&r.error)||'Could not trade right now.');b.disabled=false;return}
    T=Object.assign(T,r);put();
    toast('🎟️ '+r.spent+' Tickets → 🪙 '+r.got+' Rukes');
    const c=document.querySelector('#coins');if(c)c.textContent='🪙 '+(T.coins||0);
    draw();
   });
   const go=app.querySelector('#tkgo');
   if(go)go.onclick=()=>{location.hash='#/games'};
  };
  app.innerHTML='<p class="mut">Loading Tickets…</p>';
  pull().then(draw);
  return;
 }

 /* every route the app does not know lands on Home, so #/tickets is caught there */
 try{
  const base=typeof home=='function'?home:null;
  home=function(){
   if(/^#\/tickets\b/.test(String(location.hash||'')))return view();
   if(typeof base=='function')return base.apply(this,arguments);
  };
 }catch(e){}

 /* a Tickets button in the top bar (the phone "More" sheet is built from the same bar) */
 (function addNav(){
  const nav=document.querySelector('#top nav');
  if(!nav||nav.querySelector('button[data-r="tickets"]'))return;
  const b=document.createElement('button');
  b.dataset.r='tickets';
  b.innerHTML='<span class="ic">🎟️</span><span class="lb">Tickets</span>';
  b.onclick=()=>{location.hash='#/tickets';try{closeMore()}catch(e){}};
  const games=nav.querySelector('button[data-r="games"]'),home=nav.querySelector('button[data-r=""]');
  if(games&&games.nextSibling)nav.insertBefore(b,games.nextSibling);
  else if(home&&home.nextSibling)nav.insertBefore(b,home.nextSibling);
  else nav.insertBefore(b,nav.firstChild);
 })();

 /* ---------- play time ---------- */
 let acc=0,last=0;
 const inGame=()=>{
  const g=document.getElementById('game');
  return !!(g&&g.style.display!=='none'&&g.querySelector('canvas')&&document.visibilityState!=='hidden');
 };
 setInterval(()=>{
  if(!cur())return;
  const now=Date.now();
  if(!inGame()){last=0;acc=0;return}
  if(!last){last=now;return}
  const dt=now-last;
  last=now;
  if(dt>0&&dt<6000)acc+=dt;
  if(acc<30000)return;
  const s=Math.round(acc/1000);
  acc=0;
  api('/api/tickets/play',{s}).then(r=>{
   if(!r||typeof r.tickets!=='number')return;
   const gave=r.gave|0;
   T=Object.assign(T,r);
   put();
   if(gave)toast('🎟️ +'+gave+' Tickets for playing!');
  }).catch(()=>{});
 },1000);

 /* keep the top bar number honest */
 setInterval(()=>{if(cur())pull()},20000);

 if(typeof render==='function'&&cur())pull();
 window.RKTICKETSOK=1;
})();
