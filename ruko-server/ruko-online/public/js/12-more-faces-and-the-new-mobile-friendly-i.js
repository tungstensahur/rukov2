/* ---------- v12: more faces and the new mobile-friendly item editor ---------- */
const FACES=['Smile','Cool','Surprised','Stoic','Grin','Wink','Tongue','Angry','Sad','Laughing','Sleepy','Hearts','Stars','Dizzy','Cat','Robot','Blush','Smirk','Cyclops','Derp','Vampire','Nerd'];
function faceCanvas(c,f){const k=document.createElement('canvas');k.width=k.height=64;const x=k.getContext('2d');x.fillStyle=c;x.fillRect(0,0,64,64);x.fillStyle=x.strokeStyle='#222';x.lineWidth=4;x.lineCap=x.lineJoin='round';
 const dot=(a,b,r=4)=>{x.beginPath();x.arc(a,b,r,0,7);x.fill()},ln=(a,b,c2,d)=>{x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke()},arc=(a,b,r,s,e)=>{x.beginPath();x.arc(a,b,r,s,e);x.stroke()},eyes=()=>{dot(22,26);dot(42,26)},smile=r=>arc(32,34,r||14,.25,2.9),frown=()=>arc(32,50,12,3.5,5.9);
 const heart=(a,b,s)=>{x.beginPath();x.moveTo(a,b+s);x.bezierCurveTo(a-s*1.6,b-s*.2,a-s*.6,b-s*1.6,a,b-s*.5);x.bezierCurveTo(a+s*.6,b-s*1.6,a+s*1.6,b-s*.2,a,b+s);x.fill()};
 const star=(a,b,r)=>{x.beginPath();for(let i=0;i<10;i++){const g=Math.PI/5*i-Math.PI/2,q=i%2?r*.45:r;x.lineTo(a+Math.cos(g)*q,b+Math.sin(g)*q)}x.closePath();x.fill()};
 const cross=(a,b)=>{ln(a-5,b-5,a+5,b+5);ln(a+5,b-5,a-5,b+5)};
 switch(f){
  case 1:x.fillRect(12,22,40,9);smile();break;
  case 2:dot(22,24,5);dot(42,24,5);x.beginPath();x.arc(32,46,6,0,7);x.fill();break;
  case 3:x.fillRect(16,24,14,4);x.fillRect(34,24,14,4);ln(22,48,42,48);break;
  case 4:eyes();x.fillStyle='#fff';x.beginPath();x.moveTo(18,38);x.quadraticCurveTo(32,62,46,38);x.closePath();x.fill();x.stroke();break;
  case 5:dot(22,26);ln(36,26,48,26);smile();break;
  case 6:eyes();smile(12);x.fillStyle='#e0566b';x.fillRect(29,44,11,11);break;
  case 7:dot(22,29);dot(42,29);ln(12,18,28,25);ln(52,18,36,25);frown();break;
  case 8:eyes();frown();x.fillStyle='#4aa3ff';dot(47,38,3);break;
  case 9:arc(22,30,6,3.3,6.1);arc(42,30,6,3.3,6.1);x.beginPath();x.arc(32,38,11,0,3.14);x.fill();break;
  case 10:ln(16,28,28,28);ln(36,28,48,28);arc(32,48,6,3.3,6.1);x.font='bold 14px sans-serif';x.fillText('z',50,16);break;
  case 11:x.fillStyle='#e0245e';heart(22,26,6);heart(42,26,6);x.fillStyle='#222';smile();break;
  case 12:x.fillStyle='#e6b800';star(22,26,8);star(42,26,8);x.fillStyle='#222';smile();break;
  case 13:cross(22,26);cross(42,26);arc(32,48,8,3.3,6.1);break;
  case 14:eyes();arc(27,38,5,.1,3.0);arc(37,38,5,.1,3.0);ln(8,34,20,36);ln(8,42,20,40);ln(56,34,44,36);ln(56,42,44,40);break;
  case 15:x.fillRect(14,18,14,14);x.fillRect(36,18,14,14);ln(20,46,44,46);ln(24,42,24,52);ln(32,42,32,52);ln(40,42,40,52);break;
  case 16:eyes();smile();x.fillStyle='#ff8fa8';dot(13,38,5);dot(51,38,5);break;
  case 17:eyes();ln(14,18,28,20);arc(38,34,13,.2,1.9);break;
  case 18:x.fillStyle='#fff';dot(32,26,12);x.stroke();x.beginPath();x.arc(32,26,12,0,7);x.stroke();x.fillStyle='#222';dot(34,27,5);smile(12);break;
  case 19:dot(20,26,7);dot(44,30,3);arc(32,46,9,3.3,6.1);x.fillStyle='#e0566b';x.fillRect(38,47,8,9);break;
  case 20:eyes();smile();x.fillStyle='#fff';x.beginPath();x.moveTo(23,43);x.lineTo(27,43);x.lineTo(25,51);x.fill();x.beginPath();x.moveTo(37,43);x.lineTo(41,43);x.lineTo(39,51);x.fill();break;
  case 21:x.lineWidth=3;arc(22,26,8,0,7);arc(42,26,8,0,7);ln(30,26,34,26);dot(22,26,2);dot(42,26,2);x.lineWidth=4;ln(25,46,39,46);x.fillStyle='#fff';x.fillRect(29,46,6,7);x.strokeRect(29,46,6,7);break;
  default:eyes();smile()}
 return k}
