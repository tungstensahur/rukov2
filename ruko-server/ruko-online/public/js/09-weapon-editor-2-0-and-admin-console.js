/* ---------- v9: weapon editor 2.0 and admin console ---------- */
function weaponMesh(d){const g=new THREE.Group(),c=(d&&d.c)||'#888888',M=x=>new THREE.MeshLambertMaterial({color:x}),dk=M('#2a2a2a'),b=(w,h,l,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),m||M(c));o.position.set(x,y,z);g.add(o)},m=(d&&d.m)||(d&&d.t=='melee'?'blade':'pistol');
 if(m=='blade'){b(.1,.06,1.6,0,0,.9);b(.35,.08,.1,0,0,.1,dk);b(.08,.08,.35,0,0,-.1,dk)}
 else if(m=='knife'){b(.08,.05,.8,0,0,.5);b(.1,.1,.3,0,0,-.05,dk)}
 else if(m=='hammer'){b(.1,.1,1.5,0,0,.6,dk);b(.5,.5,.9,0,0,1.3)}
 else if(m=='smg'){b(.14,.2,.7,0,0,.3);b(.1,.4,.14,0,-.25,.1,dk);b(.06,.06,.4,0,.02,.8,dk)}
 else if(m=='rifle'){b(.14,.2,1.5,0,0,.6);b(.12,.28,.35,0,-.1,-.2,dk);b(.1,.3,.12,0,-.25,.3,dk);b(.06,.06,.5,0,.02,1.55,dk)}
 else if(m=='shotgun'){b(.2,.2,1.3,0,0,.5);b(.14,.14,1.1,0,-.15,.6,dk);b(.14,.28,.4,0,-.1,-.2,dk)}
 else if(m=='sniper'){b(.12,.18,1.8,0,0,.7);b(.1,.16,.4,0,.2,.5,dk);b(.1,.28,.5,0,-.08,-.3,dk);b(.05,.05,.6,0,.02,1.9,dk)}
 else{b(.14,.22,.55,0,0,.3);b(.12,.32,.14,0,-.22,.1,dk)}
 return g}
const WF={n:'Custom',t:'gun',m:'pistol',dmg:20,cd:.5,rng:60,pel:1,spr:2,mag:10,rel:1.5,auto:false,c:'#aa33ff'};
Object.assign(WP,{
 sword:()=>({...WF,n:'Sword',t:'melee',m:'blade',dmg:25,cd:.5,rng:4.5,spr:0,mag:0,auto:true,c:'#c0c8d8'}),
 knife:()=>({...WF,n:'Knife',t:'melee',m:'knife',dmg:14,cd:.25,rng:3,spr:0,mag:0,auto:true,c:'#d0d0d0'}),
 hammer:()=>({...WF,n:'Hammer',t:'melee',m:'hammer',dmg:55,cd:1.1,rng:4,spr:0,mag:0,auto:false,c:'#7a5230'}),
 pistol:()=>({...WF,n:'Pistol',m:'pistol',dmg:15,cd:.35,rng:80,spr:1,mag:12,rel:1.2,auto:false,c:'#444444'}),
 smg:()=>({...WF,n:'SMG',m:'smg',dmg:8,cd:.08,rng:60,spr:5,mag:30,rel:1.6,auto:true,c:'#3a3a55'}),
 rifle:()=>({...WF,n:'Rifle',m:'rifle',dmg:11,cd:.12,rng:100,spr:3,mag:30,rel:2,auto:true,c:'#2f4f2f'}),
 shotgun:()=>({...WF,n:'Shotgun',m:'shotgun',dmg:9,cd:1,rng:35,pel:6,spr:9,mag:6,rel:2.2,auto:false,c:'#8b4513'}),
 sniper:()=>({...WF,n:'Sniper',m:'sniper',dmg:70,cd:1.4,rng:200,spr:0,mag:5,rel:2.5,auto:false,c:'#223344'}),
 custom:()=>({...WF})});
