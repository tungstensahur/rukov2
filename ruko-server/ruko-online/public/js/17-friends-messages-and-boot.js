/* ---------- v17: friends and direct messages ---------- */
let FR={friends:[],incoming:[],outgoing:[]},DMT=null;
async function friendsView(){const r=await api('/api/friends');if(r&&!r.error)FR=r;
 app.innerHTML=`<h2>Friends</h2><div class="card"><div style="display:flex;gap:6px"><input id="fq" placeholder="Username to add"><button class="pri" id="fadd">Add friend</button></div><div id="ferr" class="err"></div></div>
 ${FR.incoming.length?`<h3>Requests</h3>${FR.incoming.map(n=>`<div class="card" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><u data-u="${esc(n)}" style="cursor:pointer">${esc(n)}</u><div class="chips"><button class="pri" data-acc="${esc(n)}">Accept</button><button data-dec="${esc(n)}">Decline</button></div></div>`).join('')}`:''}
 ${FR.outgoing.length?`<h3>Sent</h3>${FR.outgoing.map(n=>`<div class="card" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><u data-u="${esc(n)}" style="cursor:pointer">${esc(n)}</u><span class="mut">Pending</span></div>`).join('')}`:''}
 <h3>Your friends (${FR.friends.length})</h3>${FR.friends.map(f=>`<div class="card" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><u data-u="${esc(f.name)}" style="cursor:pointer">${esc(f.name)}</u> <span class="mut">${f.online?'🟢':'⚪'}</span></div><div class="chips"><button data-msg="${esc(f.name)}">Message</button><button data-rem="${esc(f.name)}">Remove</button></div></div>`).join('')||'<p class="mut">No friends yet. Add someone above.</p>'}`;
 $('#fadd').onclick=()=>api('/api/friends',{name:$('#fq').value.trim(),action:'request'}).then(r=>{if(r&&r.error)return $('#ferr').textContent=r.error;$('#fq').value='';toast(r&&r.matched?'You are now friends!':'Friend request sent.',true);friendsView()});
 app.querySelectorAll('[data-acc]').forEach(b=>b.onclick=()=>api('/api/friends',{name:b.dataset.acc,action:'accept'}).then(()=>friendsView()));
 app.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>api('/api/friends',{name:b.dataset.dec,action:'decline'}).then(()=>friendsView()));
 app.querySelectorAll('[data-rem]').forEach(b=>b.onclick=()=>{if(confirm('Remove '+b.dataset.rem+' as a friend?'))api('/api/friends',{name:b.dataset.rem,action:'remove'}).then(()=>friendsView())});
 app.querySelectorAll('[data-msg]').forEach(b=>b.onclick=()=>location.hash='#/messages/'+encodeURIComponent(b.dataset.msg))}
async function messagesView(withName){clearInterval(DMT);const r0=await api('/api/conversations');const convos=(r0&&r0.convos)||[];
 if(!withName&&convos.length)withName=convos[0].name;
 app.innerHTML=`<h2>Messages</h2><div class="hat"><div class="card" id="cl2" style="max-height:60vh;overflow:auto">${convos.map(c=>`<div class="card tile" data-c="${esc(c.name)}" style="margin-bottom:6px;${c.name==withName?'border-color:var(--ac)':''}"><b>${esc(c.name)}</b> ${c.online?'🟢':''}<div class="mut" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.last)}</div></div>`).join('')||'<p class="mut">No conversations yet. Message a friend from the Friends page.</p>'}</div>
 <div class="card">${withName?`<b>${esc(withName)}</b><div id="dmbox" style="height:45vh;overflow:auto;margin:8px 0;font-size:14px"></div><div style="display:flex;gap:6px"><input id="dmi" maxlength="500" placeholder="Message ${esc(withName)}"><button class="pri" id="dms">Send</button></div><div id="dmerr" class="err"></div>`:'<p class="mut">Pick a conversation.</p>'}</div></div>`;
 app.querySelectorAll('[data-c]').forEach(d=>d.onclick=()=>{location.hash='#/messages/'+encodeURIComponent(d.dataset.c)});
 if(!withName)return;
 const paint=async()=>{const r=await api('/api/dm?with='+encodeURIComponent(withName));const box=$('#dmbox');if(!r||!r.msgs||!box)return;const stick=box.scrollTop+box.clientHeight>=box.scrollHeight-40;
  box.innerHTML=r.msgs.map(m=>`<div style="margin:4px 0;text-align:${m.from==cur().name?'right':'left'}"><span style="display:inline-block;max-width:80%;background:${m.from==cur().name?'var(--ac)':'var(--bg)'};color:${m.from==cur().name?'#fff':'var(--tx)'};border-radius:10px;padding:5px 10px">${esc(m.text)}</span><div class="mut" style="font-size:10px">${new Date(m.t).toTimeString().slice(0,5)}</div></div>`).join('')||'<p class="mut">Say hi!</p>';if(stick)box.scrollTop=box.scrollHeight};
 const send=async()=>{const i=$('#dmi'),t=i.value.trim();if(!t)return;i.value='';const r=await api('/api/dm',{to:withName,text:t});if(r&&r.error)$('#dmerr').textContent=r.error;paint()};
 $('#dms').onclick=send;$('#dmi').onkeydown=e=>{if(e.key=='Enter')send()};
 await paint();if($('#dmbox'))$('#dmbox').scrollTop=1e9;DMT=setInterval(paint,2500)}
