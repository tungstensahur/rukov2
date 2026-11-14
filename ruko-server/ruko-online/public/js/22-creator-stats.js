/* ---------- v22: game likes, comments, creator stats and analytics ---------- */
let RKST0=null,RKSP=null,RKST=0,RKBUSY=0;
const rk$=id=>document.getElementById(id);
const rkEsc=typeof esc==='function'?esc:s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function rkAgo(t){if(!t)return '';const s=Math.max(1,Math.round((Date.now()-t)/1000));if(s<60)return 'just now';if(s<3600)return Math.round(s/60)+'m ago';if(s<86400)return Math.round(s/3600)+'h ago';const d=Math.round(s/86400);return d==1?'yesterday':d+'d ago'}
const rkNum=n=>{n=n|0;return n>=1000?(n/1000).toFixed(n>=10000?0:1).replace(/\.0$/,'')+'k':String(n)};
function rkStats(force){
 if(RKST0&&!force&&Date.now()-RKST<20000)return Promise.resolve(RKST0);
 if(RKSP)return RKSP;
 RKSP=Promise.race([api('/api/stats').catch(()=>null),new Promise(r=>setTimeout(()=>r(null),6000))]).then(r=>{
  RKST0=(r&&r.games)?r:(RKST0||{games:{},users:{},liked:[]});RKST=Date.now();RKSP=null;
  try{rkPaint()}catch(e){}
  return RKST0;
 });
 return RKSP;
}
const rkGameStat=id=>((RKST0&&RKST0.games&&RKST0.games[id])||{likes:0,plays:0,comments:0});
const rkUserStat=n=>((RKST0&&RKST0.users&&RKST0.users[n])||{visits:0,likes:0,games:0,itemLikes:0,sales:0});
const rkHash=()=>String(location.hash||'');
const rkGameId=()=>{const m=/^#\/g\/([\w-]+)/.exec(rkHash());return m?m[1]:null};
const rkUserName=()=>{const m=/^#\/user\/([^/?]+)/.exec(rkHash());return m?decodeURIComponent(m[1]):null};

/* ---------- comments (games and catalog items) ---------- */
function rkComments(kind,id,host){
 if(!host||!id)return;
 host.innerHTML='<div class="rk-cm card"><div class="rk-cmh"><b>💬 Comments</b><span class="mut" id="rkcn">…</span></div>'+
  '<div class="rk-cl" id="rkcl"><p class="mut" style="font-size:13px">Loading comments…</p></div>'+
  '<div class="rk-cf"><textarea id="rkcT" rows="2" maxlength="300" placeholder="Say something nice about this '+(kind=='game'?'game':'item')+'"></textarea><button class="pri" id="rkcB">Post</button></div>'+
  '<div class="err" id="rkcE"></div><p class="mut rk-chint">Be kind. Comments are public and can be removed by staff.</p></div>';
 const list=rk$('rkcl'),cnt=rk$('rkcn'),ta=rk$('rkcT'),btn=rk$('rkcB'),err=rk$('rkcE');
 const me=cur()||{};
 const draw=res=>{
  if(!list||!document.body.contains(list))return;
  const ms=(res&&res.list)||[];
  if(cnt)cnt.textContent=ms.length?rkNum((res&&res.count)||ms.length)+' in total':'';
  list.innerHTML=ms.length?ms.slice().reverse().map(m=>{
   const can=m.mine||me.admin||me.mod;
   return '<div class="rk-c"><div class="rk-ct"><b data-u="'+rkEsc(m.by)+'" class="rk-cn">'+rkEsc(m.by)+'</b>'+(m.staff?' <span class="rk-st">staff</span>':'')+'<span class="mut rk-cw">'+rkAgo(m.at)+'</span>'+(can?'<button class="rk-cd" data-del="'+rkEsc(m.id)+'" title="Delete">✕</button>':'')+'</div><div class="rk-cx">'+rkEsc(m.text)+'</div></div>';
  }).join(''):'<p class="mut" style="font-size:13px">No comments yet. Be the first.</p>';
  list.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
   b.disabled=true;
   api('/api/comments',{kind,id,del:b.dataset.del}).then(r=>{if(r&&r.list)draw(r);else{b.disabled=false;if(err)err.textContent=(r&&r.error)||'Could not delete that.'}});
  });
 };
 const load=()=>api('/api/comments?kind='+kind+'&id='+encodeURIComponent(id)).then(r=>{if(r)draw(r)});
 btn.onclick=()=>{
  const t=ta.value.trim();
  if(!t)return ta.focus();
  btn.disabled=true;err.textContent='';
  api('/api/comments',{kind,id,text:t}).then(r=>{
   btn.disabled=false;
   if(r&&r.list){ta.value='';draw(r);toast('Comment posted.',true)}
   else err.textContent=(r&&r.error)||'Could not post that. Try again.';
  },()=>{btn.disabled=false;err.textContent='Could not post that. Try again.'});
 };
 ta.onkeydown=e=>{if(e.key=='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();btn.click()}};
 load();
}

/* ---------- one game's own page ---------- */
function rkGamePage(id){
 const me=cur(),g=(typeof games==='function'?games():[]).find(x=>x.id==id);
 if(!g){app.innerHTML='<button id="rkgb">← Back</button><h2>Game not found</h2><p class="mut">It may have been removed.</p>';const b=rk$('rkgb');if(b)b.onclick=()=>location.hash='#/';return}
 const s=rkGameStat(id),liked=!!(RKST0&&RKST0.liked&&RKST0.liked.indexOf(id)>=0),t=g.thumb||(g.ht?'/api/thumb/'+g.id+'?v='+(g.tv||0):null);
 app.innerHTML='<button id="rkgb">← Back</button><div class="hat" style="margin-top:12px"><div class="card">'+
  (t?'<img src="'+rkEsc(t)+'" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;background:var(--bg)">'
    :'<div class="gcard" style="background:linear-gradient('+rkEsc(g.sky||'#8fd3ff')+','+rkEsc(g.ground||'#5bd16a')+');aspect-ratio:16/9;height:auto"></div>')+
  '</div><div><h2 style="margin-top:0">'+rkEsc(g.name)+'</h2>'+
  '<div class="mut">By <b data-u="'+rkEsc(g.creator)+'" style="color:var(--tx);cursor:pointer;text-decoration:underline">'+rkEsc(g.creator)+'</b>'+
  (typeof gGenre==='function'?' · '+rkEsc(gGenre(g)):'')+(g.pvp?' · ⚔️ PVP':'')+'</div>'+
  '<div class="stat"><div><b id="rkp">'+rkNum(s.plays)+'</b><span class="mut">visits</span></div>'+
  '<div><b id="rkl">'+rkNum(s.likes)+'</b><span class="mut">likes</span></div>'+
  '<div><b id="rkc">'+rkNum(s.comments)+'</b><span class="mut">comments</span></div></div>'+
  '<p>'+rkEsc(g.desc||'')+'</p>'+
  '<div class="chips"><button class="pri" id="rkgp">▶ Play</button><button id="rkgs">Play solo</button>'+
  '<button id="rkgl">'+(liked?'❤ Liked':'♡ Like')+'</button></div></div></div><div id="rkcm"></div>';
 const b=rk$('rkgb');if(b)b.onclick=()=>history.length>1?history.back():(location.hash='#/');
 const p=rk$('rkgp');if(p)p.onclick=()=>{if(typeof playAuto==='function')playAuto(g);else if(typeof play==='function')play(g)};
 const so=rk$('rkgs');if(so)so.onclick=()=>{if(typeof play==='function')play(g)};
 const lk=rk$('rkgl');
 if(lk)lk.onclick=()=>{
  lk.disabled=true;
  api('/api/glike',{id}).then(r=>{
   lk.disabled=false;
   if(!r||r.error)return toast((r&&r.error)||'Could not like that game.');
   if(RKST0&&RKST0.liked){RKST0.liked=r.liked?RKST0.liked.concat([id]).filter((v,i,a)=>a.indexOf(v)==i):RKST0.liked.filter(x=>x!=id)}
   if(RKST0&&RKST0.games&&RKST0.games[id])RKST0.games[id].likes=r.n;
   if(rk$('rkl'))rk$('rkl').textContent=rkNum(r.n);
   lk.textContent=r.liked?'❤ Liked':'♡ Like';
   toast(r.liked?'Added to your likes.':'Like removed.',true);
  },()=>{lk.disabled=false;toast('Could not like that game.')});
 };
 rkComments('game',id,rk$('rkcm'));
 rkStats().then(()=>{
  const s2=rkGameStat(id),a=rk$('rkp'),b2=rk$('rkl'),c=rk$('rkc'),lb=rk$('rkgl');
  if(a)a.textContent=rkNum(s2.plays);if(b2)b2.textContent=rkNum(s2.likes);if(c)c.textContent=rkNum(s2.comments);
  if(lb&&RKST0&&RKST0.liked)lb.textContent=RKST0.liked.indexOf(id)>=0?'❤ Liked':'♡ Like';
 });
}

/* ---------- creator analytics ---------- */
function rkSpark(series){
 const max=Math.max(1,...series);
 return '<span class="rk-sp">'+series.map(n=>'<i style="height:'+Math.max(2,Math.round((n/max)*18))+'px"></i>').join('')+'</span>';
}
function rkAnalytics(host){
 if(!host)return;
 host.innerHTML='<div class="rk-an card"><div class="rk-anh"><b>📈 Creator analytics</b><span class="mut">last 7 days</span></div><p class="mut" style="font-size:13px;margin:0 0 8px">Loading…</p></div>';
 const paint=r=>{
  if(!host||!document.body.contains(host))return;
  if(!r||!r.totals){host.innerHTML='<div class="rk-an card"><b>📈 Creator analytics</b><p class="mut" style="font-size:13px">Could not load your numbers right now.</p></div>';return}
  const t=r.totals,days=r.days||[],ser=r.series||[],max=Math.max(1,...ser);
  host.innerHTML='<div class="rk-an card"><div class="rk-anh"><b>📈 Creator analytics</b><span class="mut">last 7 days</span></div>'+
   '<div class="rk-ans"><div><b>'+rkNum(t.week)+'</b><span class="mut">visits this week</span></div><div><b>'+rkNum(t.plays)+'</b><span class="mut">visits all time</span></div><div><b>'+rkNum(t.likes+t.itemLikes)+'</b><span class="mut">likes</span></div><div><b>'+rkNum(t.comments)+'</b><span class="mut">comments</span></div><div><b>'+rkNum(t.sales)+'</b><span class="mut">items sold</span></div></div>'+
   (t.games?'<div class="rk-bars">'+ser.map((n,i)=>'<div class="rk-bar" title="'+days[i]+': '+n+' visits"><i style="height:'+Math.max(2,Math.round((n/max)*46))+'px"></i><s>'+String(days[i]||'').slice(5)+'</s></div>').join('')+'</div>':'')+
   (r.games&&r.games.length?'<div class="rk-ag">'+r.games.slice(0,8).map(g=>'<div class="rk-agr"><b data-rkg="'+rkEsc(g.id)+'">'+rkEsc(g.name)+'</b><span class="mut">'+rkNum(g.plays)+' visits · '+rkNum(g.likes)+' likes · '+rkNum(g.comments)+' comments</span>'+rkSpark(g.series||[])+'</div>').join('')+'</div>':'<p class="mut" style="font-size:13px">Publish a game and its visits will show up here.</p>')+
   (r.items&&r.items.length?'<details class="rk-ai"><summary>Items ('+r.items.length+')</summary>'+r.items.map(h=>'<div class="rk-agr"><b>'+rkEsc(h.name)+'</b><span class="mut">'+rkNum(h.sales)+' sold · '+rkNum(h.likes)+' likes · '+rkNum(h.comments)+' comments</span></div>').join('')+'</details>':'')+
   '<p class="mut" style="font-size:11px;margin:8px 0 0">Visits count each time someone joins one of your games.</p></div>';
  host.querySelectorAll('[data-rkg]').forEach(b=>b.onclick=()=>location.hash='#/g/'+encodeURIComponent(b.dataset.rkg));
 };
 api('/api/analytics').then(paint,()=>paint(null));
}

/* ---------- keep the page decorated ---------- */
function rkProfileStats(){
 const name=rkUserName(),me=cur()||{};
 if(!name)return;
 const stat=app.querySelector('.stat');
 if(!stat)return;
 const mine=name.toLowerCase()===(me.name||'').toLowerCase();
 if(!stat.dataset.rkvis){
  const u=rkUserStat(name),d=document.createElement('div');
  d.innerHTML='<b>'+rkNum(u.visits)+'</b><span class="mut">game visits</span>';
  stat.insertBefore(d,stat.children[2]||null);
  stat.dataset.rkvis='1';
 }else{
  const b=stat.children[2]&&stat.children[2].querySelector('b');
  if(b)b.textContent=rkNum(rkUserStat(name).visits);
 }
 const chips=[...stat.children];
 const lk=chips.find(c=>/likes/i.test((c.textContent||''))&&c!==chips[2]);
 if(lk&&RKST0){const b=lk.querySelector('b');if(b&&rkUserStat(name).likes!=null)b.textContent=rkNum(rkUserStat(name).likes)}
 if(mine&&!document.getElementById('rkan')){
  const wrap=document.createElement('div');wrap.id='rkan';
  const head=app.querySelector('.hat');
  if(head&&head.parentNode===app)head.insertAdjacentElement('afterend',wrap);else app.insertBefore(wrap,app.firstChild);
  rkAnalytics(wrap);
 }
}

function rkCommentsOnItem(){
 const m=/^#\/hat\/([\w-]+)/.exec(rkHash());
 if(!m)return;
 if(document.getElementById('rkcm-item'))return;
 const host=document.createElement('div');host.id='rkcm-item';
 const more=[...app.querySelectorAll('h3')].find(h=>/^More by/.test(h.textContent||''));
 if(more&&more.parentNode===app)more.insertAdjacentElement('beforebegin',host);
 else{const hat=app.querySelector('.hat');if(hat)hat.insertAdjacentElement('afterend',host);else app.appendChild(host)}
 rkComments('item',m[1],host);
}

function rkGameButtons(){
 if(!RKST0)return;
 app.querySelectorAll('[data-g],[data-solo]').forEach(b=>{
  const id=b.dataset.g||b.dataset.solo;if(!id)return;
  const pa=b.parentNode;if(!pa||pa.querySelector('.rk-gm'))return;
  const s=rkGameStat(id);
  const btn=document.createElement('button');
  btn.className='rk-gm';btn.type='button';
  btn.innerHTML='💬 '+(s.comments?rkNum(s.comments):'')+' · ❤ '+rkNum(s.likes);
  btn.title='Open this game’s page, likes and comments';
  btn.onclick=e=>{e.preventDefault();e.stopPropagation();location.hash='#/g/'+encodeURIComponent(id)};
  b.insertAdjacentElement('afterend',btn);
 });
}

function rkPaint(){
 if(RKBUSY)return;
 RKBUSY=1;
 requestAnimationFrame(()=>{
  RKBUSY=0;
  try{
   if(rkGameId()){rkGameButtons();return}
   rkProfileStats();
   rkCommentsOnItem();
   rkGameButtons();
  }catch(e){}
 });
}

/* ---------- routing + wiring ---------- */
(function(){
 const st=document.createElement('style');st.id='rk-stats-style';
 st.textContent=[
  '.rk-gm{margin-top:6px;width:100%;font-size:12px;padding:6px 8px;min-height:34px;background:var(--card);border:1px solid var(--bd);color:var(--tx);border-radius:9px}',
  '.rk-gm:hover{border-color:var(--ac)}',
  '.rk-cm{margin-top:14px}',
  '.rk-cmh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px}',
  '.rk-cl{display:flex;flex-direction:column;gap:8px;max-height:340px;overflow:auto}',
  '.rk-c{background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:8px 10px}',
  '.rk-ct{display:flex;align-items:center;gap:6px;font-size:12px;margin-bottom:2px}',
  '.rk-cn{color:var(--ac);cursor:pointer}',
  '.rk-st{background:var(--ac);color:#fff;border-radius:6px;padding:0 5px;font-size:10px;font-weight:700}',
  '.rk-cw{margin-left:auto;font-size:11px}',
  '.rk-cd{border:0;background:none;color:var(--mut);padding:0 4px;min-height:0;font-size:13px}',
  '.rk-cx{font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}',
  '.rk-cf{display:flex;gap:6px;margin-top:8px;align-items:flex-end}',
  '.rk-cf textarea{flex:1;margin:0;padding:9px 10px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font:inherit;resize:vertical;min-height:44px}',
  '.rk-chint{font-size:11px;margin:6px 0 0}',
  '.rk-an{margin:10px 0 16px}',
  '.rk-anh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px}',
  '.rk-ans{display:flex;flex-wrap:wrap;gap:16px;margin-bottom:10px}',
  '.rk-ans b{display:block;font-size:19px;line-height:1.15}.rk-ans span{font-size:11px}',
  '.rk-bars{display:flex;align-items:flex-end;gap:6px;height:64px;padding:4px 0 0}',
  '.rk-bar{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;height:100%}',
  '.rk-bar i{display:block;width:100%;max-width:26px;border-radius:5px 5px 0 0;background:var(--ac)}',
  '.rk-bar s{font-size:10px;color:var(--mut);text-decoration:none}',
  '.rk-ag{margin-top:10px;display:flex;flex-direction:column;gap:6px}',
  '.rk-agr{display:flex;align-items:center;gap:8px;font-size:13px;flex-wrap:wrap}',
  '.rk-agr b{color:var(--ac);cursor:pointer}.rk-agr .mut{font-size:11px}',
  '.rk-sp{display:inline-flex;align-items:flex-end;gap:1px;height:18px;margin-left:auto}',
  '.rk-sp i{display:block;width:4px;background:var(--mut);border-radius:1px;opacity:.8}',
  '.rk-ai{margin-top:12px}.rk-ai summary{cursor:pointer;font-size:13px;margin-bottom:6px}',
  '@media(max-width:520px){.rk-ans{gap:12px}.rk-ans b{font-size:17px}}'
 ].join('\n');
 document.head.appendChild(st);
 const R0=render;
 render=function(){
  RKST=0;
  if(rkGameId()){try{R0()}catch(e){}try{rkGamePage(rkGameId())}catch(e){}rkStats();scrollTo(0,0);return}
  R0();
  rkStats();
 };
 const ob=new MutationObserver(()=>{try{rkPaint()}catch(e){}});
 if(app)ob.observe(app,{childList:true,subtree:true});
 addEventListener('hashchange',()=>{setTimeout(()=>{try{rkPaint()}catch(e){}},30)});
 try{rkStats();rkPaint()}catch(e){}
})();
