/* ---------- views ---------- */
function authView(mode){
 app.innerHTML=`<div class="rw-auth"><div class="rw-hero"><div class="rw-logo">RUKO</div><p class="rw-tag">Play, build and dress up in 3D.</p><div class="rw-pills"><span>🎮 Games</span><span>🧑 Avatar</span><span>🧰 Block code</span></div></div><div class="card rw-card"><div class="tabs"><button data-m="in" class="${mode=='in'?'on':''}">Log in</button><button data-m="up" class="${mode=='up'?'on':''}">Sign up</button></div><input id="u" placeholder="Username" autocomplete="username"><input id="p" type="password" placeholder="Password (4+ characters)" autocomplete="${mode=='in'?'current-password':'new-password'}"><div id="err" class="err"></div><button class="pri" id="go" style="width:100%">${mode=='in'?'Log in':'Create account'}</button><p class="rw-fine">Free to play · No download · One account on every device</p></div><ul class="rw-list"><li><span>🎮</span><div><b>Jump straight into games</b><small>Obstacle courses, coin hunts and PvP arenas.</small></div></li><li><span>🧑</span><div><b>Make your own avatar</b><small>Round characters with hats, faces and t-shirts.</small></div></li><li><span>🧰</span><div><b>Build your own game</b><small>Lay out a level in Ruko Studio, then add block code.</small></div></li></ul></div>`;
 app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>authView(b.dataset.m));
 $('#go').onclick=async()=>{const n=$('#u').value.trim(),p=$('#p').value,k=n.toLowerCase(),U=users(),E=t=>$('#err').textContent=t;
  if(mode=='up'){if(!/^\w{3,16}$/.test(n))return E('Username: 3–16 letters, numbers or underscores.');if(k=='ruko')return E('That name is reserved.');if(p.length<4)return E('Password needs 4+ characters.');if(U[k])return E('Username taken.');
   U[k]={name:n,h:await hash(p),coins:500,owned:['r1'],worn:'r1'};ls.set('ruko_users',U)}
  else if(!U[k]||U[k].h!==await hash(p))return E('Wrong username or password.');
  ls.set('ruko_session',k);location.hash='#/';render()}}