function faceTex(c,f){return new THREE.CanvasTexture(faceCanvas(c,f))}
const FU={};function faceURL(c,f){const k=c+f;return FU[k]||(FU[k]=faceCanvas(c,f).toDataURL())}
/* ----- more shapes, repeat and see-through for items ----- */
const stPts=(n,ro,ri)=>Array.from({length:n*2},(_,i)=>{const a=Math.PI/n*i-Math.PI/2,r=i%2?ri:ro;return[Math.cos(a)*r,Math.sin(a)*r]});
const exShape=(pts,d)=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));const g=new THREE.ExtrudeGeometry(s,{depth:d||.3,bevelEnabled:false});g.center();return g};
Object.assign(GEO,{star:()=>exShape(stPts(5,.5,.22)),heart:()=>{const s=new THREE.Shape();s.moveTo(0,.2);s.bezierCurveTo(0,.45,-.5,.45,-.5,.15);s.bezierCurveTo(-.5,-.15,-.15,-.3,0,-.5);s.bezierCurveTo(.15,-.3,.5,-.15,.5,.15);s.bezierCurveTo(.5,.45,0,.45,0,.2);const g=new THREE.ExtrudeGeometry(s,{depth:.3,bevelEnabled:false});g.center();return g},cross:()=>exShape([[-.15,.5],[.15,.5],[.15,.15],[.5,.15],[.5,-.15],[.15,-.15],[.15,-.5],[-.15,-.5],[-.15,-.15],[-.5,-.15],[-.5,.15],[-.15,.15]]),hexagon:()=>new THREE.CylinderGeometry(.5,.5,1,6),spike:()=>new THREE.ConeGeometry(.5,1,6)});
function hatMesh(h){const g=new THREE.Group();parts(h).forEach(p=>{const n=Math.max(1,Math.min(12,(p.rep|0)||1)),op=p.op==null?1:p.op,f=p.f,c=p.c;
 const mat=()=>{const o=op<1||f=='glass';return f=='neon'?new THREE.MeshBasicMaterial({color:c,transparent:op<1,opacity:op}):f=='shiny'?new THREE.MeshPhongMaterial({color:c,shininess:110,specular:0x888888,transparent:op<1,opacity:op}):f=='metal'?new THREE.MeshPhongMaterial({color:c,shininess:220,specular:0xffffff,transparent:op<1,opacity:op}):f=='glass'?new THREE.MeshPhongMaterial({color:c,shininess:120,transparent:true,opacity:Math.min(op,.45)}):new THREE.MeshLambertMaterial({color:c,transparent:o,opacity:op})};
 const add=(x,z,r,ry)=>{const m=new THREE.Mesh((GEO[p.t]||GEO.box)(),mat());m.scale.set(p.sx,p.sy,p.sz);m.position.set(x,p.y||0,z);m.rotation.order='YXZ';m.rotation.y=ry*.01745;m.rotation.z=r*.01745;m.rotation.x=(p.q||0)*.01745;g.add(m)};
 for(let k=0;k<n;k++){const a=k*2*Math.PI/n,cs=Math.cos(a),sn=Math.sin(a);for(const sg of(p.m&&p.x?[1,-1]:[1])){const x=(p.x||0)*sg,z=p.z||0;add(x*cs+z*sn,-x*sn+z*cs,(p.r||0)*sg,(p.ry||0)*sg+a*57.2958)}}});return g}