const wsum=x=>`${x.dmg}${x.t=='gun'&&x.pel>1?'×'+x.pel:''} dmg · ${(1/x.cd).toFixed(1)}/s · range ${x.rng}${x.mag>0?' · mag '+x.mag:''}`;
function wstats(w){const per=w.dmg*(w.t=='gun'?w.pel:1),hp=GE.hp||100,hits=Math.ceil(hp/per);let ttk=Math.max(0,(hits-1)*w.cd);if(w.mag>0&&hits>w.mag)ttk+=Math.floor((hits-1)/w.mag)*w.rel;const dps=per/w.cd,sd=w.mag>0?per*w.mag/(w.mag*w.cd+w.rel):dps;return`${hits} hit${hits>1?'s':''} to eliminate a ${hp} HP player · fastest kill ${ttk.toFixed(1)}s · ${dps.toFixed(0)} DPS${w.mag>0?' ('+sd.toFixed(0)+' counting reloads)':''}`}
function wpanelHtml(){return '<div id="wpanel"></div>'}
function wpanelBind(persist){wpanelRender(persist)}
function wpanelRender(persist){const P=$('#wpanel');if(!P)return;if(!Array.isArray(GE.startW))GE.startW=GE.startW>=0?[GE.startW]:[];
 const W=GE.weapons,w=W[GE.wsel],cl=(v,a,b,d)=>Math.max(a,Math.min(b,+v||d)),re=()=>wpanelRender(persist);
 const SLd=(k,n,a,b,s)=>`<label>${n}: <span data-wv="${k}">${w[k]}</span></label><input data-wk="${k}" type="range" min="${a}" max="${b}" step="${s}" value="${w[k]}">`;
 P.innerHTML=`<div style="border-top:1px solid var(--bd);margin-top:12px;padding-top:8px"><b>⚔️ PVP and weapons</b><label><input id="pvc" type="checkbox" ${GE.pvp?'checked':''}> PVP game (players can hurt each other on servers)</label><label>Player health</label><input id="hpn" type="number" min="20" max="500" value="${GE.hp}"><label>Respawn time (seconds)</label><input id="rsn" type="number" min="1" max="15" value="${GE.resp}">
 <label>Add a weapon (up to 6)</label><div class="chips">${Object.keys(WP).map(k=>`<button data-wp="${k}">+ ${k}</button>`).join('')}</div>
 ${W.map((x,i)=>`<div class="wc ${i==GE.wsel?'sel':''}" data-ws="${i}"><div><b>${esc(x.n)}</b> ${x.t=='gun'?'🔫':'🗡️'}<div class="mut" style="font-size:12px">${wsum(x)}</div></div><button data-wstar="${i}" title="Starting weapon (players spawn with it)">${GE.startW.includes(i)?'⭐ Start':'☆ Start'}</button></div>`).join('')||'<p class="mut">No weapons yet. Add one above, then place pickups on the map.</p>'}
 ${w?`<div style="margin-top:8px"><img id="wpv" alt="" style="width:100%;max-width:260px;border-radius:10px;background:var(--bg)"><p id="wst" class="mut" style="font-size:12px"></p><label>Name</label><input id="wn" maxlength="16" value="${esc(w.n)}"><label>Type</label><select id="wt"><option value="gun" ${w.t=='gun'?'selected':''}>Gun (shoots)</option><option value="melee" ${w.t=='melee'?'selected':''}>Melee (swings)</option></select><label>Look</label><select id="wm">${(w.t=='melee'?['blade','knife','hammer']:['pistol','smg','rifle','shotgun','sniper']).map(m=>`<option ${m==w.m?'selected':''}>${m}</option>`).join('')}</select>${SLd('dmg','Damage per hit',1,100,1)}${SLd('cd','Seconds between attacks',.05,3,.05)}${SLd('rng','Range',2,200,1)}${w.t=='gun'?SLd('pel','Pellets per shot',1,8,1)+SLd('spr','Spread (degrees)',0,20,.5)+SLd('mag','Magazine size (0 = never reload)',0,100,1)+SLd('rel','Reload time (seconds)',.5,5,.1):''}<label><input id="wa" type="checkbox" ${w.auto?'checked':''}> Hold to keep attacking (otherwise one attack per click)</label><label>Color</label><input id="wco" type="color" value="${w.c}"><div class="chips"><button id="wmap">Place on map</button><button id="wdu">Duplicate</button><button id="wdel">Delete</button></div></div>`:''}</div>`;
 const pv=()=>{if(!w)return;const m=weaponMesh(w);m.rotation.y=-.6;$('#wpv').src=shot(m,[2.4,1.2,2.4],[0,0,.7]);$('#wst').textContent=wstats(w)};
 $('#pvc').onchange=e=>{GE.pvp=e.target.checked;persist()};$('#hpn').oninput=e=>{GE.hp=cl(e.target.value,20,500,100);persist();if(w)$('#wst').textContent=wstats(w)};$('#rsn').oninput=e=>{GE.resp=cl(e.target.value,1,15,3);persist()};
 P.querySelectorAll('[data-wp]').forEach(b=>b.onclick=()=>{if(W.length>=6)return toast('Up to 6 weapons per game.');W.push(WP[b.dataset.wp]());GE.wsel=W.length-1;persist();re()});
 P.querySelectorAll('[data-ws]').forEach(d=>d.onclick=e=>{if(e.target.closest('[data-wstar]'))return;GE.wsel=+d.dataset.ws;re()});
 P.querySelectorAll('[data-wstar]').forEach(b=>b.onclick=()=>{const i=+b.dataset.wstar,k=GE.startW.indexOf(i);if(k>=0)GE.startW.splice(k,1);else if(GE.startW.length<3)GE.startW.push(i);else toast('Up to 3 starting weapons.');persist();re()});
 if(w){P.querySelectorAll('[data-wk]').forEach(i=>i.oninput=()=>{w[i.dataset.wk]=+i.value;P.querySelector(`[data-wv="${i.dataset.wk}"]`).textContent=i.value;$('#wst').textContent=wstats(w);persist()});
  $('#wn').oninput=e=>{w.n=e.target.value;persist()};
  $('#wt').onchange=e=>{w.t=e.target.value;w.m=w.t=='melee'?'blade':'pistol';if(w.t=='melee')w.mag=0;else if(!w.mag)w.mag=10;persist();re()};
  $('#wm').onchange=e=>{w.m=e.target.value;persist();pv()};$('#wa').onchange=e=>{w.auto=e.target.checked;persist()};$('#wco').oninput=e=>{w.c=e.target.value;persist();pv()};
  $('#wmap').onclick=()=>{const b=app.querySelector('[data-tl="weapon"]');if(b)b.click();scrollTo(0,0)};
  $('#wdu').onclick=()=>{if(W.length>=6)return toast('Up to 6 weapons per game.');W.push({...w,n:(w.n+' 2').slice(0,16)});GE.wsel=W.length-1;persist();re()};
  $('#wdel').onclick=()=>{const i=GE.wsel;W.splice(i,1);GE.objs=GE.objs.filter(o=>!(o.k=='w'&&o.wi==i)).map(o=>o.k=='w'&&o.wi>i?{...o,wi:o.wi-1}:o);GE.startW=GE.startW.filter(x=>x!=i).map(x=>x>i?x-1:x);GE.wsel=0;persist();re()};
  pv()}}
