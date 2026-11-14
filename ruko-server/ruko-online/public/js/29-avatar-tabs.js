/* ---------- v29: the avatar editor, split into tabs ---------- */
/* The avatar screen used to be one long stack of cards: skin, face, clothes and accessories all at
   once. This file leaves that markup alone and simply puts tabs above the settings column, so only
   one group is on screen at a time. The 3D preview stays visible on the left whatever tab is open.
   Saving is untouched: changing a tab never changes what is worn. */
(function(){
 if(window.RKAV29)return;
 window.RKAV29=1;

 const KEY='ruko_avtab';
 const read=()=>{try{return localStorage.getItem(KEY)||'body'}catch(e){return 'body'}};
 const write=v=>{try{localStorage.setItem(KEY,v)}catch(e){}};
 let tab=read();

 const TABS=[['body','Body','🧑'],['clothes','Clothes','👕'],['acc','Accessories','🎩']];

 function css(){
  if(document.getElementById('rkav29-style'))return;
  const st=document.createElement('style');
  st.id='rkav29-style';
  st.textContent=`
/* the tab strip sits above the settings cards */
.rk-avtabs{display:flex;gap:6px;margin:0 0 12px;position:sticky;top:var(--rk-avtop,0px);z-index:3}
.rk-avtabs button{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:6px;
 padding:10px 8px;min-height:44px;border-radius:12px;border:1px solid var(--bd);background:var(--card);
 color:var(--tx);font-weight:600;font-size:14px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rk-avtabs button:hover{border-color:var(--ac)}
.rk-avtabs button.on{background:var(--ac);border-color:var(--ac);color:#fff;box-shadow:0 6px 16px #5b4bff33}
.rk-avtabs button .ic{font-size:16px;line-height:1}
.rk-avtabs button .n{font-size:11px;opacity:.7;font-weight:500}
/* a card that is hidden by the active tab */
.rk-avcard{transition:opacity .12s}
.rk-avhide{display:none!important}
/* each card used to print its own heading (BODY, CLOTHES, ACCESSORIES). The tab already says that,
   so the heading is dropped and the card starts straight with its first control. */
.rk-avcard>.stg{display:none}
@media(max-width:600px){
 .rk-avtabs{position:static}
 .rk-avtabs button{flex-direction:column;gap:2px;padding:8px 4px;font-size:12px}
 .rk-avtabs button .ic{font-size:18px}
}
`;
  document.head.appendChild(st);
 }

 /* which tab a card belongs to, read from the heading the avatar screen already prints */
 function kindOf(card){
  const g=card.querySelector('.stg');
  const t=g?g.textContent.toLowerCase():'';
  if(/accessor/.test(t))return 'acc';
  if(/clothes/.test(t))return 'clothes';
  if(/body/.test(t))return 'body';
  return null;
 }

 function strip(){
  const el=document.createElement('div');
  el.className='rk-avtabs';
  el.id='rkavtabs';
  el.setAttribute('role','tablist');
  el.innerHTML=TABS.map(([k,n,ic])=>`<button data-avt="${k}" role="tab" aria-selected="${k===tab}" class="${k===tab?'on':''}"><span class="ic">${ic}</span><span>${n}</span></button>`).join('');
  el.addEventListener('click',e=>{
   const b=e.target.closest('[data-avt]');
   if(!b)return;
   tab=b.dataset.avt;write(tab);paint(true);
  });
  return el;
 }

 /* hide the cards that are not in the open tab */
 function paint(){
  const root=document.getElementById('rkav');
  if(!root)return;
  root.dataset.avt=tab;
  root.querySelectorAll('.rk-avcard').forEach(c=>{
   const k=c.dataset.avkind;
   c.classList.toggle('rk-avhide',!!k&&k!==tab);
  });
  root.querySelectorAll('#rkavtabs [data-avt]').forEach(b=>{
   const on=b.dataset.avt===tab;
   b.classList.toggle('on',on);
   b.setAttribute('aria-selected',on?'true':'false');
  });
 }

 function apply(){
  const h=[...document.querySelectorAll('#app h2')].find(x=>/^\s*avatar\s*$/i.test(x.textContent||''));
  if(!h)return;
  const hat=h.nextElementSibling;
  if(!hat||!hat.classList||!hat.classList.contains('hat'))return;
  const col=hat.children[1];
  if(!col)return;
  /* the column of settings cards, marked so we can hide and show them */
  hat.id='rkav';
  if(!col.dataset.rkavcol){
   col.dataset.rkavcol='1';
   col.querySelectorAll(':scope>.card').forEach(c=>{
    const k=kindOf(c);
    if(!k)return;
    c.classList.add('rk-avcard');
    c.dataset.avkind=k;
   });
  }
  /* the tab strip: rebuilt on every avatar re-render, like the cards themselves */
  if(!col.querySelector('#rkavtabs'))col.insertBefore(strip(),col.firstChild);
  paint();
 }

 function watch(){
  const host=document.getElementById('app');
  if(!host||typeof MutationObserver=='undefined')return;
  let q=0;
  new MutationObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;try{apply()}catch(e){}}) }).observe(host,{childList:true,subtree:true});
 }

 css();
 apply();
 watch();
 /* the avatar screen is also drawn on a timer by the app shell in a few places, so a cheap
   safety net keeps the tabs there without touching that code */
 setInterval(()=>{try{if(document.getElementById('app')&&document.querySelector('#app h2'))apply()}catch(e){}},900);
 try{addEventListener('hashchange',()=>setTimeout(apply,60))}catch(e){}
 window.RKAV={get tab(){return tab},set tab(v){tab=v;write(v);paint()},apply};
})();
