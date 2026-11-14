/* ---------- v26: saving a game as a draft, and getting it back later ---------- */
/* A draft is saved like any other game, but only its creator can see or open it until it is
   published. The editor keeps its own Publish/Update button; this file adds a "Save draft"
   button beside it and a small list of your drafts so nothing is ever lost. */
(function(){
 if(window.RKDRAFTS26)return;
 window.RKDRAFTS26=1;

 const L=()=>{try{return typeof ls==='undefined'?null:ls}catch(e){return null}};
 const G=()=>{try{return typeof GE==='undefined'?null:GE}catch(e){return null}};
 const setGE=v=>{try{GE=v}catch(e){}};
 const say=(m,ok)=>{try{typeof toast==='function'?toast(m,ok):console.log(m)}catch(e){}};
 const apiOk=()=>{try{return typeof api==='function'?api:null}catch(e){return null}};
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

 /* ---------- catch the save the editor fires, so we know the new game's id ---------- */
 let pendingItem=null;
 try{
  const origPub=window.pub;
  if(typeof origPub==='function'){
   window.pub=function(col,item){
    if(window.__RKDRAFT&&col==='games'&&item&&item.objs){item.draft=true;pendingItem=item}
    return origPub.apply(this,arguments);
   };
  }
 }catch(e){}

 /* ---------- buttons beside Publish / Update ---------- */
 const pubBtn=()=>document.getElementById('pub');
 function relabel(){
  const p=pubBtn(),g=G();
  if(!p||!g)return;
  if(g.editId&&g.draft){if(p.textContent!=='Publish')p.textContent='Publish';p.title='Make this draft public'}
  else p.title='';
 }
 /* only inside the game editor: the hat editor has its own publish button */
 const inGameEditor=()=>!!(document.getElementById('stu')||document.getElementById('gk'));
 function inject(){
  const p=pubBtn();
  if(!p||!p.parentNode||!inGameEditor())return;
  if(!document.getElementById('rkdSave')){
   const b=document.createElement('button');b.id='rkdSave';b.type='button';b.textContent='Save draft';
   b.title='Save this game without publishing it — only you can see it';
   p.parentNode.insertBefore(b,p);
   b.onclick=()=>{if(b.dataset.busy)return;b.dataset.busy='1';saveDraft().catch(()=>{}).then(()=>{delete b.dataset.busy})};
  }
  if(!document.getElementById('rkdList')){
   const b=document.createElement('button');b.id='rkdList';b.type='button';b.textContent='Drafts';
   b.title='Your saved drafts';
   p.parentNode.insertBefore(b,p);
   b.onclick=()=>{openList().catch(()=>{})};
  }
  relabel();
 }
 setInterval(inject,700);
 try{document.addEventListener('hashchange',()=>setTimeout(inject,60),true)}catch(e){}

 /* ---------- save as a draft ---------- */
 async function saveDraft(){
  const g=G();
  if(!g)return say('Open the game editor first.');
  if(!(g.objs||[]).some(o=>o.k=='p'))return say('Add at least one platform first.');
  const p=pubBtn();
  if(!p)return say('Open the game editor first.');
  const A=apiOk();
  if(!A)return say('Could not save right now.');

  let exists=false,isDraft=false;
  if(g.editId){
   try{const r=await A('/api/game?id='+encodeURIComponent(g.editId));exists=!!(r&&r.game);isDraft=!!(r&&r.game&&r.game.draft)}catch(e){}
   if(exists&&!isDraft&&!confirm('This game is live. Saving it as a draft hides it from everyone until you publish it again.\n\nSave it as a draft anyway?'))return;
  }

  let snap=null;
  try{snap=JSON.parse(JSON.stringify(g))}catch(e){}
  pendingItem=null;
  window.__RKDRAFT=true;
  try{p.click()}catch(e){}
  window.__RKDRAFT=false;

  const store=L();
  if(store&&snap){
   const keep=Object.assign({},snap,{draft:true,editId:snap.editId||null});
   delete keep.hist;delete keep.redo;
   try{store.set('ruko_draft',keep)}catch(e){}
  }
  try{location.hash='#/create'}catch(e){}
  setTimeout(()=>{try{if(typeof create==='function')create('game')}catch(e){}},40);

  let id=null;
  for(let i=0;i<40&&!id;i++){            /* the editor fills in item.id when the server answers */
   if(pendingItem&&pendingItem.id)id=pendingItem.id;
   else await sleep(120);
  }
  const final=id||(snap&&snap.editId)||null;

  if(final){
   const g2=G();
   if(g2&&!g2.editId){g2.editId=final;g2.draft=true}
   if(store){
    try{const d=store.get('ruko_draft');if(d&&!d.editId){d.editId=final;store.set('ruko_draft',d)}}catch(e){}
   }
   setTimeout(()=>{inject();relabel()},60);
  }
  say('Saved as a draft — only you can see it until you publish.',true);
 }

 /* ---------- the list of drafts ---------- */
 function closeModal(){const m=document.getElementById('rkdM');if(m)m.remove()}
 function styles(){
  if(document.getElementById('rkd-style'))return;
  const st=document.createElement('style');st.id='rkd-style';
  st.textContent=[
   '#rkdM{position:fixed;inset:0;background:#000a;z-index:80;display:flex;align-items:center;justify-content:center;padding:14px}',
   '#rkdM .rkd-b{background:var(--card,#fff);color:var(--tx,#14162b);width:min(460px,100%);max-height:80vh;display:flex;flex-direction:column;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px #0006}',
   '#rkdM .rkd-h{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--bd,#dfe1ef)}#rkdM .rkd-h b{flex:1}',
   '#rkdM .rkd-l{overflow:auto;padding:6px 8px}',
   '#rkdM .rkd-r{display:flex;align-items:center;gap:10px;padding:9px 6px;border-bottom:1px solid var(--bd,#dfe1ef)}#rkdM .rkd-r:last-child{border-bottom:0}',
   '#rkdM .rkd-r>div{flex:1;min-width:0}#rkdM .rkd-r b{display:block;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
   '#rkdM .rkd-m{font-size:12px;color:var(--mut,#6b6f8a)}',
   '#rkdM .rkd-o{padding:7px 12px;min-height:34px}',
   '#rkdM .rkd-e{padding:16px 10px;font-size:13px;color:var(--mut,#6b6f8a);text-align:center}',
   '#rkdM .rkd-f{padding:10px 14px;font-size:12px;color:var(--mut,#6b6f8a);border-top:1px solid var(--bd,#dfe1ef)}',
   '#rkdSave{margin-right:2px}'
  ].join('\n');
  document.head.appendChild(st);
 }
 async function openList(){
  const A=apiOk();
  if(!A)return;
  styles();closeModal();
  const m=document.createElement('div');m.id='rkdM';
  m.innerHTML='<div class="rkd-b"><div class="rkd-h"><b>Your drafts</b><button id="rkdX" type="button">✕</button></div><div class="rkd-l" id="rkdL"><div class="rkd-e">Loading…</div></div><div class="rkd-f">Drafts are private: nobody else can see or play them. Open one to keep building, then press Publish to make it live.</div></div>';
  document.body.appendChild(m);
  m.addEventListener('click',e=>{if(e.target===m)closeModal()});
  const x=document.getElementById('rkdX');if(x)x.onclick=closeModal;

  let r=null;
  try{r=await A('/api/drafts')}catch(e){}
  const box=document.getElementById('rkdL');
  if(!box)return;                                  /* the sheet was closed while loading */
  const list=(r&&r.drafts)||[];
  if(!list.length){box.innerHTML='<div class="rkd-e">No drafts yet. Build something and press “Save draft”.</div>';return}
  box.innerHTML=list.map(d=>'<div class="rkd-r"><div><b>'+esc2(d.name)+'</b><div class="rkd-m">'+d.objs+' platform'+(d.objs==1?'':'s')+
   (d.scripts?' · '+d.scripts+' script'+(d.scripts==1?'':'s'):'')+(d.at?' · '+new Date(d.at).toLocaleDateString():'')+
   '</div></div><button type="button" class="rkd-o" data-open="'+esc2(d.id)+'">Open</button></div>').join('');
  box.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openDraft(b.dataset.open,b));
 }

 async function openDraft(id,btn){
  const A=apiOk();
  if(!A||!id)return;
  if(btn){btn.disabled=true;btn.textContent='Opening…'}
  let r=null;
  try{r=await A('/api/game?id='+encodeURIComponent(id))}catch(e){}
  if(!r||!r.game){if(btn){btn.disabled=false;btn.textContent='Open'}return say('Could not open that draft.')}
  closeModal();
  const g=r.game;
  const store=L();
  if(store){try{store.set('ruko_draft',null)}catch(e){}}
  setGE(Object.assign({},g,{sel:-1,tool:'move',snap:.5,thumb:null,editId:g.id,keepThumb:!!g.ht||!!g.thumb,
   hist:[],redo:[],startW:g.startW||[],weapons:g.weapons||[],wsel:0,scripts:g.scripts||[],draft:true}));
  try{location.hash='#/create'}catch(e){}
  setTimeout(()=>{try{if(typeof create==='function')create('game')}catch(e){};inject()},40);
 }

 window.RKDRAFTS={openList,saveDraft,inject};
})();
