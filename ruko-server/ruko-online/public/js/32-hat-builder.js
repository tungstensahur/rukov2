/* ---------- v32: the hat builder, rebuilt as a five-step wizard ---------- */
/* The old editor was a wall of tabs, a template list and a "remix an existing item" list. This one
   walks you through it: shape, size and place, colour, extra pieces, then name and publish. Every
   control is a plain slider or a big button, and the preview always shows the item on your avatar
   unless you ask for a close-up of the item alone. */
function hatEd(me){
 const starter=PT('cylinder','#5b4bff',.7,.35,.7,0,.3,0);
 HE=(HE&&HE.v2)?HE:Object.assign({v2:1,name:'My Accessory',price:100,slot:'head',parts:[starter],sel:0,rot:.4,zoom:5,step:1,mult:2,uni:true,only:false},ls.get('ruko_hdraft',null)||{});
 HE.v2=1;HE.hist=HE.hist||[];HE.redo=HE.redo||[];HE.ts=0;
 HE.parts=(HE.parts&&HE.parts.length?HE.parts:[starter]).map(NP);
 HE.sel=Math.min(HE.sel||0,HE.parts.length-1);
 if(!HE.step||HE.step<1||HE.step>5)HE.step=1;

 const E=$('#ed'),P=()=>HE.parts[HE.sel],fmt=v=>(+v).toFixed(2).replace(/\.?0+$/,'')||'0';
 const STEPS=[[1,'Shape','What is it made of?','Pick a shape, then move to the next step.'],[2,'Size & place','How big, and where','Sliders change one part at a time.'],[3,'Colour','Paint it','Pick a colour, then a finish.'],[4,'Extras','Add more pieces','Build crowns, wings, bands, anything.'],[5,'Publish','Name it and publish','Your item goes to the Catalog.']];
 const MAIN=[['sphere','Ball','●'],['box','Block','▢'],['cylinder','Cylinder','⬭'],['cone','Cone','▲'],['dome','Dome','◠'],['torus','Ring','⭕']];
 const MORE=[['pyramid','Pyramid','⛰'],['prism','Wedge','◣'],['octa','Diamond','◆'],['ico','Gem','💎'],['star','Star','⭐'],['heart','Heart','❤'],['cross','Cross','✚'],['hexagon','Hex','⬡'],['spike','Spike','🔺']];
 const START={sphere:[.35,.35,.35,0,.3,0],box:[.5,.5,.5,0,.3,0],cylinder:[.7,.35,.7,0,.3,0],cone:[.6,.6,.6,0,.35,0],dome:[.8,.5,.8,0,.3,0],torus:[.8,.2,.8,0,.35,0],pyramid:[.7,.6,.7,0,.3,0],prism:[.7,.5,.5,0,.25,0],octa:[.4,.5,.4,0,.35,0],ico:[.35,.4,.35,0,.35,0],star:[.6,.6,.2,0,.35,0],heart:[.5,.5,.3,0,.35,0],cross:[.5,.5,.2,0,.35,0],hexagon:[.6,.35,.6,0,.3,0],spike:[.2,.7,.2,0,.35,0]};

 let t0=0;
 const persist=()=>{clearTimeout(t0);t0=setTimeout(()=>ls.set('ruko_hdraft',{...HE,hist:[],redo:[]}),400)};
 const sn=()=>{const t=Date.now();if(t-HE.ts>800){HE.hist.push(JSON.stringify(HE.parts));if(HE.hist.length>40)HE.hist.shift();HE.redo=[]}HE.ts=t};
 const snf=()=>{HE.ts=0;sn()};

 let pq=0;
 const pv=()=>{if(pq)return;pq=1;requestAnimationFrame(()=>{pq=0;const img=$('#pv');if(!img)return;
  try{
   if(HE.only){const m=hatMesh({parts:HE.parts});m.rotation.y=HE.rot;img.src=shot(m,[0,1.2,HE.zoom*.45],[0,.4,0])}
   else{const b=HE.slot=='back';const m=makePlayer(gearList(me,{[HE.slot]:{parts:HE.parts,slot:HE.slot}}),{...(me.av||{})});m.rotation.y=HE.rot;shotP(img,m,[0,b?2.4:3,HE.zoom],[0,b?1.9:2.8,0])}
  }catch(e){}})};

 const css=()=>{if(document.getElementById('rkhb-style'))return;const st=document.createElement('style');st.id='rkhb-style';
  st.textContent=`.rkhb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:7px}
.rkhb-grid button{padding:9px 4px;font-size:12px;line-height:1.25;border:1px solid var(--bd);background:var(--card);border-radius:10px;color:var(--tx)}
.rkhb-grid button .g{display:block;font-size:19px;line-height:1.2}
.rkhb-grid button.on{outline:2px solid var(--ac);outline-offset:1px}
.rkhb-srow{margin:10px 0}.rkhb-srow label{font-size:13px;display:flex;justify-content:space-between}
.rkhb-srow input[type=range]{width:100%}
.rkhb-swatches{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 2px}
.rkhb-swatches button{width:30px;height:30px;border-radius:8px;border:1px solid rgba(0,0,0,.2)}
.rkhb-pieces{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.rkhb-pieces button{font-size:12px;padding:5px 9px;display:flex;align-items:center;gap:6px}
.rkhb-pieces button.on{outline:2px solid var(--ac);outline-offset:1px}
.rkhb-steps{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px}
.rkhb-steps button{font-size:12px;padding:6px 10px}
.rkhb-steps button.on{background:var(--ac);color:#fff}
.rkhb-now{font-size:12px;color:var(--mut);margin:2px 0 0}`;
  document.head.appendChild(st)};

 const stepper=(k,label)=>`<div class="rkhb-srow"><label>${label}<b data-val="${k}">${fmt(P()[k])}</b></label><input data-sl="${k}" type="range" min="${STP[k][0]}" max="${STP[k][1]}" step="${STP[k][2]}" value="${P()[k]}"></div>`;

 const shapeGrid=(list)=>`<div class="rkhb-grid">${list.map(([k,n,g])=>`<button data-sh="${k}" class="${P().t==k?'on':''}"><span class="g">${g}</span>${n}</button>`).join('')}</div>`;

 const panel=()=>{
  const p=P();
  if(HE.step==1)return `<p class="mut" style="margin:0 0 8px">Pick the shape of this piece. Most hats start as a cylinder or a dome.</p>${shapeGrid(MAIN)}<div class="stg">More shapes</div>${shapeGrid(MORE)}`;
  if(HE.step==2)return `<div class="chips"><button data-uni class="${HE.uni?'on':''}">${HE.uni?'🔒 Same in every direction':'🔓 Stretch freely'}</button><button data-scale=".8">Smaller</button><button data-scale="1.25">Bigger</button></div><div class="stg">Size</div>${stepper('sx','Width')}${stepper('sy','Height')}${stepper('sz','Depth')}<div class="stg">Where it sits</div>${stepper('x','Left / right')}${stepper('y','Up / down')}${stepper('z','Forward / back')}<div class="chips"><button data-act="cx">Centre left-right</button><button data-act="cz">Centre front-back</button></div>`;
  if(HE.step==3)return `<p class="mut" style="margin:0 0 6px">Tap a colour, or use the picker for any shade.</p><div class="rkhb-swatches">${PAL.map(c=>`<button data-pal="${c}" style="background:${c}"></button>`).join('')}</div><input id="pc" type="color" value="${p.c}"><div class="stg">Finish</div><div class="chips">${[['matte','Matte'],['shiny','Shiny'],['metal','Metal'],['glass','Glass'],['neon','Neon']].map(([k,n])=>`<button data-fin="${k}" class="${p.f==k?'on':''}">${n}</button>`).join('')}</div>${stepper('op','See-through (1 = solid)')}<div class="chips"><button data-act="paintall">🎨 Use this colour on every piece</button></div>`;
  if(HE.step==4)return `<p class="mut" style="margin:0 0 8px">Every piece can be tilted, mirrored or copied around the hat.</p><div class="stg">Tilt</div>${stepper('r','Tilt sideways')}${stepper('q','Tilt forward')}${stepper('ry','Spin around')}<div class="chips"><button data-act="rz">Reset tilt</button><button data-mir class="${p.m?'on':''}">${p.m?'✅ Mirrored copy':'Mirror to the other side'}</button></div><div class="stg">Copies</div>${stepper('rep','Copies in a circle (crowns, spikes)')}<div class="chips"><button data-act="dup">Duplicate this piece</button><button data-act="dupm">Duplicate and mirror it</button><button data-act="del">Delete this piece</button></div>`;
  return `<label>Name your item</label><input id="hn" maxlength="20" value="${esc(HE.name)}"><label>Where is it worn?</label><select id="sl">${[['head','Head (hats, hair, helmets)'],['face','Face (glasses, masks)'],['back','Back (wings, capes, packs)']].map(([v,n])=>`<option value="${v}" ${v==HE.slot?'selected':''}>${n}</option>`).join('')}</select><label>Price in Rukos</label><input id="hp" type="number" min="0" max="1000" value="${HE.price}"><div class="chips" style="margin-top:10px"><button class="pri" id="pub" style="width:100%">Publish to the Catalog</button></div><p class="mut" style="font-size:12px;margin:6px 0 0">It is saved as a draft as you build, so you can close the page and come back.</p><div class="stg">Start over</div><div class="chips"><button id="hsb">Clear and build a new item</button></div>`;
 };

 const pieces=()=>{
  const box=$('#pl');if(!box)return;
  box.innerHTML=HE.parts.map((q,i)=>`<button data-s="${i}" class="${i==HE.sel?'on':''}"><span style="color:${q.c};text-shadow:0 0 1px #000">■</span> ${i+1}. ${SHN[q.t]||q.t}</button>`).join('')+`<button id="ap" title="Add a piece">＋ Add piece</button>`;
  box.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{HE.sel=+b.dataset.s;draw()});
  const ap=$('#ap');if(ap)ap.onclick=()=>addPart();
 };

 const sync=()=>{const p=P();E.querySelectorAll('[data-val]').forEach(s=>s.textContent=fmt(p[s.dataset.val]));
  E.querySelectorAll('[data-sl]').forEach(i=>{if(document.activeElement!==i)i.value=p[i.dataset.sl]});
  E.querySelectorAll('[data-sh]').forEach(b=>b.classList.toggle('on',b.dataset.sh==p.t));
  E.querySelectorAll('[data-fin]').forEach(b=>b.classList.toggle('on',b.dataset.fin==p.f));};

 const setK=(k,v)=>{const[a,b,s]=STP[k],p=P();
  v=+Math.max(a,Math.min(b,Math.round(v/s)*s)).toFixed(3);
  if(HE.uni&&(k=='sx'||k=='sy'||k=='sz')&&p[k]>0){const r=v/p[k];for(const q of['sx','sy','sz'])if(q!=k)p[q]=+Math.max(.05,Math.min(3,p[q]*r)).toFixed(3)}
  p[k]=v;sync();pv();persist()};

 const addPart=(o)=>{if(HE.parts.length>=24)return toast('Up to 24 pieces per item.');snf();
  HE.parts.push(NP(o||{t:'sphere',c:P().c,sx:.3,sy:.3,sz:.3,x:.45,y:.4,op:1}));HE.sel=HE.parts.length-1;draw()};

 const setStep=n=>{HE.step=Math.max(1,Math.min(5,+n));persist();draw()};

 const paint=()=>{const T=$('#tp');if(!T)return;T.innerHTML=panel();
  T.querySelectorAll('[data-sh]').forEach(b=>b.onclick=()=>{sn();P().t=b.dataset.sh;sync();pieces();pv();persist()});
  T.querySelectorAll('[data-sl]').forEach(i=>{i.onpointerdown=sn;i.oninput=()=>setK(i.dataset.sl,+i.value)});
  T.querySelectorAll('[data-pal]').forEach(b=>b.onclick=()=>{sn();P().c=b.dataset.pal;if($('#pc'))$('#pc').value=P().c;pieces();pv();persist()});
  if($('#pc')){$('#pc').onfocus=sn;$('#pc').oninput=e=>{P().c=e.target.value;pieces();pv();persist()}}
  T.querySelectorAll('[data-fin]').forEach(b=>b.onclick=()=>{sn();P().f=b.dataset.fin;sync();pv();persist()});
  T.querySelectorAll('[data-scale]').forEach(b=>b.onclick=()=>{sn();const p=P(),m=+b.dataset.scale;for(const q of['sx','sy','sz'])p[q]=+Math.max(.05,Math.min(3,p[q]*m)).toFixed(3);sync();pv();persist()});
  if(T.querySelector('[data-uni]'))T.querySelector('[data-uni]').onclick=()=>{HE.uni=!HE.uni;paint()};
  if(T.querySelector('[data-mir]'))T.querySelector('[data-mir]').onclick=()=>{sn();P().m=P().m?0:1;paint();pv();persist()};
  T.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{const a=b.dataset.act,p=P();
   if(a=='cx'){sn();p.x=0}else if(a=='cz'){sn();p.z=0}else if(a=='rz'){sn();p.r=p.q=p.ry=0}
   else if(a=='paintall'){snf();HE.parts.forEach(q=>{q.c=p.c;q.f=p.f;q.op=p.op});pieces()}
   else if(a=='dup')return addPart({...p});
   else if(a=='dupm')return addPart({...p,x:-p.x,r:-p.r,ry:-p.ry,m:0});
   else if(a=='del'){if(HE.parts.length>1){snf();HE.parts.splice(HE.sel,1);HE.sel=0;draw();return}return toast('An item needs at least one piece.')}
   sync();pv();persist()});
  if($('#hn'))$('#hn').oninput=e=>{HE.name=e.target.value;persist()};
  if($('#sl'))$('#sl').onchange=e=>{HE.slot=e.target.value;pv();persist()};
  if($('#hp'))$('#hp').oninput=e=>{HE.price=Math.max(0,Math.min(1000,+e.target.value||0));persist()};
  if($('#hsb'))$('#hsb').onclick=()=>{if(!confirm('Clear this draft and start a new item?'))return;snf();HE.parts=[NP(starter)];HE.sel=0;HE.step=1;HE.name='My Accessory';HE.price=100;HE.slot='head';persist();draw()};
  if($('#pub'))$('#pub').onclick=publish;
 };

 const publish=()=>{const h={id:'h'+Date.now(),name:(HE.name||'').trim()||'Untitled',creator:me.name,price:Math.max(0,Math.min(1000,HE.price||0)),parts:HE.parts,slot:HE.slot,base:0};
  pub('hats',h);HE=null;ls.set('ruko_hdraft',null);location.hash='#/hat/'+h.id};

 const draw=()=>{
  const st=STEPS[HE.step-1];
  E.innerHTML=`<div class="hed"><div class="hsticky"><div class="card">
   <div class="chips sc"><button id="zo">Zoom −</button><button id="zi">Zoom ＋</button><button id="ov">${HE.only?'Show on avatar':'Item only'}</button><button id="un">Undo</button><button id="re">Redo</button></div>
   <img id="pv" alt="Your item">
   <p class="mut" style="font-size:12px;margin:4px 0 0">Drag the picture to spin it.</p>
   <div class="stg">Pieces (${HE.parts.length}/24)</div>
   <div class="rkhb-pieces" id="pl"></div>
  </div></div>
  <div class="hctl"><div class="card">
   <div class="rkhb-steps">${STEPS.map(([n,label])=>`<button data-step="${n}" class="${HE.step==n?'on':''}">${n}. ${label}</button>`).join('')}</div>
   <b style="font-size:16px">${st[2]}</b><p class="rkhb-now">${st[3]}</p>
   <div id="tp" style="margin-top:8px"></div>
   <div class="chips" style="margin-top:12px">
    ${HE.step>1?`<button id="bk">← Back</button>`:''}
    ${HE.step<5?`<button class="pri" id="nx">Next →</button>`:''}
   </div>
  </div></div></div>`;
  E.style.setProperty('--hh',($('#top')?$('#top').offsetHeight:56)+'px');
  const img=$('#pv');let dr=0,lx=0;
  img.onpointerdown=e=>{dr=1;lx=e.clientX;try{img.setPointerCapture(e.pointerId)}catch(_){}}
  img.onpointermove=e=>{if(dr){HE.rot+=(e.clientX-lx)*.02;lx=e.clientX;pv()}}
  img.onpointerup=img.onpointercancel=()=>{dr=0;persist()};
  $('#zo').onclick=()=>{HE.zoom=Math.min(11,HE.zoom+.6);pv();persist()};
  $('#zi').onclick=()=>{HE.zoom=Math.max(2.4,HE.zoom-.6);pv();persist()};
  $('#ov').onclick=()=>{HE.only=!HE.only;draw()};
  $('#un').onclick=()=>{if(!HE.hist.length)return toast('Nothing to undo yet.');HE.redo.push(JSON.stringify(HE.parts));HE.parts=JSON.parse(HE.hist.pop());HE.sel=Math.min(HE.sel,HE.parts.length-1);draw();persist()};
  $('#re').onclick=()=>{if(!HE.redo.length)return toast('Nothing to redo.');HE.hist.push(JSON.stringify(HE.parts));HE.parts=JSON.parse(HE.redo.pop());HE.sel=Math.min(HE.sel,HE.parts.length-1);draw();persist()};
  E.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>setStep(b.dataset.step));
  if($('#bk'))$('#bk').onclick=()=>setStep(HE.step-1);
  if($('#nx'))$('#nx').onclick=()=>setStep(HE.step+1);
  pieces();paint();pv();
 };

 css();
 draw();
}
