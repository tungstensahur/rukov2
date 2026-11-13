/* ---------- v19: report items and games ---------- */
let RBUSY=0;
const rMe=()=>{try{return cur()}catch(e){return null}};
const rStaff=m=>!!(m&&(m.admin||m.mod));
const rHashId=()=>{const m=/^#\/hat\/([\w-]+)/.exec(location.hash||'');return m?m[1]:null};
function rStyle(){
 if(document.getElementById('rk-rep-style'))return;
 const st=document.createElement('style');st.id='rk-rep-style';
 st.textContent='.rk-rep-item{margin:0 0 12px;font-size:13px;padding:6px 12px;color:var(--mut)}'+
 '.rk-rep-game{margin-top:6px;width:100%;font-size:12px;padding:5px 8px;color:var(--mut);background:none}'+
 '.rk-modal{position:fixed;inset:0;z-index:70;background:#0008;display:flex;align-items:center;justify-content:center;padding:16px}'+
 '.rk-modal .rk-card{background:var(--card);color:var(--tx);border:1px solid var(--bd);border-radius:14px;width:min(460px,100%);padding:16px;position:relative;max-height:88vh;overflow:auto}'+
 '.rk-card h3{margin:0 0 4px;font-size:17px}.rk-card p{margin:0 0 10px;font-size:13px}'+
 '.rk-card textarea{width:100%;padding:10px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font:inherit;resize:vertical}'+
 '.rk-x{position:absolute;top:8px;right:8px;border:0;background:none;font-size:16px;padding:4px 8px}'+
 '.rk-row{display:flex;gap:8px;margin-top:10px}.rk-row button{flex:1}'+
 '.rk-panel{position:fixed;inset:0;z-index:70;background:var(--bg);overflow:auto;padding:14px}'+
 '.rk-panel h2{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'+
 '.rk-rep{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:10px 12px;margin-bottom:8px}'+
 '.rk-rep b{font-size:14px}.rk-rep .rk-why{margin:6px 0;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}'+
 '.rk-rep .rk-meta{font-size:12px;color:var(--mut)}.rk-rep.done{opacity:.6}'+
 '.rk-tag{font-size:11px;border-radius:6px;padding:1px 7px;background:var(--bd);margin-left:6px}'+
 '.rk-tag.game{background:#2f80ed;color:#fff}.rk-tag.item{background:var(--ac);color:#fff}'+
 '.rk-act{display:flex;gap:6px;margin-top:8px}.rk-act button{font-size:12px;padding:5px 10px}';
 document.head.appendChild(st);
}
function rModal(kind,id,name){
 let m=document.getElementById('rkreport');
 if(m)m.remove();
 m=document.createElement('div');m.id='rkreport';m.className='rk-modal';
 m.innerHTML='<div class="rk-card"><button class="rk-x" data-x aria-label="Close">✕</button><h3>Report this '+(kind==='game'?'game':'item')+'</h3>'+
  '<p class="mut">'+esc(name||id)+'</p>'+
  '<textarea id="rkwhy" maxlength="300" rows="4" placeholder="What is wrong with it? Staff will read this."></textarea>'+
  '<div class="err" id="rke"></div>'+
  '<div class="rk-row"><button class="pri" id="rkg">Send report</button><button data-x>Cancel</button></div></div>';
 document.body.appendChild(m);
 m.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>m.remove());
 m.querySelector('#rkg').onclick=async()=>{
  const why=m.querySelector('#rkwhy'),err=m.querySelector('#rke'),btn=m.querySelector('#rkg');
  if(why.value.trim().length<4){err.textContent='Say what is wrong, in a few words.';return}
  btn.disabled=true;err.textContent='';
  let r=null;try{r=await api('/api/reports',{kind,id,reason:why.value})}catch(e){r=null}
  btn.disabled=false;
  if(r&&r.ok){m.remove();toast('Report sent. Staff will take a look.',true)}
  else err.textContent=(r&&r.error)||'Could not send that. Try again.';
 };
 const ta=m.querySelector('#rkwhy');if(ta)ta.focus();
}
function rPanel(){
 const old=document.getElementById('rkpanel');if(old)old.remove();
 const p=document.createElement('div');p.id='rkpanel';p.className='rk-panel';
 p.innerHTML='<h2>Reports <button id="rkclose">← Back</button></h2><div id="rklist" class="mut">Loading…</div>';
 document.body.appendChild(p);
 p.querySelector('#rkclose').onclick=()=>p.remove();
 const list=p.querySelector('#rklist');
 const load=async()=>{
  let r=null;try{r=await api('/api/reports')}catch(e){r=null}
  if(!r||!r.reports){list.textContent=(r&&r.error)||'Could not load reports.';return}
  if(!r.reports.length){list.textContent='No reports yet. Nice and quiet.';return}
  list.className='';
  list.innerHTML=r.reports.map(x=>'<div class="rk-rep'+(x.done?' done':'')+'"><b>'+esc(x.name||x.item)+'</b><span class="rk-tag '+(x.kind==='game'?'game':'item')+'">'+(x.kind==='game'?'game':'item')+'</span>'+
   (x.creator?'<span class="rk-meta"> by '+esc(x.creator)+'</span>':'')+
   '<div class="rk-why">'+esc(x.reason)+'</div>'+
   '<div class="rk-meta">from '+esc(x.by)+' · '+when(x.at)+(x.done?' · handled by '+esc(x.by2||'staff'):'')+'</div>'+
   '<div class="rk-act"><button data-act="'+(x.done?'reopen':'resolve')+'" data-id="'+esc(x.id)+'">'+(x.done?'Reopen':'Mark handled')+'</button></div></div>').join('');
  list.querySelectorAll('[data-act]').forEach(b=>b.onclick=async()=>{
   b.disabled=true;
   try{await api('/api/reports',{action:b.dataset.act,id:b.dataset.id})}catch(e){}
   load();
  });
 };
 load();
}
const when=ms=>{if(!ms)return'';const d=Math.floor((Date.now()-ms)/60000);if(d<1)return'just now';if(d<60)return d+' min ago';const h=Math.round(d/60);if(h<24)return h+'h ago';return Math.round(h/24)+'d ago'};
function rPaint(){
 rStyle();
 const me=rMe();if(!me)return;
 const box=document.getElementById('app');
 if(box){
  const id=rHashId();
  if(id&&!box.querySelector('.rk-rep-item')){
   let h=null;try{h=hats().find(x=>x.id===id)}catch(e){}
   const anchor=box.querySelector('.idesc-full')||box.querySelector('h2');
   if(anchor){
    const b=document.createElement('button');b.className='rk-rep-item';b.textContent='⚑ Report this item';
    b.onclick=()=>rModal('item',id,h?h.name:id);
    anchor.insertAdjacentElement('afterend',b);
   }
  }
  box.querySelectorAll('[data-g],[data-solo]').forEach(play=>{
   const gid=play.dataset.g||play.dataset.solo,card=play.parentNode;
   if(!gid||!card||card.querySelector('.rk-rep-game'))return;
   let g=null;try{g=games().find(x=>x.id===gid)}catch(e){}
   const b=document.createElement('button');b.className='rk-rep-game';b.textContent='⚑ Report this game';
   b.onclick=e=>{e.stopPropagation();rModal('game',gid,g?g.name:gid)};
   card.appendChild(b);
  });
 }
 const mb=document.getElementById('msb');
 if(mb&&rStaff(me)&&!mb.querySelector('#rkreps')){
  const b=document.createElement('button');b.id='rkreps';b.className='msi';
  b.innerHTML='<span class="ic">⚑</span><span>Reports</span>';
  b.onclick=()=>{try{closeMore()}catch(e){}rPanel()};
  mb.appendChild(b);
 }
}
(function(){
 rStyle();
 const ob=new MutationObserver(()=>{
  if(RBUSY)return;RBUSY=1;
  requestAnimationFrame(()=>{RBUSY=0;try{rPaint()}catch(e){}});
 });
 const ready=()=>{
  const a=document.getElementById('app');if(a)ob.observe(a,{childList:true,subtree:true});
  const s=document.getElementById('msheet');if(s)ob.observe(s,{childList:true,subtree:true});
  addEventListener('hashchange',()=>setTimeout(()=>{try{rPaint()}catch(e){}},40));
  try{rPaint()}catch(e){}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