/* ----- admin console ----- */
let AD={tab:'all',q:'',pg:0,srt:{players:'online',items:'new',games:'new'},flt:{players:'all',items:'all',istat:'all',games:'all'},data:null,open:null};
const PGS=15,aq=()=>AD.q.trim().toLowerCase();
async function adminLoad(){const[u,a,p]=await Promise.all([api('/api/admin/users'),api('/api/admin/all'),api('/api/admin/pending')]);AD.data={users:(u&&u.users)||[],hats:(a&&a.hats)||[],games:(a&&a.games)||[],plays:(a&&a.plays)||{},sales:(a&&a.sales)||{},likes:(a&&a.likes)||{},pending:(p&&p.items)||[]}}
async function adminView(){app.innerHTML='<p class="mut">Loading admin tools…</p>';await adminLoad();adminShell()}
function adminShell(){app.innerHTML=`<h2>Admin</h2><input id="aq" placeholder="🔎 Search players, items and games" value="${esc(AD.q)}"><div class="chips" id="at"></div><div id="ab"></div>`;
 $('#aq').oninput=e=>{AD.q=e.target.value;AD.pg=0;adminTabs();adminBody()};$('#ab').onclick=adminClick;$('#at').onclick=adminClick;
 $('#ab').onchange=e=>{const s=e.target.closest('[data-sel]');if(!s)return;const[a,k]=s.dataset.sel.split(':');AD[a][k]=s.value;AD.pg=0;adminBody()};adminTabs();adminBody()}