const NP=p=>({t:'box',c:'#888888',f:'matte',sx:.5,sy:.5,sz:.5,x:0,y:0,z:0,r:0,q:0,ry:0,m:0,rep:1,op:1,...p});
const PT=(t,c,sx,sy,sz,x,y,z,o)=>NP({t,c,sx,sy,sz,x,y,z,...(o||{})});
const HTPL=[
 {n:'Top hat',slot:'head',parts:[PT('cylinder','#1b1b22',.7,.65,.7,0,.33,0),PT('cylinder','#1b1b22',1.1,.05,1.1,0,.02,0),PT('cylinder','#b3261e',.72,.1,.72,0,.12,0)]},
 {n:'Wizard hat',slot:'head',parts:[PT('cone','#5b3cc4',.85,1.1,.85,0,.55,0),PT('cylinder','#5b3cc4',1.3,.05,1.3,0,.02,0),PT('star','#ffd23f',.3,.3,.1,0,.45,.4,{f:'neon'})]},
 {n:'Crown',slot:'head',parts:[PT('cylinder','#ffc800',.72,.25,.72,0,.12,0,{f:'metal'}),PT('spike','#ffc800',.14,.3,.14,.3,.4,0,{f:'metal',rep:6}),PT('sphere','#e5484d',.09,.09,.09,.3,.58,0,{f:'shiny',rep:6})]},
 {n:'Cat ears',slot:'head',parts:[PT('cone','#444444',.28,.34,.14,.22,.38,0,{m:1,r:12}),PT('cone','#ff8fa8',.16,.2,.08,.22,.34,.05,{m:1,r:12})]},
 {n:'Halo',slot:'head',parts:[PT('torus','#ffe066',.8,.3,.8,0,.55,0,{f:'neon'})]},
 {n:'Horns',slot:'head',parts:[PT('cone','#8a1c1c',.16,.5,.16,.2,.3,0,{m:1,r:-25})]},
 {n:'Antenna',slot:'head',parts:[PT('cylinder','#888888',.04,.5,.04,0,.25,0),PT('sphere','#ff4b4b',.14,.14,.14,0,.55,0,{f:'neon'})]},
 {n:'Sunglasses',slot:'face',parts:[PT('box','#111111',.26,.15,.06,.17,.08,.03,{m:1,f:'glass'}),PT('box','#111111',.12,.04,.05,0,.1,.03),PT('box','#111111',.04,.04,.3,.36,.1,-.1,{m:1})]},
 {n:'Mustache',slot:'face',parts:[PT('box','#3a2a1a',.3,.08,.06,.12,-.14,.04,{m:1,r:10})]},
 {n:'Angel wings',slot:'back',parts:[PT('pyramid','#ffffff',.5,.9,.1,.35,.4,-.1,{m:1,r:-30,f:'glass'}),PT('pyramid','#ffffff',.4,.7,.1,.45,.1,-.1,{m:1,r:-45,f:'glass'})]},
 {n:'Backpack',slot:'back',parts:[PT('box','#c0392b',.8,.9,.35,0,0,-.2),PT('box','#922b21',.6,.3,.1,0,-.2,-.4)]},
 {n:'Cape',slot:'back',parts:[PT('box','#8e1a1a',1,1.5,.05,0,-.4,-.15)]}];
