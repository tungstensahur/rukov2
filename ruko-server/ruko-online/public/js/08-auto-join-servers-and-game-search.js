/* ---------- v8: home page (avatar, friends, Ruko news) + games ---------- */
let LIVE={},GP={},GS={sort:'live',pvp:false},SQ='',HNEWS=null,HFR=null;
async function playAuto(g){const r=await api('/api/servers/assign',{game:g.id});if(r&&r.server)return play(g,r.server);toast((r&&r.error)||'Could not reach a server, starting solo.');return play(g)}
function gcard(g){const t=g.thumb||(g.ht?`/api/thumb/${g.id}?v=${g.tv||0}`:null),n=LIVE[g.id]||0;
 return `<div class="card">${t?`<img src="${t}" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;margin-bottom:8px;background:var(--bg)">`:`<div class="gcard" style="background:linear-gradient(${esc(g.sky)},${esc(g.ground)});aspect-ratio:16/9;height:auto"></div>`}<b>${esc(g.name)}</b> <span class="mut" style="font-size:11px">${gGenre(g)}${g.pvp?' · ⚔️ PVP':''}</span><div class="mut" style="font-size:13px;min-height:36px">${esc(g.desc||'')}</div><div class="mut" style="font-size:12px">By <u data-u="${esc(g.creator)}" style="cursor:pointer">${esc(g.creator)}</u> · ${n?`🟢 ${n} playing`:`▶ ${GP[g.id]||0} visits`}</div><button class="pri" data-g="${g.id}" style="width:100%;margin-top:8px">Play</button><button data-solo="${g.id}" style="width:100%;margin-top:6px;font-size:12px">Practice solo</button></div>`}
function hWhen(t){if(!t)return '';const s=Math.max(1,Math.round((Date.now()-t)/1000));if(s<60)return 'just now';if(s<3600)return Math.round(s/60)+' min ago';if(s<86400)return Math.round(s/3600)+' h ago';const d=Math.round(s/86400);return d==1?'yesterday':d+' days ago'}
function hNews(){const box=$('#hnews');if(!box)return;const me=cur();
 if(!HNEWS){box.innerHTML='<p class="mut" style="margin:6px 0">Loading…</p>';return}
 if(!HNEWS.length){box.innerHTML='<p class="mut" style="margin:6px 0">No news yet.'+(me.admin?' Use the box below to post the first update.':'')+'</p>';return}
 box.innerHTML=HNEWS.map(p=>`<div class="npost"><b>${esc(p.title)}</b> <span class="mut" style="font-size:12px">${hWhen(p.at)}</span><div class="nptx">${esc(p.text)}</div>${me.admin?`<button class="npdel" data-del="${esc(p.id)}">Delete</button>`:''}</div>`).join('');
 box.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this post for everyone?'))return;const r=await api('/api/posts',{delete:b.dataset.del});if(r&&r.posts){HNEWS=r.posts;hNews()}})}
function hFriends(){const box=$('#hfr');if(!box)return;
 if(!HFR){box.innerHTML='<span class="mut">Loading…</span>';return}
 const f=HFR.friends||[];
 if(!f.length){box.innerHTML=`<span class="mut">No friends yet.</span><button data-go="friends">Find people</button>`}
 else box.innerHTML=f.slice(0,12).map(x=>`<button data-u="${esc(x.name)}"><span class="dot ${x.online?'':'off'}"></span>${esc(x.name)}</button>`).join('')+(f.length>12?`<button data-go="friends">+${f.length-12} more</button>`:'');
 const inc=(HFR.incoming||[]).length;
 if(inc)box.insertAdjacentHTML('afterbegin',`<button class="pri" data-go="friends">${inc} request${inc>1?'s':''} waiting</button>`);
 box.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>location.hash='#/user/'+encodeURIComponent(b.dataset.u));
 box.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>location.hash='#/'+b.dataset.go)}