function applyTheme(){const t=ls.get('ruko_theme','auto');if(t=='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=t}
applyTheme();
function render(){closeMore();document.documentElement.style.scrollPaddingTop='';clearInterval(CHT);clearInterval(DMT);const me=cur();$('#top').style.display=me?'flex':'none';if(!me)return authView('in');
 $('#coins').textContent='🪙 '+me.coins;$('#adm').style.display=me.admin||me.mod?'':'none';$('#adm').querySelector('.lb').textContent=(me.admin?'Admin':'Staff')+(me.pend?' ('+me.pend+')':'');buildMoreSheet(me);const[a,b]=location.hash.slice(2).split('/');
 if(a=='catalog')catalog();else if(a=='avatar')avatar();else if(a=='servers')servers();else if(a=='admin'&&(me.admin||me.mod))adminView();else if(a=='chat')chatView();else if(a=='friends')friendsView();else if(a=='messages')messagesView(b?decodeURIComponent(b):null);else if(a=='settings')settingsView();else if(a=='user')profileView(decodeURIComponent(b||me.name));else if(a=='players')playersView();else if(a=='hat')hatPage(b);else if(a=='create')create();else home();scrollTo(0,0)}
function home(){const me=cur();
 app.innerHTML=`<h2>Welcome, ${esc(me.name)} <button id="rf" style="font-size:13px;padding:4px 10px;vertical-align:middle">↻ Refresh</button></h2><div class="grid">${games().map(g=>`<div class="card"><div class="gcard" style="background:linear-gradient(${esc(g.sky)},${esc(g.ground)})"></div><b>${esc(g.name)}</b><div class="mut" style="font-size:13px;min-height:36px">${esc(g.desc||'')}</div><div class="mut" style="font-size:12px">By <u data-u="${esc(g.creator)}" style="cursor:pointer">${esc(g.creator)}</u></div><button class="pri" data-g="${g.id}" style="width:100%;margin-top:8px">Play</button></div>`).join('')}</div>`;
 app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>playAuto(games().find(g=>g.id==b.dataset.g)));app.querySelectorAll('[data-solo]').forEach(b=>b.onclick=()=>play(games().find(g=>g.id==b.dataset.solo)))}
function catalog(){const me=cur();
 app.innerHTML=`<h2>Catalog <button id="rf" style="font-size:13px;padding:4px 10px;vertical-align:middle">↻ Refresh</button></h2><div class="grid">${hats().map(h=>`<div class="card tile" data-h="${h.id}"><img src="${thumb(h)}" alt=""><b>${esc(h.name)}</b><div class="mut" style="font-size:12px">By ${esc(h.creator)}</div><div>${me.owned.includes(h.id)?'✅ Owned':h.off?'Off sale':'🪙 '+h.price}</div></div>`).join('')}</div>`;
 app.querySelectorAll('[data-h]').forEach(t=>t.onclick=()=>location.hash='#/hat/'+t.dataset.h)}
function hatPage(id){const me=cur(),h=hats().find(x=>x.id==id);if(!h)return catalog();const own=me.owned.includes(id);
 app.innerHTML=`<button id="bk">← Catalog</button><div class="hat" style="margin-top:12px"><img src="${thumb(h)}" alt=""><div><h2 style="margin-top:0">${esc(h.name)} ${h.special?'<span style="font-size:13px;background:#ffc800;color:#000;border-radius:8px;padding:2px 8px;vertical-align:middle">✨ SPECIAL</span>':''}</h2><div class="mut">Created by <b data-u="${esc(h.creator)}" style="color:var(--tx);cursor:pointer;text-decoration:underline">${esc(h.creator)}</b></div><div class="stat"><div><b>${sales(h).toLocaleString()}</b><span class="mut">sales</span></div><div><b>🪙 ${h.price}</b><span class="mut">price</span></div></div>
 ${own?`<button class="pri" id="eq" ${typeof eqd!='undefined'?(eqd?'disabled':''):(me.worn==id?'disabled':'')}>${typeof eqd!='undefined'?(eqd?'Equipped':'Equip'):(me.worn==id?'Equipped':'Equip')}</button>`:`<button class="pri" id="buy" ${h.off||me.coins<h.price?'disabled':''}>${h.off?'Off sale':me.coins<h.price?'Not enough Rukos':'Buy for 🪙 '+h.price}</button>`}
 <p class="mut" style="font-size:13px">Equipped hats show up in every 3D game. Creators earn 50% of every sale.</p></div></div>`;
 $('#bk').onclick=()=>location.hash='#/catalog';
 if($('#eq'))$('#eq').onclick=()=>{if(h.kind=='shirt')me.av={...(me.av||{}),tee:id};else me.gear={...(me.gear||{}),[h.slot||'head']:id};saveUser(me);render()};
 if($('#buy'))$('#buy').onclick=()=>{const U=users(),k=key(),u=U[k];if(u.coins<h.price)return;u.coins-=h.price;u.owned.push(id);const c=h.creator.toLowerCase();if(c!=k&&U[c])U[c].coins+=h.price;ls.set('ruko_users',U);const S=ls.get('ruko_sales',{});S[id]=(S[id]||0)+1;ls.set('ruko_sales',S);shareBuy(id);render()}}
function create(tab){tab=tab||CTAB;CTAB=tab;const me=cur();
 app.innerHTML=`<h2>Creator Studio</h2><div class="tabs"><button data-t="hat" class="${tab=='hat'?'on':''}">Hat / Accessory</button><button data-t="game" class="${tab=='game'?'on':''}">Game</button></div>
 ${tab=='hat'?`<div class="hat"><div class="card"><img id="pv" alt=""></div><div class="card">
 <label>Name</label><input id="hn" maxlength="20" value="My Hat"><label>Shape</label><select id="ht"><option>cylinder</option><option>cone</option><option>dome</option><option>box</option><option>ring</option></select>
 <label>Color</label><input id="hc" type="color" value="#5b4bff"><label>Height</label><input id="hh" type="range" min=".2" max="1.4" step=".05" value=".6"><label>Width</label><input id="hw" type="range" min=".5" max="1.6" step=".05" value="1">
 <label><input id="hb" type="checkbox"> Brim</label><br><label>Price (Rukos)</label><input id="hp" type="number" min="0" max="1000" value="100"><div id="err" class="err"></div><button class="pri" id="pub" style="width:100%">Publish hat</button></div></div>`
 :`<div class="card" style="max-width:480px"><label>Name</label><input id="cn" maxlength="24" value="My Game"><label>Description</label><input id="cd" maxlength="80" value="A game I made."><label>Type</label><select id="cm"><option value="obby">Obby (climb to the top)</option><option value="coins">Coin collector</option><option value="roam">Free roam</option></select>
 <label>Sky color</label><input id="cs" type="color" value="#8fd3ff"><label>Ground color</label><input id="cg" type="color" value="#5bd16a"><label>Size (5–40 platforms)</label><input id="cz" type="number" min="5" max="40" value="16"><label>Level seed</label><input id="cx" type="number" value="${Math.floor(Math.random()*999)}">
 <div id="err" class="err"></div><div style="display:flex;gap:8px"><button id="tst" style="flex:1">Test play</button><button class="pri" id="pub" style="flex:1">Publish game</button></div></div>`}`;
 app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>create(b.dataset.t));
 if(tab=='hat'){const spec=()=>({id:'h'+Date.now(),name:$('#hn').value.trim()||'Untitled',creator:me.name,price:Math.max(0,Math.min(1000,+$('#hp').value||0)),type:$('#ht').value,color:$('#hc').value,h:+$('#hh').value,w:+$('#hw').value,brim:$('#hb').checked?1:0,base:0});
  const pv=()=>$('#pv').src=thumb(spec());app.querySelectorAll('.card input,.card select').forEach(i=>i.oninput=pv);pv();
  $('#pub').onclick=()=>{const h=spec();ls.set('ruko_hats',[...ls.get('ruko_hats',[]),h]);location.hash='#/hat/'+h.id}}
 else{const spec=()=>({id:'c'+Date.now(),name:$('#cn').value.trim()||'Untitled',desc:$('#cd').value.trim(),creator:me.name,mode:$('#cm').value,sky:$('#cs').value,ground:$('#cg').value,size:+$('#cz').value,seed:+$('#cx').value||1});
  $('#tst').onclick=()=>play(spec());$('#pub').onclick=()=>{ls.set('ruko_games',[...ls.get('ruko_games',[]),spec()]);location.hash='#/'}}}