const fPlayers=()=>{const q=aq(),f=AD.flt.players,s=AD.srt.players;return AD.data.users.filter(u=>(!q||u.name.toLowerCase().includes(q))&&(f=='all'||(f=='online'&&u.online)||(f=='banned'&&u.banned)||(f=='muted'&&u.muted)||(f=='admin'&&u.admin))).sort((a,b)=>s=='name'?a.name.localeCompare(b.name):s=='coins'?b.coins-a.coins:s=='joined'?(b.joined||0)-(a.joined||0):(b.online-a.online)||a.name.localeCompare(b.name))};
const fItems=()=>{const q=aq(),f=AD.flt.items,st=AD.flt.istat,s=AD.srt.items,S=AD.data.sales;return AD.data.hats.filter(h=>(!q||(h.name+' '+h.creator+' '+h.id).toLowerCase().includes(q))&&(f=='all'||(f=='shirts')==(h.kind=='shirt'))&&(st=='all'||(h.status||'approved')==st)).sort((a,b)=>s=='sales'?(S[b.id]||0)-(S[a.id]||0):s=='price'?b.price-a.price:s=='name'?a.name.localeCompare(b.name):(b.at||0)-(a.at||0))};
const fGames=()=>{const q=aq(),f=AD.flt.games,s=AD.srt.games,P=AD.data.plays;return AD.data.games.filter(g=>(!q||(g.name+' '+g.creator+' '+(g.genre||'')+' '+g.id).toLowerCase().includes(q))&&(f=='all'||g.pvp)).sort((a,b)=>s=='plays'?(P[b.id]||0)-(P[a.id]||0):s=='name'?a.name.localeCompare(b.name):(b.at||0)-(a.at||0))};
function adminTabs(){const pn=AD.data.hats.filter(h=>h.status==='pending').length;$('#at').innerHTML=[['all','Overview'],['review','Review'+(pn?' ('+pn+')':'')],['players','Players ('+fPlayers().length+')'],['items','Items ('+fItems().length+')'],['games','Games ('+fGames().length+')'],['tools','Tools']].map(([k,n])=>`<button data-act="tab" data-tab="${k}" class="${AD.tab==k?'on':''}">${n}</button>`).join('')}
const imgOf=h=>h.kind=='shirt'?`/api/shirt/${h.id}?token=${TOKEN}&v=${h.tv}`:thumb(h);
const op=k=>AD.open==k?'open':'';
function rowPlayer(u){const k='p:'+u.name,opts=[...DEF_HATS,...AD.data.hats.filter(h=>(h.status||'approved')=='approved')].map(h=>`<option value="${h.id}">${esc(h.name)}</option>`).join('');
 return `<details class="arow" data-k="${esc(k)}" ${op(k)}><summary><b>${esc(u.name)}</b> ${u.admin?'🛡️':''}${u.banned?' <span class="bd bad">banned</span>':''}${u.muted?' <span class="bd bad">muted</span>':''} <span class="mut">${u.online?'🟢':'⚪'} · 🪙 ${u.coins} · ${u.owned} items${u.joined?' · joined '+new Date(u.joined).toLocaleDateString():''}</span></summary><div class="abox"><div class="arw"><input data-f="coins" type="number" placeholder="Rukos (negative removes)"><button data-act="coins" data-id="${esc(u.name)}">Give Rukos</button></div><div class="arw"><select data-f="item">${opts}</select><button data-act="igive" data-id="${esc(u.name)}">Give item</button><button data-act="itake" data-id="${esc(u.name)}">Take item</button></div><div class="arw"><button data-u="${esc(u.name)}">View profile</button>${u.admin?'':`<button data-act="ban" data-id="${esc(u.name)}" data-v="${u.banned?0:1}">${u.banned?'Unban':'Ban'}</button><button data-act="mute" data-id="${esc(u.name)}" data-v="${u.muted?0:1}">${u.muted?'Unmute':'Mute'}</button>`}</div></div></details>`}
function rowItem(h){const k='i:'+h.id,S=AD.data.sales,st=h.status||'approved';
 return `<details class="arow" data-k="${esc(k)}" ${op(k)}><summary><img src="${imgOf(h)}" alt="" style="width:36px;height:36px;object-fit:contain;vertical-align:middle;border-radius:6px;background:var(--bg)"> <b>${esc(h.name)}</b> <span class="bd ${st=='approved'?'':'bad'}">${h.kind=='shirt'?'shirt · ':''}${st}</span> <span class="mut">by ${esc(h.creator)} · 🪙 ${h.price} · ${S[h.id]||0} sold · ❤ ${AD.data.likes[h.id]||0}</span></summary><div class="abox"><div class="arw"><input data-f="name" maxlength="20" value="${esc(h.name)}"><input data-f="price" type="number" min="0" max="1000" value="${h.price}" style="max-width:110px"></div><div class="arw"><button class="pri" data-act="isave" data-id="${h.id}">Save</button><button data-act="idel" data-id="${h.id}">Delete</button><button data-u="${esc(h.creator)}">Creator profile</button>${st=='pending'?`<button class="pri" data-act="approve" data-id="${h.id}">Approve</button><button data-act="reject" data-id="${h.id}">Reject</button>`:''}</div></div></details>`}
