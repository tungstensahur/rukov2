/* ---------- v6: profiles and player search ---------- */
app.addEventListener('click',e=>{const u=e.target.closest&&e.target.closest('[data-u]');if(u){e.stopPropagation();e.preventDefault();location.hash='#/user/'+encodeURIComponent(u.dataset.u)}},true);
function goProfile(){if(cur())location.hash='#/user/'+encodeURIComponent(cur().name)}
$('#myp').onclick=goProfile;
async function playersView(){app.innerHTML=`<h2>Players</h2><input id="pq" placeholder="Search by username"><div id="pl" class="grid"></div>`;
 const load=async()=>{const r=await api('/api/players?q='+encodeURIComponent($('#pq').value));if(!$('#pl')||!r||!r.players)return;$('#pl').innerHTML=r.players.map(u=>`<div class="card tile" data-u="${esc(u.name)}"><b>${esc(u.name)}</b> ${u.admin?'🛡️':u.mod?'🔧':''}<div class="mut" style="font-size:12px">${u.online?'🟢 Online':'⚪ Offline'}</div></div>`).join('')||'<p class="mut">No players found.</p>'};
 let t=0;$('#pq').oninput=()=>{clearTimeout(t);t=setTimeout(load,250)};load()}
async function profileView(name){
 app.innerHTML='<p class="mut">Loading…</p>';
 const r=await api('/api/profile?name='+encodeURIComponent(name));
 if(!r||r.error){app.innerHTML=`<h2>Player not found</h2><p class="mut">${esc((r&&r.error)||'Could not load this profile.')}</p><button id="fp">Find players</button>`;$('#fp').onclick=()=>location.hash='#/players';return}
 const p=r.p,me=cur(),lc=p.name.toLowerCase(),mine=lc==me.name.toLowerCase(),H=hats(),worn=Object.values(p.gear||{}).map(id=>H.find(h=>h.id==id)).filter(Boolean),mh=SH.filter(h=>h.creator.toLowerCase()==lc),mg=SG.filter(g=>g.creator.toLowerCase()==lc),own=(p.owned||[]).map(id=>H.find(h=>h.id==id)).filter(Boolean),sold=mh.reduce((a,h)=>a+sales(h),0),likes=mh.reduce((a,h)=>a+(LK[h.id]||0),0);let rot=.4;
 app.innerHTML=`<button id="fp">🔎 Find players</button><div class="hat" style="margin-top:12px"><div class="card"><img id="pa" alt=""><input id="pr" type="range" min="-3.14" max="3.14" step=".05" value=".4"></div><div><h2 style="margin-top:0">${esc(p.name)} ${p.admin?'🛡️':p.mod?'🔧 Staff':''}</h2><div class="mut">${p.online?'🟢 Online':'⚪ Offline'}${p.joined?' · Joined '+new Date(p.joined).toLocaleDateString():''}</div>
 <div class="stat"><div><b>${mg.length}</b><span class="mut">games</span></div><div><b>${mh.length}</b><span class="mut">items made</span></div><div><b>${sold}</b><span class="mut">items sold</span></div><div><b>${likes}</b><span class="mut">likes</span></div></div>
 ${mine?`<label>About me</label><textarea id="bio" maxlength="160" rows="3" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font:inherit">${esc(p.bio)}</textarea><button class="pri" id="bs" style="margin-top:8px">Save</button>`:`<p>${p.bio?esc(p.bio):'<span class="mut">No bio yet.</span>'}</p>`}
${mine?'':`<button id="fmsg" data-fr="${p.friend?1:0}">${p.friend?'💬 Message':'➕ Add friend'}</button>`} ${p.playing?'<button class="pri" id="jn">Join their server</button>':''}</div></div>
 <h3>Games (${mg.length})</h3><div class="grid">${mg.map(gcard).join('')||'<p class="mut">No games yet.</p>'}</div><h3>Items made (${mh.length})</h3><div class="grid">${mh.map(h=>hatTile(h,me,[])).join('')||'<p class="mut">No items yet.</p>'}</div><h3>Collection (${own.length})</h3><div class="grid">${own.map(h=>hatTile(h,me,[])).join('')||'<p class="mut">Nothing yet.</p>'}</div>`;
 const draw=()=>{const m=makePlayer(worn,p.av);m.rotation.y=rot;shotP($('#pa'),m,[0,2.4,7],[0,1.6,0])};draw();
 $('#pr').oninput=e=>{rot=+e.target.value;draw()};$('#fp').onclick=()=>location.hash='#/players';
 if($('#bs'))$('#bs').onclick=()=>api('/api/me',{bio:$('#bio').value}).then(x=>{if(x&&x.me){ME=x.me;$('#bs').textContent='Saved ✓'}else toast('Could not save.')});
 if($('#fmsg'))$('#fmsg').onclick=()=>{if(p.friend)location.hash='#/messages/'+encodeURIComponent(p.name);else api('/api/friends',{name:p.name,action:'request'}).then(r=>{if(r&&r.error)return toast(r.error);toast(r&&r.matched?'You are now friends!':'Friend request sent.',true);profileView(p.name)})};
 if($('#jn'))$('#jn').onclick=()=>{const g=games().find(x=>x.id==p.playing.replace(/x\d+$/,''));if(g)play(g,p.playing);else toast('That game is not available.')};
 app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>playAuto(games().find(g=>g.id==b.dataset.g)));app.querySelectorAll('[data-solo]').forEach(b=>b.onclick=()=>play(games().find(g=>g.id==b.dataset.solo)));
 app.querySelectorAll('[data-h]').forEach(t=>t.onclick=()=>location.hash='#/hat/'+t.dataset.h)}
