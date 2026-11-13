/* ---------- v18: short descriptions for catalog items ---------- */
let IDESC=null,IBUSY=0,ILOADED=0;
const iGet=p=>Promise.race([api(p).catch(()=>null),new Promise(r=>setTimeout(()=>r(null),6000))]);
function iLoad(){
 if(ILOADED)return Promise.resolve(IDESC);
 ILOADED=1;
 return iGet('/api/descs').then(r=>{IDESC=(r&&r.descs)||{};return IDESC},()=>{IDESC={};return IDESC});
}
const iId=()=>{const m=/^#\/hat\/([\w-]+)/.exec(location.hash||'');return m?m[1]:null};
function iOwner(h){try{const me=cur();return !!(me&&me.name&&(me.admin||(h.creator||'').toLowerCase()===me.name.toLowerCase()))}catch(e){return false}}
function iEdit(id,box){
 const h=hats().find(x=>x.id==id);
 if(!iOwner(h))return;
 const ta=document.createElement('textarea');
 ta.className='ita';ta.rows=3;ta.maxLength=240;ta.value=IDESC[id]||'';
 ta.placeholder='Say what this item is and why someone should wear it.';
 const row=document.createElement('div');row.className='irow';
 const save=document.createElement('button');save.className='pri';save.textContent='Save';
 const cancel=document.createElement('button');cancel.textContent='Cancel';
 const err=document.createElement('div');err.className='err';
 row.append(save,cancel);
 box.innerHTML='';box.append(ta,row,err);
 cancel.onclick=()=>{box.remove();iPaint()};
 save.onclick=()=>{
  save.disabled=true;err.textContent='';
  api('/api/descs',{id,text:ta.value}).then(r=>{
   save.disabled=false;
   if(r&&r.descs){IDESC=r.descs;box.remove();iPaint();toast(r.descs[id]?'Description saved.':'Description removed.',true)}
   else err.textContent=(r&&r.error)||'Could not save. Try again.';
  },()=>{save.disabled=false;err.textContent='Could not save. Try again.'});
 };
 ta.focus();
}
function iPaint(){
 const box=document.getElementById('app');
 if(!box)return;
 if(!IDESC){iLoad().then(iPaint);return}
 box.querySelectorAll('[data-h]').forEach(t=>{
  const ds=IDESC[t.dataset.h];
  if(!ds||t.querySelector('.idesc'))return;
  const d=document.createElement('div');d.className='idesc';d.textContent=ds;
  const b=t.querySelector('b');
  if(b&&b.parentNode===t)b.insertAdjacentElement('afterend',d);else t.appendChild(d);
 });
 const id=iId();
 if(!id||box.querySelector('.idesc-full'))return;
 const h=hats().find(x=>x.id==id);
 if(!h)return;
 const h2=box.querySelector('h2');
 if(!h2)return;
 const ds=IDESC[id]||'';
 const wrap=document.createElement('div');wrap.className='idesc-full';
 const tx=document.createElement('span');tx.className=ds?'itx':'itx mut';
 tx.textContent=ds||'No description yet.';
 wrap.appendChild(tx);
 if(iOwner(h)){
  const b=document.createElement('button');b.className='iedit';
  b.textContent=ds?'✎ Edit description':'+ Add description';
  b.onclick=()=>iEdit(id,wrap);
  wrap.appendChild(b);
 }
 h2.insertAdjacentElement('afterend',wrap);
}
(function(){
 const st=document.createElement('style');st.id='rk-idesc-style';
 st.textContent='.idesc{color:var(--mut);font-size:12px;line-height:1.35;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'+
 '.idesc-full{color:var(--tx);font-size:14px;line-height:1.55;margin:6px 0 10px;white-space:pre-wrap;word-break:break-word}'+
 '.idesc-full .mut{color:var(--mut);font-style:italic}'+
 '.iedit{margin-left:8px;font-size:12px;padding:3px 9px;vertical-align:middle;white-space:nowrap}'+
 '.ita{width:100%;padding:10px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font:inherit;resize:vertical}'+
 '.irow{display:flex;gap:6px;margin-top:6px}.irow button{min-height:36px}';
 document.head.appendChild(st);
 const ob=new MutationObserver(()=>{
  if(IBUSY)return;IBUSY=1;
  requestAnimationFrame(()=>{IBUSY=0;try{iPaint()}catch(e){}});
 });
 const app=document.getElementById('app');
 if(app)ob.observe(app,{childList:true,subtree:true});
 addEventListener('hashchange',()=>setTimeout(()=>{try{iPaint()}catch(e){}},40));
 iLoad().then(()=>{try{iPaint()}catch(e){}});
})();