function rowGame(g){const k='g:'+g.id,P=AD.data.plays;
 return `<details class="arow" data-k="${esc(k)}" ${op(k)}><summary><b>${esc(g.name)}</b> <span class="bd">${esc(g.genre||'Obby')}</span>${g.pvp?' <span class="bd">PVP</span>':''} <span class="mut">by ${esc(g.creator)} · ▶ ${P[g.id]||0} plays</span></summary><div class="abox"><div class="arw"><input data-f="name" maxlength="24" value="${esc(g.name)}"></div><div class="arw"><input data-f="desc" maxlength="80" value="${esc(g.desc||'')}"></div><div class="arw"><button class="pri" data-act="gsave" data-id="${g.id}">Save</button>${g.ht?`<button data-act="gthumb" data-id="${g.id}">Remove thumbnail</button>`:''}<button data-act="gdel" data-id="${g.id}">Delete</button><button data-u="${esc(g.creator)}">Creator profile</button></div></div></details>`}
const sel=(a,k,o)=>`<select data-sel="${a}:${k}" style="flex:1;min-width:130px">${o.map(([v,n])=>`<option value="${v}" ${AD[a][k]==v?'selected':''}>${n}</option>`).join('')}</select>`;
const pager=n=>{const pc=Math.max(1,Math.ceil(n/PGS));if(AD.pg>=pc)AD.pg=pc-1;return pc>1?`<div class="arw" style="justify-content:center"><button data-act="pg" data-pg="${AD.pg-1}" ${AD.pg?'':'disabled'}>‹ Prev</button><span class="mut">Page ${AD.pg+1} of ${pc}</span><button data-act="pg" data-pg="${AD.pg+1}" ${AD.pg<pc-1?'':'disabled'}>Next ›</button></div>`:''};
function adminBody(){const B=$('#ab'),D=AD.data,t=AD.tab,pn=D.hats.filter(h=>h.status==='pending');adminTabs();
 if(t=='all'){const q=aq();
  if(!q){const tp=Object.values(D.plays).reduce((a,b)=>a+b,0),ts=Object.values(D.sales).reduce((a,b)=>a+b,0),card=(n,l)=>`<div class="card" style="text-align:center"><b style="font-size:22px">${n}</b><div class="mut" style="font-size:12px">${l}</div></div>`;
   B.innerHTML=`<div class="grid">${card(D.users.length,'players')}${card(D.users.filter(u=>u.online).length,'online now')}${card(D.hats.filter(h=>h.kind!='shirt').length,'hats')}${card(D.hats.filter(h=>h.kind=='shirt').length,'shirts')}${card(D.games.length,'games')}${card(tp,'game plays')}${card(ts,'items sold')}${card(pn.length,'waiting for review')}</div><p class="mut">Type in the search box to find players, items and games in one go.</p>${pn.length?'<button class="pri" data-act="tab" data-tab="review">Review '+pn.length+' pending shirt'+(pn.length>1?'s':'')+'</button>':''}`}
  else{const sec=(title,L,fn,tab)=>`<h3>${title} (${L.length})</h3>${L.slice(0,6).map(fn).join('')||'<p class="mut">No matches.</p>'}${L.length>6?`<button data-act="tab" data-tab="${tab}">See all ${L.length}</button>`:''}`;
   B.innerHTML=sec('Players',fPlayers(),rowPlayer,'players')+sec('Items',fItems(),rowItem,'items')+sec('Games',fGames(),rowGame,'games')}}
 else if(t=='review'){B.innerHTML=pn.map(h=>`<div class="card" style="margin-bottom:8px"><div style="display:flex;gap:10px"><img src="${imgOf(h)}" alt="" style="width:120px;height:120px;object-fit:contain;border-radius:8px;background:var(--bg)"><div><b>${esc(h.name)}</b><div class="mut" style="font-size:12px">by <u data-u="${esc(h.creator)}" style="cursor:pointer">${esc(h.creator)}</u> · 🪙 ${h.price}</div><div class="chips"><button class="pri" data-act="approve" data-id="${h.id}">Approve</button><button data-act="reject" data-id="${h.id}">Reject</button></div></div></div></div>`).join('')||'<p class="mut">Nothing is waiting for review.</p>'}
 else if(t=='players'){const L=fPlayers();B.innerHTML=`<div class="arw">${sel('flt','players',[['all','All players'],['online','Online now'],['banned','Banned'],['muted','Muted'],['admin','Admins']])}${sel('srt','players',[['online','Online first'],['name','Name'],['coins','Most Rukos'],['joined','Newest']])}</div>${L.slice(AD.pg*PGS,AD.pg*PGS+PGS).map(rowPlayer).join('')||'<p class="mut">No players match.</p>'}${pager(L.length)}`}
 else if(t=='items'){const L=fItems();B.innerHTML=`<div class="arw">${sel('flt','items',[['all','Hats and shirts'],['hats','Hats only'],['shirts','Shirts only']])}${sel('flt','istat',[['all','Any status'],['approved','Approved'],['pending','Pending'],['rejected','Rejected']])}${sel('srt','items',[['new','Newest'],['sales','Best selling'],['price','Highest price'],['name','Name']])}</div>${L.slice(AD.pg*PGS,AD.pg*PGS+PGS).map(rowItem).join('')||'<p class="mut">No items match. (The six built-in hats are part of the site and are not listed here.)</p>'}${pager(L.length)}`}
 else if(t=='games'){const L=fGames();B.innerHTML=`<div class="arw">${sel('flt','games',[['all','All games'],['pvp','PVP only']])}${sel('srt','games',[['new','Newest'],['plays','Most visited'],['name','Name']])}</div>${L.slice(AD.pg*PGS,AD.pg*PGS+PGS).map(rowGame).join('')||'<p class="mut">No games match.</p>'}${pager(L.length)}`}
 else B.innerHTML=`<div class="card"><b>Give everyone Rukos</b><div class="arw" style="margin-top:6px"><input id="ga" type="number" placeholder="Amount (negative removes)"><button data-act="all">Give all</button></div></div><div class="card" style="margin-top:8px"><b>Backup</b><p class="mut" style="font-size:13px">Downloads every account, item, game and sale as one file.</p><button data-act="backup">Download full backup</button></div>`}
