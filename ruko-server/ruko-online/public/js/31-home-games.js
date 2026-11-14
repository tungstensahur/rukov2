/* ---------- v31: a Games page of its own, and "recently played" on Home ---------- */
/* Home keeps the avatar, friends and news, and now shows the games you played last instead of the
   whole catalog. Everything that was on Home before (search, sort, genres, PVP filter) moved to a
   real Games page at #/games, which also has a button in the top bar. */
(function(){
 if(window.RKHOME31)return;
 window.RKHOME31=1;

 /* ---- what you played last, remembered per account on this device ---- */
 const rkey=()=>{const me=cur();return 'ruko_recent_'+(me&&me.name?String(me.name).toLowerCase():'guest')};
 const recent=()=>{const a=ls.get(rkey(),[]);return Array.isArray(a)?a.filter(r=>r&&r.id):[]};
 const mark=g=>{const id=g&&(g.id||g);if(!id)return;try{const a=recent().filter(r=>r.id!=id);a.unshift({id:id,at:Date.now()});ls.set(rkey(),a.slice(0,8))}catch(e){}};

 /* opening a game counts as playing it, whether it is a server game or solo practice */
 try{const p0=play;play=function(g,s){try{mark(g)}catch(e){}return p0(g,s)}}catch(e){}
 try{const a0=playAuto;playAuto=function(g){try{mark(g)}catch(e){}return a0(g)}}catch(e){}

 /* play buttons inside a fresh piece of markup */
 const bind=(root)=>{if(!root)return;
  root.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>playAuto(games().find(g=>g.id==b.dataset.g)));
  root.querySelectorAll('[data-solo]').forEach(b=>b.onclick=()=>play(games().find(g=>g.id==b.dataset.solo)));
  root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>location.hash='#/'+(b.dataset.go||''))};

 /* a compact tile for the recently played strip */
 const rcard=g=>{const t=g.thumb||(g.ht?`/api/thumb/${g.id}?v=${g.tv||0}`:null);
  /* its own attribute: the report and like overlays append buttons next to anything marked data-g */
  return `<button class="rkrc" data-rkrec="${g.id}" title="Play ${esc(g.name)}">${t?`<img src="${t}" alt="${esc(g.name)}">`:`<span class="rkgr" style="background:linear-gradient(${esc(g.sky||'#8fd3ff')},${esc(g.ground||'#5bd16a')})"></span>`}<b>${esc(g.name)}</b><small class="mut">${esc(gGenre(g))}</small></button>`};
 const rcss=()=>{
  if(document.getElementById('rk31-style'))return;
  const st=document.createElement('style');st.id='rk31-style';
  st.textContent=`#app .rkrw{display:flex;flex-wrap:wrap;gap:12px}
#app .rkrc{flex:0 0 auto;width:136px;padding:0;border:0;background:none;display:flex;flex-direction:column;gap:4px;text-align:left}
#app .rkrc img,#app .rkrc .rkgr{display:block;width:136px;aspect-ratio:16/9;object-fit:cover;border-radius:10px;background:var(--bg)}
#app .rkrc b{font-size:13px;line-height:1.2;max-width:136px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#app .rkrc small{font-size:11px;margin-top:-2px}
#app .rkrc:hover img,#app .rkrc:hover .rkgr{outline:2px solid var(--ac);outline-offset:1px}`;
  document.head.appendChild(st);
 };

 /* ---------- Games page ---------- */
 function gamesView(){const me=cur();
  app.innerHTML=`<h2>Games <span class="mut" style="font-size:13px;font-weight:400">${games().length} ready to play</span></h2>
  <input id="gq" placeholder="🔎 Search games, creators or genres" value="${esc(GF.q)}"><div style="display:flex;gap:6px;flex-wrap:wrap"><select id="gsr" style="flex:1;min-width:150px">${[['live','Most players now'],['plays','Most visited'],['new','Newest'],['az','A to Z']].map(([k,n])=>`<option value="${k}" ${GS.sort==k?'selected':''}>${n}</option>`).join('')}</select><button id="gpv" class="${GS.pvp?'on':''}" style="margin:4px 0 10px">⚔️ PVP only</button></div>
  <div class="chips">${['all',...GEN].map(x=>`<button data-gf="${x}" class="${GF.genre==x?'on':''}">${x=='all'?'All':x}</button>`).join('')}</div><div class="grid" id="gg"></div>
  <p class="mut" style="font-size:13px">Looking for something new? <button data-go="create" style="font-size:12px;padding:3px 9px">Build your own game</button></p>`;
  const paint=()=>{const q=(GF.q||'').toLowerCase().trim(),L=games().filter(g=>(!q||(g.name+' '+g.creator+' '+gGenre(g)+' '+(g.desc||'')).toLowerCase().includes(q))&&(GF.genre=='all'||gGenre(g)==GF.genre)&&(!GS.pvp||g.pvp));
   const keys={live:g=>-((LIVE[g.id]||0)*1e6+(GP[g.id]||0)),plays:g=>-(GP[g.id]||0),new:g=>-(g.at||0),az:g=>g.name.toLowerCase()},key=keys[GS.sort]||keys.plays;
   L.sort((a,b)=>{const x=key(a),y=key(b);return typeof x=='string'?x.localeCompare(y):x-y});
   const gg=$('#gg');if(!gg)return;gg.innerHTML=L.map(gcard).join('')||'<p class="mut">No games match your search.</p>';
   bind(gg)};
  $('#gq').oninput=e=>{GF.q=e.target.value;paint()};
  $('#gsr').onchange=e=>{GS.sort=e.target.value;paint()};
  $('#gpv').onclick=()=>{GS.pvp=!GS.pvp;gamesView()};
  app.querySelectorAll('[data-gf]').forEach(b=>b.onclick=()=>{GF.genre=b.dataset.gf;gamesView()});
  bind(app);
  paint();
  api('/api/servers').then(s=>{if(s&&s.players&&$('#gg')){LIVE={};s.players.forEach(p=>{const id=p.server.replace(/x\d+$/,'');LIVE[id]=(LIVE[id]||0)+1});paint()}});
 }

 /* ---------- Home page ---------- */
 function homeView(){const me=cur();
  app.innerHTML=`<div class="hgrid"><div class="hcol">
   <div class="card hme"><div class="hmtop"><b>${esc(me.name)}</b><span class="mut" style="font-size:12px">🪙 ${me.coins}</span></div><img id="hav" alt="${esc(me.name)}" class="hav"><div class="hbtns"><button id="hedit" style="flex:1">Edit avatar</button><button id="hprof" style="flex:1">Profile</button></div></div>
   <div class="card"><div class="hhd"><b>👥 Friends</b><button data-go="friends" style="font-size:12px;padding:3px 9px">Manage</button></div><div id="hfr" class="hfl"></div></div>
  </div><div class="hcol">
   <div class="card"><div class="hhd"><b>🎮 Recently played</b><button id="hrall" style="font-size:12px;padding:3px 9px">All games →</button></div><div id="hrc"></div></div>
   <div class="card"><div class="hhd"><b>📣 Ruko news</b><button id="hrfr" style="font-size:12px;padding:3px 9px">↻ Refresh</button></div><div id="hnews"></div>${me.admin?`<div class="hcomp"><div class="stg" style="margin-top:0">Official post (only you can see this box)</div><input id="hnt" placeholder="Title" maxlength="90"><textarea id="hnb" rows="3" placeholder="What's new in Ruko?"></textarea><div id="hnerr" class="err"></div><button class="pri" id="hnp" style="width:100%">Publish post</button></div>`:''}</div>
  </div></div>`;
  const paintRecent=()=>{const box=$('#hrc');if(!box)return;
   const H=games(),out=[],seen={};
   for(const r of recent()){
    const g=H.find(x=>x.id==r.id);
    if(g&&!seen[g.id]){seen[g.id]=1;out.push(g)}
    if(out.length>=4)break;
   }
   box.innerHTML=out.length?`<div class="rkrw">${out.map(rcard).join('')}</div>`
    :`<p class="mut" style="margin:6px 0 0">You have not played anything yet. <button data-go="games" style="font-size:12px;padding:3px 9px">Find a game</button></p>`;
   box.querySelectorAll('[data-rkrec]').forEach(b=>b.onclick=()=>{const g=games().find(x=>x.id==b.dataset.rkrec);if(g)playAuto(g)});
   bind(box)};
  $('#hedit').onclick=()=>location.hash='#/avatar';
  $('#hprof').onclick=()=>location.hash='#/user/'+encodeURIComponent(me.name);
  $('#hrall').onclick=()=>location.hash='#/games';
  $('#hrfr').onclick=()=>{HNEWS=null;HERR=0;hNews();loadNews()};
  if($('#hnp'))$('#hnp').onclick=async()=>{const t=$('#hnt').value.trim(),x=$('#hnb').value.trim(),E=$('#hnerr');E.textContent='';if(!t||!x){E.textContent='Add a title and some text.';return}
   $('#hnp').disabled=true;const r=await api('/api/posts',{title:t,text:x});$('#hnp').disabled=false;
   if(r&&r.posts){HNEWS=r.posts;$('#hnt').value='';$('#hnb').value='';hNews()}else E.textContent=(r&&r.error)||'Could not publish. Check your connection.'};
  bind(app);
  try{const m=makePlayer(gearList(me),me.av||{});$('#hav').src=shot(m,[0,2.4,7],[0,1.6,0])}catch(e){}
  paintRecent();hNews();hFriends();
  loadNews();
  hGet('/api/friends').then(r=>{if($('#hfr')){HFR=r||{friends:[]};hFriends()}});
  api('/api/servers').then(s=>{if(s&&s.players&&$('#hrc')){LIVE={};s.players.forEach(p=>{const id=p.server.replace(/x\d+$/,'');LIVE[id]=(LIVE[id]||0)+1});paintRecent()}});
 }

 rcss();

 /* every route the app does not know about lands on Home, so #/games is caught here */
 const base=typeof home=='function'?home:null;
 home=function(){
  if(/^#\/games\b/.test(String(location.hash||'')))return gamesView();
  if(typeof base!='function')return;
  return homeView();
 };

 /* a Games button in the top bar (and in the phone "More" sheet, which is built from this bar) */
 (function addNav(){
  const nav=document.querySelector('#top nav');
  if(!nav||nav.querySelector('button[data-r="games"]'))return;
  const b=document.createElement('button');
  b.dataset.r='games';b.dataset.pri='1';
  b.innerHTML='<span class="ic">🎮</span><span class="lb">Games</span>';
  b.onclick=()=>{location.hash='#/games';try{closeMore()}catch(e){}};
  const homeBtn=nav.querySelector('button[data-r=""]');
  if(homeBtn&&homeBtn.nextSibling)nav.insertBefore(b,homeBtn.nextSibling);else nav.insertBefore(b,nav.firstChild);
 })();

 window.RKVIEWS={gamesView:gamesView,homeView:homeView,recent:recent,mark:mark};
})();