/* ---------- login / signup screen ---------- */
(function(){const st=document.createElement('style');st.id='rk-auth-style';st.textContent=`.rw-auth{max-width:440px;margin:0 auto;padding:18px 0 40px}
.rw-hero{text-align:center;padding:6px 0 16px}
.rw-logo{font-weight:900;font-size:46px;letter-spacing:3px;color:var(--ac);line-height:1;text-shadow:0 10px 34px rgba(91,75,255,.45)}
.rw-tag{color:var(--mut);margin:10px 0 0;font-size:15px}
.rw-pills{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.rw-pills span{font-size:12px;background:var(--card);border:1px solid var(--bd);padding:5px 10px;border-radius:999px}
.rw-card{padding:14px;margin:0;max-width:100%}
.rw-fine{color:var(--mut);font-size:12px;text-align:center;margin:12px 0 0;line-height:1.4}
.rw-list{list-style:none;padding:0;margin:18px 0 0;display:grid;gap:8px}
.rw-list li{display:flex;gap:12px;align-items:center;background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:12px}
.rw-list li>span{font-size:24px;line-height:1;width:28px;text-align:center;flex:none}
.rw-list b{display:block;font-size:14px}
.rw-list small{display:block;color:var(--mut);font-size:12px;line-height:1.35;margin-top:2px}`;document.head.appendChild(st)})();