function home(){const me=cur();
 app.innerHTML=`<div class="hgrid"><div class="hcol">
  <div class="card hme"><div class="hmtop"><b>${esc(me.name)}</b><span class="mut" style="font-size:12px">🪙 ${me.coins}</span></div><img id="hav" alt="${esc(me.name)}" class="hav"><div class="hbtns"><button id="hedit" style="flex:1">Edit avatar</button><button id="hprof" style="flex:1">Profile</button></div></div>
  <div class="card"><div class="hhd"><b>👥 Friends</b><button data-go="friends" style="font-size:12px;padding:3px 9px">Manage</button></div><div id="hfr" class="hfl"></div></div>
 </div><div class="hcol">
  <div class="card"><div class="hhd"><b>📣 Ruko news</b><button id="hrfr" style="font-size:12px;padding:3px 9px">↻ Refresh</button></div><div id="hnews"></div>${me.admin?`<div class="hcomp"><div class="stg" style="margin-top:0">Official post (only you can see this box)</div><input id="hnt" placeholder="Title" maxlength="90"><textarea id="hnb" rows="3" placeholder="What's new in Ruko?"></textarea><div id="hnerr" class="err"></div><button class="pri" id="hnp" style="width:100%">Publish post</button></div>`:''}</div>
  <h2>Games</h2>
  <input id="gq" placeholder="🔎 Search games, creators or genres" value="${esc(GF.q)}"><div style="display:flex;gap:6px;flex-wrap:wrap"><select id="gsr" style="flex:1;min-width:150px">${[['live','Most players now'],['plays','Most visited'],['new','Newest'],['az','A to Z']].map(([k,n])=>`<option value="${k}" ${GS.sort==k?'selected':''}>${n}</option>`).join('')}</select><button id="gpv" class="${GS.pvp?'on':''}" style="margin:4px 0 10px">⚔️ PVP only</button></div>
  <div class="chips">${['all',...GEN].map(x=>`<button data-gf="${x}" class="${GF.genre==x?'on':''}">${x=='all'?'All':x}</button>`).join('')}</div><div class="grid" id="gg"></div>
 </div></div>`;
 const paint=()=>{const q=GF.q.toLowerCase().trim(),L=games().filter(g=>(!q||(g.name+' '+g.creator+' '+gGenre(g)+' '+(g.desc||'')).toLowerCase().includes(q))&&(GF.genre=='all'||gGenre(g)==GF.genre)&&(!GS.pvp||g.pvp));
  const key={live:g=>-((LIVE[g.id]||0)*1e6+(GP[g.id]||0)),plays:g=>-(GP[g.id]||0),new:g=>-(g.at||0),az:g=>g.name.toLowerCase()}[GS.sort];L.sort((a,b)=>{const x=key(a),y=key(b);return typeof x=='string'?x.localeCompare(y):x-y});
  const gg=$('#gg');if(!gg)return;gg.innerHTML=L.map(gcard).join('')||'<p class="mut">No games match your search.</p>';
  gg.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>playAuto(games().find(g=>g.id==b.dataset.g)));gg.querySelectorAll('[data-solo]').forEach(b=>b.onclick=()=>play(games().find(g=>g.id==b.dataset.solo)))};
 $('#gq').oninput=e=>{GF.q=e.target.value;paint()};$('#gsr').onchange=e=>{GS.sort=e.target.value;paint()};$('#gpv').onclick=()=>{GS.pvp=!GS.pvp;home()};
 app.querySelectorAll('[data-gf]').forEach(b=>b.onclick=()=>{GF.genre=b.dataset.gf;home()});
 $('#hedit').onclick=()=>location.hash='#/avatar';$('#hprof').onclick=()=>location.hash='#/user/'+encodeURIComponent(me.name);
 $('#hrfr').onclick=()=>{HNEWS=null;hNews();api('/api/posts').then(r=>{if(r&&r.posts){HNEWS=r.posts;hNews()}})};
 if($('#hnp'))$('#hnp').onclick=async()=>{const t=$('#hnt').value.trim(),x=$('#hnb').value.trim(),E=$('#hnerr');E.textContent='';if(!t||!x){E.textContent='Add a title and some text.';return}
  $('#hnp').disabled=true;const r=await api('/api/posts',{title:t,text:x});$('#hnp').disabled=false;
  if(r&&r.posts){HNEWS=r.posts;$('#hnt').value='';$('#hnb').value='';hNews()}else E.textContent=(r&&r.error)||'Could not publish. Check your connection.'};
 try{const m=makePlayer(gearList(me),me.av||{});$('#hav').src=shot(m,[0,2.4,7],[0,1.6,0])}catch(e){}
 paint();hNews();hFriends();
 api('/api/posts').then(r=>{if(r&&r.posts&&$('#hnews')){HNEWS=r.posts;hNews()}});
 api('/api/friends').then(r=>{if(r&&$('#hfr')){HFR=r;hFriends()}});
 api('/api/servers').then(s=>{if(s&&s.players&&$('#gg')){LIVE={};s.players.forEach(p=>{const id=p.server.replace(/x\d+$/,'');LIVE[id]=(LIVE[id]||0)+1});paint()}})}
/* home page styling */
(function(){if(document.getElementById('rk-home-style'))return;const st=document.createElement('style');st.id='rk-home-style';
st.textContent=`.hgrid{display:grid;grid-template-columns:250px minmax(0,1fr);gap:12px;align-items:start}
.hcol{display:flex;flex-direction:column;gap:12px;min-width:0}
.hme{text-align:center}.hmtop{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}
.hav{width:100%;max-width:210px;border-radius:12px;background:var(--bg)}
.hbtns{display:flex;gap:6px;margin-top:8px}
.hhd{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}
.hfl{display:flex;flex-wrap:wrap;gap:6px;font-size:13px}.hfl button{display:flex;align-items:center;gap:6px;font-size:13px;padding:6px 10px}
.dot{width:8px;height:8px;border-radius:50%;background:#5bd16a;display:inline-block;flex:none}.dot.off{background:var(--mut);opacity:.45}
.npost{border-top:1px solid var(--bd);padding:10px 0 6px}.npost:first-child{border-top:0;padding-top:0}
.nptx{white-space:pre-wrap;font-size:14px;line-height:1.5;margin-top:4px}
.npdel{margin-top:6px;font-size:12px;padding:3px 9px}
.hcomp{margin-top:12px;border-top:1px solid var(--bd);padding-top:10px}
.hcomp textarea{width:100%;padding:10px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font:inherit;resize:vertical;margin:4px 0 4px}
@media(max-width:820px){.hgrid{grid-template-columns:1fr}.hav{max-width:160px}}`;
document.head.appendChild(st)})();
