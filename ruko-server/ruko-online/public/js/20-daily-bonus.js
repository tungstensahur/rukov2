/* ---------- v20: daily login bonus ---------- */
let SDATA=null,SREQ=0,STRIES=0,SBUSY=0;
const sMe=()=>{try{return cur()}catch(e){return null}};
const sHome=()=>{const h=(location.hash||'').replace(/^#/,'');return h===''||h==='/'};
function sStyle(){
 if(document.getElementById('rk-streak-style'))return;
 const st=document.createElement('style');st.id='rk-streak-style';
 st.textContent='#rkstreak{margin:0 0 14px;border-color:var(--ac)}'+
 '.rk-sh{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}'+
 '.rk-sh b{font-size:16px}.rk-day{font-size:12px;background:var(--ac);color:#fff;border-radius:8px;padding:2px 9px}'+
 '.rk-rew{margin:6px 0 4px;font-size:14px}'+
 '.rk-dots{display:flex;gap:6px;margin:8px 0 6px}.rk-dots i{width:100%;max-width:34px;height:6px;border-radius:4px;background:var(--bd)}'+
 '.rk-dots i.on{background:var(--ac)}'+
 '.rk-item{font-size:13px;color:var(--mut)}'+
 '#rkstreak .rk-btnrow{margin-top:10px}'+
 '#rkstreak button{min-height:38px}'+
 '#rkdone{display:block;margin-top:8px;font-size:13px}'+
 '.rk-admin{margin-top:12px;padding-top:10px;border-top:1px dashed var(--bd);display:none}'+
 '.rk-admin.on{display:block}.rk-admin label{font-size:12px;color:var(--mut)}'+
 '.rk-admin select{margin:4px 0 6px}';
 document.head.appendChild(st);
}
function sBuild(){
 const d=document.createElement('div');d.id='rkstreak';d.className='card';
 d.innerHTML='<div class="rk-sh"><b>🎁 Daily bonus</b><span class="rk-day" id="rkday">Day 1</span></div>'+
  '<div class="rk-rew" id="rkrew"></div>'+
  '<div class="rk-dots" id="rkdots"><i></i><i></i><i></i><i></i><i></i></div>'+
  '<div class="rk-item" id="rkitem"></div>'+
  '<div class="rk-btnrow"><button class="pri" id="rkclaim">Collect</button></div>'+
  '<span class="mut" id="rkdone"></span>'+
  '<div class="rk-admin" id="rkadmin"><label for="rkpick">Day 5 reward item (Ruko only)</label><select id="rkpick"></select><button id="rksave">Save item</button></div>';
 return d;
}
function sFill(card){
 const me=sMe(),d=SDATA||{day:1,reward:10,canClaim:false};
 const sig=[d.day,d.reward,d.canClaim,d.item&&d.item.id,me&&me.admin?1:0,SBUSY].join('|');
 if(card.dataset.sig===sig)return;
 card.dataset.sig=sig;
 card.querySelector('#rkday').textContent='Day '+(d.day||1);
 card.querySelector('#rkrew').innerHTML='Today: <b>+'+d.reward+' Rukes</b>';
 card.querySelectorAll('#rkdots i').forEach((i,n)=>{i.className=n<Math.min(d.day||1,5)?'on':''});
 const it=card.querySelector('#rkitem');
 it.textContent=d.item?('Day 5 reward: '+d.item.name):(me&&me.admin?'Day 5 reward: none picked yet':'Day 5 reward: set by Ruko');
 const btn=card.querySelector('#rkclaim'),done=card.querySelector('#rkdone');
 if(d.canClaim){btn.style.display='';done.style.display='none';btn.textContent='Collect '+(d.reward||10)+' Rukes';btn.disabled=!!SBUSY;btn.onclick=sClaim}
 else{btn.style.display='none';done.style.display='';done.textContent='Collected today — come back tomorrow.'}
 const adm=card.querySelector('#rkadmin');
 if(me&&me.admin){
  adm.classList.add('on');
  const sel=card.querySelector('#rkpick');
  if(!sel.options.length){
   let list=[];try{list=hats()}catch(e){}
   sel.innerHTML='<option value="">— none —</option>'+list.slice(0,300).map(h=>'<option value="'+esc(h.id)+'">'+esc(h.name)+(h.price?' · 🪙 '+h.price:'')+'</option>').join('');
  }
  sel.value=(d.item&&d.item.id)||'';
  card.querySelector('#rksave').onclick=sSave;
 }
}
async function sClaim(){
 if(SBUSY)return;
 const me=sMe();if(!me)return;
 SBUSY=1;const card=document.getElementById('rkstreak');if(card)sFill(card);
 let r=null;try{r=await api('/api/daily',{action:'claim'})}catch(e){r=null}
 SBUSY=0;
 const c=document.getElementById('rkstreak');
 if(r&&r.ok){
  if(typeof r.coins==='number'){me.coins=r.coins;const el=document.getElementById('coins');if(el)el.textContent='🪙 '+r.coins}
  if(r.status)SDATA=r.status;
  toast('Day '+r.day+': +'+r.reward+' Rukes'+(r.item?(' and '+r.item.name+'!'):'!'),true);
 }else toast((r&&r.error)||'Could not collect right now. Try again later.');
 if(c)sFill(c);
}
async function sSave(){
 const card=document.getElementById('rkstreak');if(!card)return;
 const sel=card.querySelector('#rkpick'),btn=card.querySelector('#rksave');
 btn.disabled=true;
 let r=null;try{r=await api('/api/daily',{action:'set',item:sel.value})}catch(e){r=null}
 btn.disabled=false;
 if(r&&r.ok){
  let item=null;
  if(sel.value){try{const h=hats().find(x=>x.id===sel.value);if(h)item={id:h.id,name:h.name}}catch(e){}}
  SDATA={...(SDATA||{}),item};
  toast(item?'Day 5 reward set to '+item.name+'.':'Day 5 reward cleared.',true);
 }else toast((r&&r.error)||'Could not save that.');
 sFill(card);
}
function sPaint(){
 sStyle();
 const me=sMe(),box=document.getElementById('app');
 if(!me||!box||!sHome())return;
 let card=box.querySelector('#rkstreak');
 if(!SDATA){
  if(!SREQ&&STRIES<3){
   SREQ=1;STRIES++;
   api('/api/daily').then(r=>{SREQ=0;if(r&&!r.error)SDATA=r;try{sPaint()}catch(e){}},()=>{SREQ=0});
  }
  if(!card){card=sBuild();box.insertBefore(card,box.firstChild);card.querySelector('#rkrew').textContent='Checking your streak…';card.querySelector('#rkclaim').style.display='none'}
  return;
 }
 if(!card){card=sBuild();box.insertBefore(card,box.firstChild)}
 sFill(card);
}
(function(){
 sStyle();
 let SDRAW=0;
 const ob=new MutationObserver(()=>{
  if(SDRAW)return;SDRAW=1;
  requestAnimationFrame(()=>{SDRAW=0;try{sPaint()}catch(e){}});
 });
 const ready=()=>{
  const a=document.getElementById('app');if(a)ob.observe(a,{childList:true,subtree:true});
  addEventListener('hashchange',()=>setTimeout(()=>{try{sPaint()}catch(e){}},40));
  try{sPaint()}catch(e){}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
