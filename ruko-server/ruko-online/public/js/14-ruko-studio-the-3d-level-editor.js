/* ---------- v14: Ruko Studio, the 3D level editor ---------- */
let CTAB='hat';
const TYPEINFO={solid:['⬜','Platform'],lava:['🟧','Lava'],bounce:['🟩','Bounce pad'],check:['🔵','Checkpoint'],goal:['🟡','Goal'],crumble:['🟫','Crumbling']};
const INS=[['Platforms',[['p','solid','⬜','Platform'],['p','lava','🟧','Lava'],['p','bounce','🟩','Bounce pad'],['p','check','🔵','Checkpoint'],['p','goal','🟡','Goal'],['p','crumble','🟫','Crumbling'],['p','move','↔️','Moving'],['p','wall','🧱','Wall']]],['Items',[['c','','🪙','Coin'],['s','','🚩','Spawn'],['w','','🔫','Weapon']]],['Decorations',[['d','box','▢','Block'],['d','sphere','●','Ball'],['d','cone','▲','Cone'],['d','cylinder','⬭','Cylinder'],['d','pyramid','⛰️','Pyramid']]]];
const AXD={x:[1,0,0,0xe5484d],y:[0,1,0,0x35c45f],z:[0,0,1,0x4b9bff]},SNAPS=[[0,'Off'],[.25,'0.25'],[.5,'0.5'],[1,'1'],[2,'2'],[5,'5']];
const RG={x:[-200,200],y:[-20,200],z:[-200,200],sx:[.5,200],sz:[.5,200],th:[.25,40],sy:[.2,40],d:[1,60],s:[.2,8]};
let STU=null;
const cenOf=o=>o.k=='p'?[o.x,o.y-(o.th||.5)/2,o.z]:o.k=='d'?[o.x,o.y+o.sy/2,o.z]:o.k=='s'?[o.x,o.y+.3,o.z]:o.k=='w'?[o.x,o.y+1,o.z]:[o.x,o.y,o.z];
function gameEd(me){
 const D0={name:'My Game',desc:'A game I made.',genre:'Obby',sky:'#8fd3ff',light:1,fog:true,killY:-15,spd:7,jmp:9,grav:22,objs:TPL.blank(),sel:-1,tool:'move',tab:'props',snap:.5,thumb:null,editId:null,keepThumb:false,pvp:false,hp:100,resp:3,weapons:[],startW:[],wsel:0,scripts:[]};
 GE=Object.assign({},D0,GE||ls.get('ruko_draft',null)||{});GE.hist=[];GE.redo=[];if(!Array.isArray(GE.startW))GE.startW=GE.startW>=0?[GE.startW]:[];GE.scripts=GE.scripts||[];GE.objs.forEach(o=>{if(!o.u)o.u=nuid()});
 if(!['select','move','scale'].includes(GE.tool))GE.tool='move';if(GE.sel>=GE.objs.length)GE.sel=-1;
 if(STU){try{STU.r.dispose()}catch(e){}STU=null}
 const E=$('#ed'),O=()=>GE.objs,fm=v=>+(+v).toFixed(2),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),snv=()=>+GE.snap||0,sn=v=>snv()?Math.round(v/snv())*snv():fm(v);
 const icon=o=>o.k=='p'?(TYPEINFO[o.t]||TYPEINFO.solid)[0]:o.k=='c'?'🪙':o.k=='s'?'🚩':o.k=='w'?'🔫':'▢';
 const label=(o,i)=>(o.nm||(o.k=='p'?(TYPEINFO[o.t]||TYPEINFO.solid)[1]:o.k=='c'?'Coin':o.k=='s'?'Spawn':o.k=='w'?((GE.weapons[o.wi]||{}).n||'Weapon'):'Decoration'))+' '+i;
 const toolbox=()=>INS.map(([g,L])=>`<div class="stg">${g}</div><div class="stgrid">${L.map(([k,t,ic,n])=>`<button data-ins="${k}:${t}" ${k=='w'?'data-tl="weapon"':''}><span>${ic}</span>${n}</button>`).join('')}</div>`).join('');
 E.innerHTML=`<div class="stu" id="stu"><div class="stu-top"><b>◆ Ruko Studio</b><span class="mut" id="stn"></span><span class="sp"></span><button id="tst">▶ Test</button><button class="pri" id="pub">${GE.editId?'Update':'Publish'}</button></div>
 <div class="stu-bar sc">${[['select','⬚ Select'],['move','✥ Move'],['scale','⤢ Scale']].map(([k,n])=>`<button data-tool="${k}">${n}</button>`).join('')}<span class="sep"></span><button id="un">↶</button><button id="re">↷</button><span class="sep"></span><select id="snp">${SNAPS.map(([v,n])=>`<option value="${v}">Snap ${n}</option>`).join('')}</select><span class="sep"></span><button id="du">⧉ Duplicate</button><button id="dl">🗑 Delete</button><button id="fc">⌖ Focus</button></div>
 <div class="stu-main"><div class="stu-tb" id="tb1">${toolbox()}</div><div class="stu-vp" id="vp"><canvas id="cv"></canvas><div class="stu-hint">Drag to look · right-drag or two fingers to pan · scroll or pinch to zoom · tap an object to select</div></div>
 <div class="stu-side"><div class="stu-tabs"><button data-tab="tools" class="mo">Toolbox</button><button data-tab="props">Properties</button><button data-tab="ex">Explorer</button><button data-tab="code">Code</button><button data-tab="game">Game</button></div>
  <div class="stu-pn" data-p="tools" id="tb2">${toolbox()}</div><div class="stu-pn" data-p="props" id="pp"></div><div class="stu-pn" data-p="ex" id="exl"></div><div class="stu-pn" data-p="code" id="cd"></div>
  <div class="stu-pn" data-p="game"><label>Name</label><input id="gn" maxlength="24" value="${esc(GE.name)}"><label>Description</label><input id="gd" maxlength="80" value="${esc(GE.desc)}"><label>Genre</label><select id="gg">${GEN.map(x=>`<option ${x==GE.genre?'selected':''}>${x}</option>`).join('')}</select><label>Sky color</label><input id="gs" type="color" value="${GE.sky}"><label>Brightness</label><input id="gl" type="range" min=".3" max="1.6" step=".05" value="${GE.light}"><label><input id="gf" type="checkbox" ${GE.fog?'checked':''}> Distance fog</label><label>Void height (falling below respawns you)</label><input id="gk" type="number" value="${GE.killY}"><label>Walk speed (4-14)</label><input id="sp" type="number" value="${GE.spd}"><label>Jump power (6-16)</label><input id="jp" type="number" value="${GE.jmp}"><label>Gravity (10-40)</label><input id="gr" type="number" value="${GE.grav}">
   <div style="border-top:1px solid var(--bd);margin-top:12px;padding-top:8px"><b>Game thumbnail</b><img id="tm" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px;margin-top:8px;display:none"><div class="chips"><button id="tu">Upload image</button><button id="tp3">Use a screenshot</button><button id="tx">Remove</button></div><input id="tf" type="file" accept="image/*" style="display:none"></div>
   <div id="wpanel"></div><label>Load a template (replaces the level)</label><select id="tp"><option value="">Choose…</option><option value="blank">Blank</option><option value="obby">Obby</option><option value="park">Coin park</option><option value="arena">Arena (PVP)</option></select><button id="nw" style="width:100%;margin-top:8px">${GE.editId?'Start a new game instead':'Reset editor'}</button></div></div></div></div>`;
 /* ----- 3D viewport ----- */
 const vp=$('#vp'),cv=$('#cv'),R3=new THREE.WebGLRenderer({canvas:cv,antialias:true,preserveDrawingBuffer:true});R3.setPixelRatio(Math.min(devicePixelRatio||1,2));STU={r:R3,el:vp};
 const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(55,1,.1,900),hl=new THREE.HemisphereLight(0xffffff,0x555566,.9),dl=new THREE.DirectionalLight(0xffffff,.6);dl.position.set(30,60,20);sc.add(hl,dl,new THREE.GridHelper(400,200,0x667085,0x3a3f4b));
 const world=new THREE.Group();sc.add(world);let roots=[],gz=null,bh=null;const V={yaw:.7,pitch:.6,dist:32,t:[0,0,0]};
 const kill=g=>g.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>x.dispose())});
 const mkRoot=(o,i)=>{const g=new THREE.Group();g.userData.i=i;let m;
  if(o.k=='p'){const th=o.th||.5,geo=new THREE.BoxGeometry(o.sx,th,o.sz);m=new THREE.Mesh(geo,matMat(o,TC(o)));g.add(m);const ed=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:.35}));ed.raycast=()=>{};g.add(ed);
   if(o.mv){const d=o.mv.d,a=o.mv.a,pts=a=='x'?[[-d,0,0],[d,0,0]]:a=='z'?[[0,0,-d],[0,0,d]]:[[0,-d,0],[0,d,0]],ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(q=>new THREE.Vector3(q[0],q[1],q[2]))),new THREE.LineBasicMaterial({color:0xffffff}));ln.raycast=()=>{};g.add(ln)}}
  else if(o.k=='d'){m=new THREE.Mesh((GEO[o.shape]||GEO.box)(),new THREE.MeshLambertMaterial({color:o.c}));m.scale.set(o.sx,o.sy,o.sz);g.add(m)}
  else if(o.k=='c'){m=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.1,16),new THREE.MeshLambertMaterial({color:'#ffc800'}));m.rotation.x=1.5708;g.add(m)}
  else if(o.k=='s'){m=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.12,20),new THREE.MeshLambertMaterial({color:'#39d353'}));m.position.y=-.24;g.add(m);const c2=new THREE.Mesh(new THREE.ConeGeometry(.3,.9,12),new THREE.MeshLambertMaterial({color:'#39d353'}));c2.position.y=.15;g.add(c2)}
  else if(o.k=='w'){const wm=weaponMesh(GE.weapons[o.wi]||{});wm.position.z=-.5;wm.scale.setScalar(1.1);g.add(wm)}
  const c=cenOf(o);g.position.set(c[0],c[1],c[2]);return g};
 const buildGizmo=mode=>{const g=new THREE.Group();for(const k of['x','y','z']){const col=AXD[k][3],mat=new THREE.MeshBasicMaterial({color:col,depthTest:false,transparent:true}),h=new THREE.Group(),sh=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1,8),mat),tip=mode=='scale'?new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),mat):new THREE.Mesh(new THREE.ConeGeometry(.13,.32,12),mat),hit=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,1.5,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthTest:false}));
  sh.position.y=.5;tip.position.y=1.06;hit.position.y=.75;[sh,tip,hit].forEach(q=>{q.renderOrder=20;q.userData.axis=k;h.add(q)});if(k=='x')h.rotation.z=-Math.PI/2;else if(k=='z')h.rotation.x=Math.PI/2;g.add(h)}return g};
 const camSet=()=>{const cp=Math.cos(V.pitch);cam.position.set(V.t[0]+Math.sin(V.yaw)*cp*V.dist,V.t[1]+Math.sin(V.pitch)*V.dist,V.t[2]+Math.cos(V.yaw)*cp*V.dist);cam.lookAt(V.t[0],V.t[1],V.t[2])};
 const placeGizmo=()=>{const o=O()[GE.sel];if(!gz||!o)return;const c=cenOf(o);gz.position.set(c[0],c[1],c[2]);gz.scale.setScalar(Math.max(.4,cam.position.distanceTo(gz.position)*.14));if(bh)bh.update()};
 let rq=0;const redraw=()=>{if(rq)return;rq=1;requestAnimationFrame(()=>{rq=0;if(!vp.isConnected)return;sc.background=new THREE.Color(GE.sky);hl.intensity=.9*GE.light;camSet();placeGizmo();R3.render(sc,cam)})};
 const selVis=()=>{if(bh){sc.remove(bh);bh=null}if(gz){sc.remove(gz);gz=null}const o=O()[GE.sel];if(!o||!roots[GE.sel])return;bh=new THREE.BoxHelper(roots[GE.sel],0x2f80ed);sc.add(bh);if(GE.tool!='select'){gz=buildGizmo(GE.tool=='scale'&&(o.k=='p'||o.k=='d')?'scale':'move');sc.add(gz)}placeGizmo()};
 const rebuild=()=>{while(world.children.length)kill(world.children.pop());roots=O().map((o,i)=>{const r=mkRoot(o,i);world.add(r);return r});selVis()};
 const updObj=i=>{world.remove(roots[i]);kill(roots[i]);roots[i]=mkRoot(O()[i],i);world.add(roots[i]);selVis()};
 const rs=()=>{const w=vp.clientWidth||320,h=vp.clientHeight||320;R3.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();redraw()};
 if(typeof ResizeObserver!='undefined')new ResizeObserver(rs).observe(vp);else addEventListener('resize',()=>{if(vp.isConnected)rs()});
 /* ----- state helpers ----- */
 let pt0=0;const persist=()=>{clearTimeout(pt0);pt0=setTimeout(()=>ls.set('ruko_draft',{...GE,hist:[],redo:[],sel:-1}),400)};
 const snapH=()=>{GE.hist.push(JSON.stringify(O()));if(GE.hist.length>80)GE.hist.shift();GE.redo=[]};
 const gat=(x,z)=>Math.max(0,...O().filter(o=>o.k=='p'&&Math.abs(x-o.x)<=o.sx/2&&Math.abs(z-o.z)<=o.sz/2).map(o=>o.y));
 const fit=()=>{let a=1e9,b=-1e9,c=1e9,d=-1e9,hy=0;O().forEach(o=>{const hx=(o.sx||1)/2,hz=(o.sz||1)/2;a=Math.min(a,o.x-hx);b=Math.max(b,o.x+hx);c=Math.min(c,o.z-hz);d=Math.max(d,o.z+hz);hy=Math.max(hy,o.y)});if(a>b){a=b=c=d=0}V.t=[(a+b)/2,hy/2,(c+d)/2];V.dist=Math.max(18,Math.max(b-a,d-c,hy)*1.15);redraw()};
 const focus=()=>{const o=O()[GE.sel];if(!o)return fit();V.t=cenOf(o);V.dist=Math.max(8,((o.sx||2)+(o.sz||2))*1.2);redraw()};
 const setTab=t=>{if(t=='tools'&&innerWidth>900)t='props';GE.tab=t;E.querySelectorAll('[data-p]').forEach(p=>p.classList.toggle('on',p.dataset.p==t));E.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab==t));if(t=='code')codeRender()};
 const setTool=t=>{GE.tool=t;E.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool==t));selVis();redraw();persist()};
 const exRender=()=>{if(GE.tab=='code')codeRender();$('#exl').innerHTML=O().map((o,i)=>`<div class="ex ${i==GE.sel?'sel':''}" data-ex="${i}"><span>${icon(o)}</span> ${esc(label(o,i))}${o.mv?' ↔':''}</div>`).join('')||'<p class="mut">The level is empty. Add things from the Toolbox.</p>';$('#exl').querySelectorAll('[data-ex]').forEach(d=>d.onclick=()=>select(+d.dataset.ex));const s=$('#exl').querySelector('.sel');if(s&&s.scrollIntoView)s.scrollIntoView({block:'nearest'})};
 const stat=()=>{const ps=O().filter(o=>o.k=='p');$('#stn').textContent=`${GE.name} · ${ps.length} platforms · ${O().filter(o=>o.k=='c').length} coins${ps.some(o=>o.t=='goal')?'':' · no goal yet'}`};
 const all=()=>{rebuild();propsRender();exRender();stat();redraw();persist()};
 const select=i=>{GE.sel=i;selVis();propsRender();exRender();if(GE.tab=='code')codeRender();redraw();if(i>=0&&GE.tab!=='code')setTab('props')};
 const undo=()=>{if(!GE.hist.length)return;GE.redo.push(JSON.stringify(O()));GE.objs=JSON.parse(GE.hist.pop());if(GE.sel>=O().length)GE.sel=-1;all()},redo=()=>{if(!GE.redo.length)return;GE.hist.push(JSON.stringify(O()));GE.objs=JSON.parse(GE.redo.pop());if(GE.sel>=O().length)GE.sel=-1;all()};
 const dup=()=>{const o=O()[GE.sel];if(!o||(o.k=='s'&&O().filter(q=>q.k=='s').length>=8)||O().length>=300)return;snapH();const st=snv()||1;O().push({...o,mv:o.mv?{...o.mv}:undefined,x:o.x+st*2,z:o.z+st*2});GE.sel=O().length-1;all()};
 const del=()=>{const o=O()[GE.sel];if(!o||(o.k=='s'&&O().filter(q=>q.k=='s').length<2))return;snapH();O().splice(GE.sel,1);GE.sel=-1;if(o.u)GE.scripts=GE.scripts.filter(s=>s.h.o!==o.u);all()};
 const ins=(k,t)=>{if(O().length>=300)return toast('Up to 300 objects per game.');if(k=='w'&&!GE.weapons.length)return toast('Add a weapon in the Game tab first.');if(k=='s'&&O().filter(q=>q.k=='s').length>=8)return toast('Up to 8 spawn points.');
  const x=sn(V.t[0]),z=sn(V.t[2]),g=gat(x,z);let o;
  if(k=='p'){const wall=t=='wall',mv=t=='move';o={k:'p',t:wall||mv?'solid':t,x,y:wall?g+4:g+1,z,sx:wall?6:6,sz:wall?.6:6,th:wall?4:.5,c:wall?'#8a6d4b':'#7c6cff',u:nuid()};if(mv)o.mv={a:'x',d:6,s:1}}
  else if(k=='c')o={k:'c',x,y:g+1.2,z,u:nuid()};else if(k=='s')o={k:'s',x,y:g,z,u:nuid()};else if(k=='w')o={k:'w',wi:Math.min(GE.wsel,GE.weapons.length-1),x,y:g,z,u:nuid()};else o={k:'d',shape:t,x,y:g,z,sx:2,sy:2,sz:2,c:'#a8743a',u:nuid()};
  snapH();O().push(o);GE.sel=O().length-1;if(GE.tool=='select')GE.tool='move';E.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool==GE.tool));all();setTab('props')};
 /* ----- properties panel ----- */
 const setV=(k,v,quiet)=>{const o=O()[GE.sel];if(!o)return;const r=RG[k]||[-1e4,1e4],lo=(o.k=='d'&&(k=='sx'||k=='sz'))?.2:r[0];o[k]=fm(cl(+v||0,lo,r[1]));if(k=='sx'||k=='sz'||k=='th'||k=='sy'||k=='nm'||o.k=='p')updObj(GE.sel);else{roots[GE.sel].position.set(...cenOf(o));if(bh)bh.update()}syncP();redraw();persist()};
 const syncP=()=>{const o=O()[GE.sel];if(!o)return;$('#pp').querySelectorAll('[data-nv]').forEach(i=>{if(document.activeElement!==i){const k=i.dataset.nv;i.value=fm(k=='d'||k=='s'?(o.mv?o.mv[k]:0):o[k])}})};
 const hold=(b,fn)=>{let t=0,iv=0;const stop=()=>{clearTimeout(t);clearInterval(iv)};b.onpointerdown=e=>{e.preventDefault();fn();t=setTimeout(()=>{iv=setInterval(fn,90)},350)};['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,stop))};
 function propsRender(){const P=$('#pp'),o=O()[GE.sel];
  if(!o){const ps=O().filter(q=>q.k=='p');P.innerHTML=`<p class="mut">Nothing selected. Tap an object in the viewport or the Explorer, or add one from the Toolbox.</p><div class="stbox"><b>Your level</b><div>${ps.length} platforms · ${O().filter(q=>q.k=='c').length} coins · ${O().filter(q=>q.k=='s').length} spawn point(s)</div>${ps.some(q=>q.t=='goal')?'<div>✅ Has a goal</div>':'<div>💡 Add a Goal platform so players can win</div>'}${O().some(q=>q.k=='s')?'':'<div>💡 Add a Spawn point</div>'}</div>`;return}
  const nr=(k,l,st,v)=>`<div class="nr"><label>${l}</label><div class="nrc"><button data-nd="${k}" data-st="${st}">−</button><input type="number" data-nv="${k}" step="any" value="${fm(v)}"><button data-ni="${k}" data-st="${st}">＋</button></div></div>`,ps=snv()||.5;
  P.innerHTML=`<div class="phead">${icon(o)} <b>${esc(label(o,GE.sel))}</b></div><label>Name</label><input data-f="nm" maxlength="16" value="${esc(o.nm||'')}" placeholder="Optional">
  ${o.k=='p'?`<label>Type</label><select data-f="t">${Object.keys(TYPEINFO).map(k=>`<option value="${k}" ${k==o.t?'selected':''}>${TYPEINFO[k][1]}</option>`).join('')}</select><label>Material</label><select data-f="mat">${Object.keys(MATN).map(k=>`<option value="${k}" ${(o.mat||'none')==k?'selected':''}>${MATN[k]}</option>`).join('')}</select>`:''}
  ${o.k=='d'?`<label>Shape</label><select data-f="shape">${['box','sphere','cone','cylinder','pyramid','prism'].map(s=>`<option ${s==o.shape?'selected':''}>${s}</option>`).join('')}</select>`:''}
  ${o.k=='w'?`<label>Weapon</label><select data-f="wi">${GE.weapons.map((w,i)=>`<option value="${i}" ${i==o.wi?'selected':''}>${esc(w.n)}</option>`).join('')}</select>`:''}
  ${o.k=='p'||o.k=='d'?`<label>Color${o.k=='p'?' (used when Material is None)':''}</label><input type="color" data-f="c" value="${o.c}"><div class="pal">${PAL.map(c=>`<button data-pal="${c}" style="background:${c}"></button>`).join('')}</div>`:''}
  <div class="stg">Position</div>${nr('x','X',ps,o.x)}${nr('y','Height',ps,o.y)}${nr('z','Z',ps,o.z)}
  ${o.k=='p'?`<div class="stg">Size</div>${nr('sx','Width',ps,o.sx)}${nr('sz','Depth',ps,o.sz)}${nr('th','Thickness',ps,o.th||.5)}<div class="stg">Movement</div><label>Moves</label><select data-f="mva">${[['none','Stays still'],['x','Left-right'],['z','Forward-back'],['y','Up-down']].map(([v,n])=>`<option value="${v}" ${(o.mv?o.mv.a:'none')==v?'selected':''}>${n}</option>`).join('')}</select>${o.mv?nr('d','Distance',1,o.mv.d)+nr('s','Speed',.1,o.mv.s):''}`:''}
  ${o.k=='d'?`<div class="stg">Size</div>${nr('sx','Width',ps,o.sx)}${nr('sy','Height',ps,o.sy)}${nr('sz','Depth',ps,o.sz)}`:''}
  <div class="chips"><button data-act="du">⧉ Duplicate</button><button data-act="dl">🗑 Delete</button></div>`;
  const setMv=(k,v)=>{const o2=O()[GE.sel];if(o2.mv)o2.mv[k]=cl(v,RG[k][0],RG[k][1]);updObj(GE.sel);syncP();redraw();persist()};
  P.querySelectorAll('[data-nv]').forEach(i=>{const k=i.dataset.nv;i.onfocus=snapH;i.onchange=()=>k=='d'||k=='s'?setMv(k,+i.value):setV(k,+i.value)});
  const stp=(b,sg)=>{const k=(b.dataset.nd||b.dataset.ni),st=+b.dataset.st;hold(b,()=>{snapH();const o2=O()[GE.sel],cur=k=='d'||k=='s'?(o2.mv?o2.mv[k]:0):(o2[k]!=null?o2[k]:o2.th||.5);if(k=='d'||k=='s')setMv(k,fm(cur+sg*st));else setV(k,sn(cur+sg*st))})};
  P.querySelectorAll('[data-nd]').forEach(b=>stp(b,-1));P.querySelectorAll('[data-ni]').forEach(b=>stp(b,1));
  P.querySelectorAll('[data-f]').forEach(f=>{const k=f.dataset.f;f.onfocus=()=>{if(k=='c')snapH()};f.oninput=f.onchange=()=>{const o2=O()[GE.sel];
   if(k=='mva'){snapH();o2.mv=f.value=='none'?undefined:{a:f.value,d:o2.mv?o2.mv.d:6,s:o2.mv?o2.mv.s:1};updObj(GE.sel);propsRender();redraw();persist();return}
   if(k=='nm'){o2.nm=f.value;exRender();$('#pp .phead b').textContent=label(o2,GE.sel);persist();return}
   if(String(o2[k])===String(k=='wi'?+f.value:f.value))return;if(k!='c')snapH();o2[k]=k=='wi'?+f.value:f.value;updObj(GE.sel);if(k=='t'||k=='shape'||k=='wi'){exRender();propsRender()}redraw();persist()}});
  P.querySelectorAll('[data-pal]').forEach(b=>b.onclick=()=>{snapH();O()[GE.sel].c=b.dataset.pal;updObj(GE.sel);const ci=P.querySelector('[data-f=c]');if(ci)ci.value=b.dataset.pal;redraw();persist()});
  P.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>b.dataset.act=='du'?dup():del())}
 /* ----- mouse / touch controls ----- */
 const rc=new THREE.Raycaster(),nd=new THREE.Vector2();
 const ray=e=>{const r=cv.getBoundingClientRect();nd.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);rc.setFromCamera(nd,cam)};
 const pickGz=e=>{if(!gz)return null;ray(e);const h=rc.intersectObjects(gz.children,true).find(x=>x.object.userData.axis);return h?h.object.userData.axis:null};
 const pickObj=e=>{ray(e);const h=rc.intersectObjects(roots,true)[0];if(!h)return -1;let q=h.object;while(q&&q.userData.i==null)q=q.parent;return q?q.userData.i:-1};
 const lp=axis=>{const O1=rc.ray.origin,R1=rc.ray.direction,c=drag.c0,D=AXD[axis],w=[c[0]-O1.x,c[1]-O1.y,c[2]-O1.z],b=D[0]*R1.x+D[1]*R1.y+D[2]*R1.z,d=D[0]*w[0]+D[1]*w[1]+D[2]*w[2],ee=R1.x*w[0]+R1.y*w[1]+R1.z*w[2],den=1-b*b;return den<1e-5?null:(b*ee-d)/den};
 let drag=null,mode=null,moved=0;const ptrs=new Map();let pp0=null;
 cv.oncontextmenu=e=>e.preventDefault();
 cv.onwheel=e=>{e.preventDefault();V.dist=cl(V.dist*(e.deltaY>0?1.12:.89),3,300);redraw()};
 cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size==2){mode='pinch';drag=null;const[a,b]=[...ptrs.values()];pp0={d:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2};return}
  const ax=pickGz(e),o=O()[GE.sel];
  if(ax&&o){ray(e);const mdv=GE.tool=='scale'&&(o.k=='p'||o.k=='d')?'scale':'move';drag={axis:ax,o0:{...o},c0:cenOf(o),mode:mdv};drag.s0=lp(ax);if(drag.s0==null){drag=null}else{snapH();mode='drag';return}}
  mode=(e.button==2||e.button==1||e.shiftKey)?'pan':'orbit';moved=0};
 cv.onpointermove=e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(mode=='pinch'&&ptrs.size==2){const[a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),cx=(a.x+b.x)/2,cy2=(a.y+b.y)/2;if(pp0&&pp0.d>0)V.dist=cl(V.dist*pp0.d/d,3,300);if(pp0)pan(cx-pp0.cx,cy2-pp0.cy);pp0={d,cx,cy:cy2};redraw();return}
  if(mode=='drag'&&drag){ray(e);const s=lp(drag.axis);if(s==null)return;const dl2=s-drag.s0,o=O()[GE.sel],o0=drag.o0,ax=drag.axis;
   if(drag.mode=='move'){o[ax]=fm(cl(sn(o0[ax]+dl2),RG[ax][0],RG[ax][1]));roots[GE.sel].position.set(...cenOf(o));if(bh)bh.update()}
   else{const key=ax=='x'?'sx':ax=='z'?'sz':(o.k=='p'?'th':'sy'),mn=o.k=='p'?(key=='th'?.25:.5):.2,nv=cl(sn(o0[key]+2*dl2),mn,RG[key][1]);o[key]=fm(nv);if(ax=='y'){o.y=o.k=='p'?fm((o0.y-(o0.th||.5)/2)+nv/2):fm((o0.y+o0.sy/2)-nv/2)}updObj(GE.sel)}
   syncP();redraw();return}
  moved+=Math.abs(dx)+Math.abs(dy);
  if(mode=='orbit'){V.yaw-=dx*.009;V.pitch=cl(V.pitch+dy*.009,-.05,1.5);redraw()}else if(mode=='pan'){pan(dx,dy);redraw()}};
 const pan=(dx,dy)=>{const k=V.dist*.0022,rx=Math.cos(V.yaw),rz=-Math.sin(V.yaw),fx=-Math.sin(V.yaw),fz=-Math.cos(V.yaw);V.t[0]+=-dx*k*rx+dy*k*fx;V.t[2]+=-dx*k*rz+dy*k*fz};
 cv.onpointerup=cv.onpointercancel=e=>{const was=mode;ptrs.delete(e.pointerId);if(was=='orbit'&&moved<6&&e.type=='pointerup'){const i=pickObj(e);select(i)}if(was=='drag'){drag=null;rebuild();propsRender();exRender();persist()}if(ptrs.size<2&&was=='pinch')mode=null;else if(ptrs.size==0)mode=null};
 /* ----- toolbar and panels ----- */
 GEK=e=>{const k=e.key,m=e.ctrlKey||e.metaKey,o=O()[GE.sel];
  if(m&&k=='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(m&&k=='y'){e.preventDefault();redo()}else if(m&&k=='d'){e.preventDefault();dup()}
  else if(o&&(k=='Delete'||k=='Backspace')){e.preventDefault();del()}else if(k=='Escape')select(-1);else if(k=='f'||k=='F')focus();
  else if(k=='q'||k=='Q')setTool('select');else if(k=='w'||k=='W')setTool('move');else if(k=='e'||k=='E')setTool('scale');
  else if(o&&k.startsWith('Arrow')){e.preventDefault();snapH();const g=(snv()||.5)*(e.shiftKey?4:1);if(k=='ArrowLeft')o.x-=g;if(k=='ArrowRight')o.x+=g;if(k=='ArrowUp')o.z-=g;if(k=='ArrowDown')o.z+=g;o.x=fm(o.x);o.z=fm(o.z);updObj(GE.sel);syncP();redraw();persist()}
  else if(o&&(k=='PageUp'||k=='PageDown')){e.preventDefault();snapH();o.y=fm(o.y+(k=='PageUp'?1:-1)*(snv()||.5));updObj(GE.sel);syncP();redraw();persist()}};
 E.onclick=e=>{const b=e.target.closest('[data-ins]');if(b){const[k,t]=b.dataset.ins.split(':');return ins(k,t)}const tb=e.target.closest('[data-tool]');if(tb)return setTool(tb.dataset.tool);const tt=e.target.closest('[data-tab]');if(tt)setTab(tt.dataset.tab)};
 $('#un').onclick=undo;$('#re').onclick=redo;$('#du').onclick=dup;$('#dl').onclick=del;$('#fc').onclick=focus;$('#snp').value=GE.snap;$('#snp').onchange=e=>{GE.snap=+e.target.value;propsRender();persist()};
 /* ----- game settings, thumbnail, test, publish ----- */
 [['gn','name'],['gd','desc'],['gk','killY'],['sp','spd'],['jp','jmp'],['gr','grav']].forEach(([i,k])=>$('#'+i).oninput=e=>{GE[k]=e.target.value;if(k=='name')stat();persist()});
 $('#gs').oninput=e=>{GE.sky=e.target.value;redraw();persist()};$('#gl').oninput=e=>{GE.light=+e.target.value;redraw();persist()};$('#gf').onchange=e=>{GE.fog=e.target.checked;persist()};$('#gg').onchange=e=>{GE.genre=e.target.value;persist()};
 $('#tp').onchange=e=>{const v=e.target.value;if(!TPL[v])return;snapH();GE.objs=TPL[v]();GE.sel=-1;if(v=='arena'){Object.assign(GE,{pvp:true,hp:100,resp:3,weapons:[WP.pistol(),WP.sword(),WP.shotgun()],startW:[0,1],wsel:0});persist();create('game');return}all();fit()};
 const tmb=()=>{const u=GE.thumb||(GE.keepThumb&&GE.editId?`/api/thumb/${GE.editId}?v=${Date.now()}`:'');$('#tm').style.display=u?'block':'none';$('#tm').src=u};
 $('#tu').onclick=()=>$('#tf').click();
 $('#tf').onchange=e=>{const f=e.target.files[0];if(!f)return;if(!/^image\//.test(f.type))return toast('Please choose an image.');const r=new FileReader();r.onload=()=>fitThumb(r.result,'#222',d=>{if(!d)return toast('Could not read that image.');GE.thumb=d;GE.keepThumb=false;tmb();persist()});r.readAsDataURL(f)};
 $('#tp3').onclick=()=>{const keep=GE.sel;if(bh)bh.visible=false;if(gz)gz.visible=false;camSet();R3.render(sc,cam);const url=cv.toDataURL('image/png');if(bh)bh.visible=true;if(gz)gz.visible=true;fitThumb(url,GE.sky,d=>{if(d){GE.thumb=d;GE.keepThumb=false;tmb();persist();toast('Screenshot saved as the thumbnail.',true)}});redraw()};
 $('#tx').onclick=()=>{GE.thumb=null;GE.keepThumb=false;GE.dropThumb=true;tmb();persist()};
 const num=(id,a,b,d)=>cl(+$('#'+id).value||d,a,b),spec=()=>({id:GE.editId||'c'+Date.now(),update:!!GE.editId,name:(GE.name+'').trim()||'Untitled',desc:(GE.desc+'').trim(),genre:GE.genre,creator:me.name,mode:'custom',sky:GE.sky,light:GE.light,fog:GE.fog,killY:num('gk',-80,-5,-15),ground:'#5bd16a',size:16,seed:1,spd:num('sp',4,14,7),jmp:num('jp',6,16,9),grav:num('gr',10,40,22),coinN:25,cps:false,pvp:GE.pvp,hp:GE.hp,resp:GE.resp,weapons:GE.weapons,startW:Array.isArray(GE.startW)?GE.startW:[],objs:JSON.parse(JSON.stringify(O())),scripts:JSON.parse(JSON.stringify(GE.scripts||[])),thumb:GE.thumb||undefined,dropThumb:!!GE.dropThumb&&!GE.thumb});
 $('#tst').onclick=()=>play({...spec(),thumb:undefined});
 $('#pub').onclick=()=>{if(!O().some(o=>o.k=='p'))return toast('Add at least one platform.');const g=spec();pub('games',g);GE=null;ls.set('ruko_draft',null);location.hash='#/'};
 $('#nw').onclick=()=>{if(confirm('Discard this level and start fresh?')){GE=null;ls.set('ruko_draft',null);create('game')}};
 CODEP=persist;setTool(GE.tool);setTab(GE.tab||'props');wpanelRender(persist);tmb();rebuild();propsRender();exRender();stat();fit();rs()}