function servers(){const act=PL.filter(p=>p.at>Date.now()-60000),ok=DB&&RM;
 app.innerHTML=`<h2>Servers <button id="rf" style="font-size:13px;padding:4px 10px;vertical-align:middle">↻ Refresh</button></h2><input id="sq" placeholder="🔎 Search games" value="${esc(SQ)}">${ok?'<p class="mut">Join a server to play with other people live. Up to 10 players each.</p>':'<p class="mut">Could not reach the server. Reload the page.</p>'}${games().filter(g=>!SQ||(g.name+' '+g.creator).toLowerCase().includes(SQ)).map(g=>`<h3>${esc(g.name)}</h3><div class='grid'>${Array.from({length:Math.min(20,Math.max(3,1+Math.max(0,...act.filter(p=>p.server.startsWith(g.id+'x')).map(p=>+p.server.slice(g.id.length+1)))))},(_,i)=>i+1).map(n=>{const id=g.id+'x'+n,ps=act.filter(p=>p.server==id);return `<div class='card'><b>Server ${n}</b><div class='mut' style='font-size:13px'>${ps.length}/10 players</div><div class='mut' style='font-size:12px;min-height:32px'>${ps.map(p=>`<u data-u="${esc(p.name)}" style="cursor:pointer">${esc(p.name)}</u>`).join(', ')||'Empty'}</div><button class='pri' data-j='${id}' data-g='${g.id}' style='width:100%' ${ok&&ps.length<10?'':'disabled'}>${ps.length>=10?'Full':'Join'}</button></div>`}).join('')}</div>`).join('')}`;
 app.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>play(games().find(g=>g.id==b.dataset.g),b.dataset.j));$('#sq').oninput=e=>{SQ=e.target.value.toLowerCase();servers();const q=$('#sq');q.focus();q.setSelectionRange(q.value.length,q.value.length)}}
/* ---------- boot ---------- */
document.querySelectorAll('#top nav button[data-r]').forEach(b=>b.onclick=()=>{location.hash='#/'+b.dataset.r;closeMore()});
function doLogout(){ls.set('ruko_token',null);TOKEN=null;ME=null;closeMore();render()}
$('#out').onclick=doLogout;
let moreOpen=false;
function closeMore(){moreOpen=false;$('#msheet').classList.remove('open')}
$('#more').onclick=()=>{moreOpen=!moreOpen;$('#msheet').classList.toggle('open',moreOpen)};
$('#msheet').onclick=e=>{if(e.target.id=='msheet')closeMore()};
function buildMoreSheet(me){if(!me)return;const items=[...document.querySelectorAll('#top nav button[data-r]')].filter(b=>b.id!=='adm'||me.admin||me.mod);
 $('#msb').innerHTML=items.map(b=>`<button class="msi" data-r="${b.dataset.r}">${b.querySelector('.ic').outerHTML}<span>${b.querySelector('.lb').textContent}</span></button>`).join('')+'<button class="msi" id="msprofile"><span class="ic">👤</span><span>Profile</span></button><button class="msi" id="mslogout"><span class="ic">🚪</span><span>Log out</span></button>';
 $('#msb').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{location.hash='#/'+b.dataset.r;closeMore()});
 $('#msprofile').onclick=()=>{closeMore();goProfile()};$('#mslogout').onclick=doLogout}
addEventListener('hashchange',navigate);boot();
