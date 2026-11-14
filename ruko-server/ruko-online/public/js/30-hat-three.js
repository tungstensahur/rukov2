/* ---------- v30: wear up to three head accessories ---------- */
/* Head items used to be one at a time. This file lets you pick up to three at once: each one is
   stored in its own little pocket (head, head2, head3), so the profile page, other players and the
   catalog all keep working without special cases. It also nudges the extra hats apart a little so
   three of them do not sit in exactly the same spot. */
(function(){
 if(window.RKHEAD30)return;
 window.RKHEAD30=1;

 const SLOT=['head','head2','head3'];
 const OFF=[[0,0,0],[.17,.05,0],[-.17,.10,0]];   /* a small spread so stacked hats stay visible */
 const MAX=3;

 const headIds=me=>SLOT.map(s=>((me&&me.gear)||{})[s]).filter(Boolean);
 const owned=()=>{const me=cur(),H=hats();return (me.owned||[]).map(i=>H.find(x=>x.id==i)).filter(h=>h&&h.kind!='shirt'&&(h.slot||'head')=='head')};

 function css(){
  if(document.getElementById('rkhead30-style'))return;
  const st=document.createElement('style');
  st.id='rkhead30-style';
  st.textContent=`
#app .rkheadchips{flex-wrap:wrap}
#app .rkheadchips button{position:relative}
#app .rkheadchips button[data-rkh=""]{background:none;border:1px dashed var(--bd);color:var(--mut);font-size:12px;min-height:38px;padding:0 10px}
#app .rkheadchips button.on{outline:2px solid var(--ac);outline-offset:1px}
#app .rkhb{position:absolute;left:3px;top:3px;background:var(--ac);color:#fff;border-radius:99px;
 font-size:11px;line-height:1.5;padding:0 6px;font-weight:700;pointer-events:none}
#app .rkhint{font-size:12px;color:var(--mut);margin:6px 0 0}
`;
  document.head.appendChild(st);
 }

 /* the list of hats to draw: every worn head item plus the face and back slots */
 try{
  const prev=window.gearList;
  window.gearList=function(me,ov){
   const H=hats(),out=[];
   for(const id of headIds(me)){const h=H.find(x=>x.id==id);if(h)out.push(h)}
   for(const slot of['face','back']){const id=((me&&me.gear)||{})[slot];if(id){const h=H.find(x=>x.id==id);if(h)out.push(h)}}
   if(ov)for(const slot in ov){
    const isHead=SLOT.includes(slot);
    for(let i=out.length-1;i>=0;i--){
     const hs=out[i].slot||'head';
     if(isHead?hs=='head':hs==slot)out.splice(i,1);
    }
    if(ov[slot]!=null)out.push(ov[slot]);
   }
   return typeof prev=='function'?out:out;
  };
 }catch(e){}

 /* spread the head hats a little so three of them can be seen at once */
 try{
  const prevMP=window.makePlayer;
  window.makePlayer=function(hat,av,nm){
   const g=prevMP(hat,av,nm);
   try{
    const b=(typeof SL!=='undefined'&&SL.head)||[0,3.1,0];
    const heads=g.children.filter(c=>c&&c.isGroup&&Math.abs(c.position.y-b[1])<.02&&Math.abs(c.position.x-b[0])<.02&&Math.abs(c.position.z-b[2])<.02);
    heads.forEach((c,i)=>{const o=OFF[i];if(!o||i===0)return;c.position.x+=o[0];c.position.y+=o[1];c.position.z+=o[2]});
   }catch(e){}
   return g;
  };
 }catch(e){}

 function save(me,ids){
  const g=Object.assign({},me.gear||{});
  delete g.head;delete g.head2;delete g.head3;
  ids.slice(0,MAX).forEach((id,i)=>{g[SLOT[i]]=id});
  me.gear=g;
  try{saveUser(me)}catch(e){}
 }

 /* redraw just the preview, the same way the avatar screen does, without rebuilding the page */
 function redraw(){
  try{
   const me=cur(),img=document.getElementById('pv');
   if(!img)return;
   const rot=parseFloat((document.getElementById('rt')||{}).value||.4)||.4;
   const m=makePlayer(gearList(me),me.av||{});
   m.rotation.y=rot;
   shotP(img,m,[0,2.4,7],[0,1.6,0]);
  }catch(e){}
 }

 /* replace the old "None / one hat" row with a row that can wear three */
 function decorate(){
  const h=[...document.querySelectorAll('#app h2')].find(x=>/^\s*avatar\s*$/i.test(x.textContent||''));
  if(!h)return;
  const hat=h.nextElementSibling;
  if(!hat)return;
  const first=hat.querySelector('[data-slot="head"]');
  /* after the first pass the row is ours, so it is found by its own class instead */
  let chips=hat.querySelector('.rkheadchips');
  if(!chips){if(!first)return;chips=first.parentNode;if(!chips)return}
  const me=cur();
  const worn=headIds(me).filter(id=>owned().some(o=>o.id==id));
  const items=owned();
  /* rebuild only when something actually changed, so a tap never lands on a fresh node */
  const sig=worn.join(',')+'|'+items.map(o=>o.id).join(',');
  if(chips.dataset.rkvs===sig)return;
  chips.dataset.rkvs=sig;
  chips.classList.add('rkheadchips');
  chips.innerHTML=`<button data-rkh="" title="Take every head item off">Remove all</button>`+
   items.map(it=>{
    const i=worn.indexOf(it.id);
    return `<button data-rkh="${it.id}" class="${i>=0?'on':''}" style="width:64px;padding:2px" title="${esc(it.name)}${i>=0?' · worn '+(i+1):''}">`+
     `<img src="${thumb(it)}" style="width:100%" alt="${esc(it.name)}">${i>=0?`<b class="rkhb">${i+1}</b>`:''}</button>`;
   }).join('');
  /* the note sits under the row, not inside it, so phones keep a tidy grid */
  let note=chips.parentNode.querySelector('.rkhint');
  if(!note){note=document.createElement('div');note.className='rkhint';chips.parentNode.insertBefore(note,chips.nextSibling)}
  note.textContent=`Wear up to ${MAX} head items at once${worn.length?` · ${worn.length} on`:''}${items.length?'':' · none owned yet, find some in the Catalog'}`;
  const lab=chips.previousElementSibling;
  if(lab&&lab.tagName=='LABEL')lab.innerHTML=`Head <span class="mut" style="font-weight:400">(${worn.length} of ${MAX} worn · ${items.length} owned)</span>`;
  /* the little caption under the preview still says one item per slot */
  const cap=[...hat.querySelectorAll('p.mut')].find(p=>/one per slot/i.test(p.textContent||''));
  if(cap)cap.textContent='Drag the slider to spin · up to 3 head items at once, plus a face and a back item';
 }

 function pick(id){
  const me=cur();
  let w=headIds(me);
  if(!id)w=[];
  else if(w.includes(id))w=w.filter(x=>x!==id);
  else{
   if(w.length>=MAX){try{toast('Three head items is the limit — take one off first.')}catch(e){}return}
   w.push(id);
  }
  save(me,w);
  const chips=document.querySelector('#app .rkheadchips');
  if(chips)chips.dataset.rkvs='';
  decorate();
  redraw();
 }

 css();
 document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-rkh]');
  if(!b)return;
  e.preventDefault();e.stopPropagation();
  pick(b.getAttribute('data-rkh')||'');
 },true);

 decorate();
 try{
  const host=document.getElementById('app');
  if(host&&typeof MutationObserver!='undefined'){
   let q=0;
   new MutationObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;try{decorate()}catch(e){}})}).observe(host,{childList:true,subtree:true});
  }
 }catch(e){}
 setInterval(()=>{try{if(document.querySelector('#app h2'))decorate()}catch(e){}},900);
 try{addEventListener('hashchange',()=>setTimeout(decorate,60))}catch(e){}

 window.RKHEAD={max:MAX,ids:headIds,pick};
})();