async function adminClick(e){const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,id=b.dataset.id,box=b.closest('details')||document,v=s=>{const el=box.querySelector(s);return el?el.value:''};
 if(a=='tab'){AD.tab=b.dataset.tab;AD.pg=0;adminBody();return}
 if(a=='gedit'){editGame(id);return}
 if(a=='pg'){AD.pg=+b.dataset.pg;adminBody();$('#ab').scrollIntoView();return}
 if(a=='backup'){const r=await api('/api/admin/export');if(!r||r.error)return toast('Backup failed.');const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify(r)],{type:'application/json'}));l.download='ruko-backup.json';l.click();return}
 let r;
 if(a=='coins')r=await api('/api/admin/grant',{user:id,coins:+v('[data-f=coins]')||0});
 else if(a=='igive')r=await api('/api/admin/grant',{user:id,hat:v('[data-f=item]')});
 else if(a=='itake')r=await api('/api/admin/grant',{user:id,hat:v('[data-f=item]'),take:1});
 else if(a=='ban')r=await api('/api/admin/grant',{user:id,ban:+b.dataset.v});
 else if(a=='mute')r=await api('/api/admin/grant',{user:id,mute:+b.dataset.v});
 else if(a=='all')r=await api('/api/admin/grant',{all:1,coins:+$('#ga').value||0});
 else if(a=='restore')r=await api('/api/admin/restore',{});
 else if(a=='isave')r=await api('/api/admin/hat',{id,action:'edit',name:v('[data-f=name]'),price:+v('[data-f=price]')});
 else if(a=='idel'){if(!confirm('Delete this item for everyone?'))return;r=await api('/api/admin/hat',{id,action:'delete'})}
 else if(a=='approve')r=await api('/api/admin/review',{id,approve:1});
 else if(a=='reject'){const n=prompt('Reason (optional)')||'';r=await api('/api/admin/review',{id,approve:0,note:n})}
 else if(a=='gsave')r=await api('/api/admin/game',{id,action:'edit',name:v('[data-f=name]'),desc:v('[data-f=desc]')});
 else if(a=='gthumb')r=await api('/api/admin/game',{id,action:'edit',dropThumb:1});
 else if(a=='gdel'){if(!confirm('Delete this game for everyone?'))return;r=await api('/api/admin/game',{id,action:'delete'})}
 if(r&&r.error)toast(r.error);else toast('Done',true);
 const d=b.closest('details');AD.open=d?d.dataset.k:null;await adminLoad();loadAll();adminBody()}