const SHN={cylinder:'Cylinder',cone:'Cone',dome:'Dome',sphere:'Ball',box:'Block',torus:'Ring',pyramid:'Pyramid',prism:'Wedge',octa:'Diamond',ico:'Gem',star:'Star',heart:'Heart',cross:'Cross',hexagon:'Hexagon',spike:'Spike'};
const PAL=['#ffffff','#c0c0c0','#6b6f8a','#1b1b22','#e5484d','#ff7a59','#ffb84d','#ffd23f','#7bc96f','#35c4a0','#4b9bff','#2f6fed','#5b3cc4','#a64bf4','#ff4b8b','#8a6d4b','#5b3a1e','#f5cd30','#00e5ff','#b6ff9f'];
const STP={sx:[.05,3,.05],sy:[.05,3,.05],sz:[.05,3,.05],x:[-1.6,1.6,.05],y:[-1.5,2.5,.05],z:[-1.6,1.6,.05],r:[-90,90,5],q:[-90,90,5],ry:[-180,180,5],op:[.1,1,.05],rep:[1,12,1]};
function hatEd(me){
 HE=(HE&&HE.v2)?HE:Object.assign({v2:1,name:'My Accessory',price:100,slot:'head',parts:[PT('cylinder','#5b4bff',.7,.6,.7,0,.3,0)],sel:0,rot:.4,zoom:5,tab:'shape',mult:1,uni:true,only:false},ls.get('ruko_hdraft',null)||{});
 HE.hist=[];HE.redo=[];HE.ts=0;HE.v2=1;HE.parts=(HE.parts&&HE.parts.length?HE.parts:[PT('cylinder','#5b4bff',.7,.6,.7,0,.3,0)]).map(NP);HE.sel=Math.min(HE.sel||0,HE.parts.length-1);
 const E=$('#ed'),P=()=>HE.parts[HE.sel],fmt=v=>(+v).toFixed(2).replace(/\.?0+$/,'')||'0';E.style.setProperty('--hh',($('#top')?$('#top').offsetHeight:56)+'px');
 let t0=0;const persist=()=>{clearTimeout(t0);t0=setTimeout(()=>ls.set('ruko_hdraft',{...HE,hist:[],redo:[]}),400)};
 const sn=()=>{const t=Date.now();if(t-HE.ts>800){HE.hist.push(JSON.stringify(HE.parts));if(HE.hist.length>40)HE.hist.shift();HE.redo=[]}HE.ts=t},snf=()=>{HE.ts=0;sn()};
 let pq=0;const pv=()=>{if(pq)return;pq=1;requestAnimationFrame(()=>{pq=0;const b=HE.slot=='back';let m;if(HE.only){m=hatMesh({parts:HE.parts});m.rotation.y=HE.rot;$('#pv').src=shot(m,[0,1.2,HE.zoom*.45],[0,.4,0])}else{m=makePlayer(gearList(me,{[HE.slot]:{parts:HE.parts,slot:HE.slot}}),{...(me.av||{})});m.rotation.y=HE.rot;shotP($('#pv'),m,[0,b?2.4:3,HE.zoom],[0,b?1.9:2.8,0])}})};
 const stepper=(k,label)=>{const[a,b,s]=STP[k],v=P()[k];return `<div class="stp-row"><label>${label}: <b data-val="${k}">${fmt(v)}</b></label><div class="stp"><button data-dec="${k}">−</button><input data-sl="${k}" type="range" min="${a}" max="${b}" step="${s}" value="${v}"><button data-inc="${k}">＋</button></div></div>`};
 const panel=()=>{const p=P(),t=HE.tab,mc=`<div class="chips">${[[1,'Fine'],[2,'Normal'],[5,'Big']].map(([m,n])=>`<button data-mult="${m}" class="${HE.mult==m?'on':''}">${n} steps</button>`).join('')}</div>`;
  if(t=='shape')return `<div class="sgrid">${Object.keys(GEO).map(k=>`<button data-sh="${k}" class="${k==p.t?'on':''}">${SHN[k]||k}</button>`).join('')}</div>`;
  if(t=='move')return mc+stepper('x','Left / right')+stepper('y','Up / down')+stepper('z','Forward / back')+`<div class="chips"><button data-act="cx">Center left-right</button><button data-act="cz">Center front-back</button></div>`;
  if(t=='size')return mc+`<div class="chips"><button data-uni class="${HE.uni?'on':''}">${HE.uni?'🔒 Keep proportions':'🔓 Stretch freely'}</button><button data-scale=".8">Smaller</button><button data-scale="1.25">Bigger</button></div>`+stepper('sx','Width')+stepper('sy','Height')+stepper('sz','Depth');
  if(t=='turn')return mc+stepper('r','Tilt sideways')+stepper('q','Tilt forward')+stepper('ry','Spin')+`<div class="chips"><button data-act="rz">Reset turning</button></div>`;
  if(t=='paint')return `<label>Color</label><input id="pc" type="color" value="${p.c}"><div class="pal">${PAL.map(c=>`<button data-pal="${c}" style="background:${c}"></button>`).join('')}</div><label>Finish</label><div class="chips">${['matte','shiny','metal','glass','neon'].map(f=>`<button data-fin="${f}" class="${p.f==f?'on':''}">${f}</button>`).join('')}</div>`+stepper('op','See-through (1 = solid)')+`<div class="chips"><button data-act="paintall">Use this paint on every part</button></div>`;
  return `<div class="chips"><button data-mir class="${p.m?'on':''}">${p.m?'✅ Mirrored to the other side':'Mirror to the other side'}</button></div>`+stepper('rep','Copies in a circle (crowns, spikes)')+`<div class="chips"><button data-act="dup">Duplicate part</button><button data-act="dupm">Duplicate and mirror</button><button data-act="del">Delete part</button></div>`};
 const hold=(b,fn)=>{let t=0,iv=0;const stop=()=>{clearTimeout(t);clearInterval(iv)};b.onpointerdown=e=>{e.preventDefault();fn();t=setTimeout(()=>{iv=setInterval(fn,80)},350)};['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,stop))};
 const refresh=()=>{const p=P();E.querySelectorAll('[data-val]').forEach(s=>s.textContent=fmt(p[s.dataset.val]));E.querySelectorAll('[data-sl]').forEach(i=>i.value=p[i.dataset.sl])};
 const setK=(k,v)=>{const[a,b,s]=STP[k],p=P();v=+Math.max(a,Math.min(b,Math.round(v/s)*s)).toFixed(3);
  if(HE.uni&&(k=='sx'||k=='sy'||k=='sz')&&p[k]>0){const r=v/p[k];for(const q of['sx','sy','sz'])if(q!=k)p[q]=+Math.max(.05,Math.min(3,p[q]*r)).toFixed(3)}
  p[k]=v;refresh();pv();persist()};
 const addPart=o=>{if(HE.parts.length>=24)return toast('Up to 24 parts per item.');snf();HE.parts.push(NP(o));HE.sel=HE.parts.length-1;draw()};
 const paintTab=()=>{const p=P(),T=$('#tp');T.innerHTML=panel();
  T.querySelectorAll('[data-inc]').forEach(b=>{const k=b.dataset.inc;hold(b,()=>{sn();setK(k,P()[k]+STP[k][2]*(k=='rep'?1:HE.mult))})});T.querySelectorAll('[data-dec]').forEach(b=>{const k=b.dataset.dec;hold(b,()=>{sn();setK(k,P()[k]-STP[k][2]*(k=='rep'?1:HE.mult))})});
  T.querySelectorAll('[data-sl]').forEach(i=>{i.onpointerdown=sn;i.oninput=()=>setK(i.dataset.sl,+i.value)});
  T.querySelectorAll('[data-mult]').forEach(b=>b.onclick=()=>{HE.mult=+b.dataset.mult;paintTab()});
  T.querySelectorAll('[data-sh]').forEach(b=>b.onclick=()=>{sn();p.t=b.dataset.sh;paintTab();draw2();pv();persist()});
  T.querySelectorAll('[data-pal]').forEach(b=>b.onclick=()=>{sn();p.c=b.dataset.pal;if($('#pc'))$('#pc').value=p.c;draw2();pv();persist()});
  if($('#pc')){$('#pc').onfocus=sn;$('#pc').oninput=e=>{p.c=e.target.value;draw2();pv();persist()}}
  T.querySelectorAll('[data-fin]').forEach(b=>b.onclick=()=>{sn();p.f=b.dataset.fin;paintTab();pv();persist()});
  if(T.querySelector('[data-mir]'))T.querySelector('[data-mir]').onclick=()=>{sn();p.m=p.m?0:1;paintTab();pv();persist()};
  if(T.querySelector('[data-uni]'))T.querySelector('[data-uni]').onclick=()=>{HE.uni=!HE.uni;paintTab()};
  T.querySelectorAll('[data-scale]').forEach(b=>b.onclick=()=>{sn();for(const q of['sx','sy','sz'])p[q]=+Math.max(.05,Math.min(3,p[q]*(+b.dataset.scale))).toFixed(3);refresh();pv();persist()});
  T.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{const a=b.dataset.act;
   if(a=='cx'){sn();p.x=0}else if(a=='cz'){sn();p.z=0}else if(a=='rz'){sn();p.r=p.q=p.ry=0}
   else if(a=='paintall'){snf();HE.parts.forEach(q=>{q.c=p.c;q.f=p.f;q.op=p.op})}
   else if(a=='dup')return addPart({...p});else if(a=='dupm')return addPart({...p,x:-p.x,r:-p.r,ry:-p.ry,m:0});
   else if(a=='del'){if(HE.parts.length>1){snf();HE.parts.splice(HE.sel,1);HE.sel=0;draw();return}toast('An item needs at least one part.');return}
   refresh();draw2();pv();persist()})};
 const draw2=()=>{$('#pl').innerHTML=HE.parts.map((q,i)=>`<button data-s="${i}" class="${i==HE.sel?'on':''}"><span style="color:${q.c};text-shadow:0 0 1px #000">■</span> ${i+1}. ${SHN[q.t]||q.t}</button>`).join('');$('#pl').querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{HE.sel=+b.dataset.s;draw()})};
 const draw=()=>{E.innerHTML=`<div class="hed"><div class="hsticky"><div class="card"><img id="pv" alt=""><div class="chips sc"><button id="zo">Zoom −</button><button id="zi">Zoom ＋</button><button id="ov">${HE.only?'Show on avatar':'Item only'}</button><button id="un">Undo</button><button id="re">Redo</button></div><p class="mut" style="font-size:12px;margin:4px 0 0">Drag the picture to spin it.</p></div></div>
  <div class="hctl"><div class="card"><b>Parts (${HE.parts.length}/24)</b><div class="chips sc" id="pl"></div><div class="chips"><button class="pri" id="ap">＋ Add part</button></div><label>Start from a template</label><select id="tpl"><option value="">Choose…</option>${HTPL.map((t,i)=>`<option value="${i}">${t.n} (${t.slot})</option>`).join('')}</select><label>Remix an existing item</label><select id="rx"><option value="">Choose…</option>${hats().filter(h=>!h.kind).map(h=>`<option value="${h.id}">${esc(h.name)}</option>`).join('')}</select></div>
  <div class="card" style="margin-top:12px"><div class="chips sc">${[['shape','Shape'],['move','Move'],['size','Size'],['turn','Turn'],['paint','Paint'],['extra','More']].map(([k,n])=>`<button data-tab="${k}" class="${HE.tab==k?'on':''}">${n}</button>`).join('')}</div><div id="tp"></div></div>
  <div class="card" style="margin-top:12px"><label>Name</label><input id="hn" maxlength="20" value="${esc(HE.name)}"><label>Where it is worn</label><select id="sl">${[['head','Head (hats, hair)'],['face','Face (glasses, masks)'],['back','Back (wings, capes, backpacks)']].map(([v,n])=>`<option value="${v}" ${v==HE.slot?'selected':''}>${n}</option>`).join('')}</select><label>Price (Rukos)</label><input id="hp" type="number" min="0" max="1000" value="${HE.price}"><button class="pri" id="pub" style="width:100%;min-height:48px">Publish</button></div></div></div>`;
  E.style.setProperty('--hh',($('#top')?$('#top').offsetHeight:56)+'px');draw2();paintTab();pv();const hs=E.querySelector('.hsticky');if(hs&&innerWidth<=760)document.documentElement.style.scrollPaddingTop=(hs.getBoundingClientRect().height+($('#top')?$('#top').offsetHeight:56)+8)+'px';
  const img=$('#pv');let dr=0,lx=0;img.onpointerdown=e=>{dr=1;lx=e.clientX;img.setPointerCapture(e.pointerId)};img.onpointermove=e=>{if(dr){HE.rot+=(e.clientX-lx)*.02;lx=e.clientX;pv()}};img.onpointerup=img.onpointercancel=()=>{dr=0;persist()};
  $('#zo').onclick=()=>{HE.zoom=Math.min(10,HE.zoom+.6);pv()};$('#zi').onclick=()=>{HE.zoom=Math.max(2,HE.zoom-.6);pv()};$('#ov').onclick=()=>{HE.only=!HE.only;draw()};
  $('#un').onclick=()=>{if(HE.hist.length){HE.redo.push(JSON.stringify(HE.parts));HE.parts=JSON.parse(HE.hist.pop());HE.sel=Math.min(HE.sel,HE.parts.length-1);draw();persist()}};
  $('#re').onclick=()=>{if(HE.redo.length){HE.hist.push(JSON.stringify(HE.parts));HE.parts=JSON.parse(HE.redo.pop());HE.sel=Math.min(HE.sel,HE.parts.length-1);draw();persist()}};
  E.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{HE.tab=b.dataset.tab;E.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x==b));paintTab()});
  $('#ap').onclick=()=>addPart({t:'sphere',c:'#ff4b8b',sx:.3,sy:.3,sz:.3,y:.7});
  $('#tpl').onchange=e=>{const t=HTPL[+e.target.value];if(!t)return;if(HE.parts.length>1&&!confirm('Replace your current parts with this template?')){e.target.value='';return}snf();HE.parts=JSON.parse(JSON.stringify(t.parts));HE.slot=t.slot;HE.name=t.n;HE.sel=0;persist();draw()};
  $('#rx').onchange=e=>{const h=hats().find(x=>x.id==e.target.value);if(h){snf();HE.parts=JSON.parse(JSON.stringify(parts(h))).map(NP);HE.slot=h.slot||'head';HE.name=h.name+' Remix';HE.sel=0;persist();draw()}};
  $('#hn').oninput=e=>{HE.name=e.target.value;persist()};$('#sl').onchange=e=>{HE.slot=e.target.value;pv();persist()};$('#hp').oninput=e=>{HE.price=+e.target.value;persist()};
  $('#pub').onclick=()=>{const h={id:'h'+Date.now(),name:HE.name.trim()||'Untitled',creator:me.name,price:Math.max(0,Math.min(1000,HE.price||0)),parts:HE.parts,slot:HE.slot,base:0};pub('hats',h);HE=null;ls.set('ruko_hdraft',null);location.hash='#/hat/'+h.id}};
 draw()}
