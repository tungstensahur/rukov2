/* ---------- v21: in-game interface ---------- */
let GBUILT=0,GMENU=0,GCHAT=1,GLASTT=0,GTXT='';
const gEl=id=>document.getElementById(id);
function gStyle(){
 if(gEl('rk-game-style'))return;
 const st=document.createElement('style');st.id='rk-game-style';
 st.textContent=[
 '#game{background:#070910;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}',
 '#hud{align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top,0px)) 10px 8px;background:linear-gradient(#000000cc,#00000000);pointer-events:none}',
 '#hud>*{pointer-events:auto}',
 '.rk-hud-l{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}',
 '#gt{font-size:14px;font-weight:800;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58vw}',
 '#gt small{font-weight:600;opacity:.7;font-size:11px}',
 '#gh{font-size:12px;opacity:.9;font-weight:700;letter-spacing:.02em}',
 '.rk-hud-r{display:flex;gap:6px;flex:none}',
 '.rk-hbtn{width:42px;height:42px;border-radius:13px;border:1px solid #ffffff2e;background:#00000066;color:#fff;font-size:18px;line-height:1;padding:0;backdrop-filter:blur(8px);position:relative}',
 '.rk-hbtn:active{background:#ffffff22}',
 '.rk-badge{position:absolute;top:-4px;right:-4px;min-width:17px;height:17px;border-radius:9px;background:#e5484d;color:#fff;font-size:11px;font-weight:800;line-height:17px;text-align:center;padding:0 4px;display:none}',
 '.rk-badge.on{display:block}',
 '#ex.rk-gone{position:absolute;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none}',
 '.rk-gmenu{position:absolute;inset:0;z-index:45;background:#04060c;background:#04060ccc;backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:14px}',
 '.rk-gmenu.on{display:flex}',
 '.rk-gcard{width:min(430px,100%);max-height:84vh;overflow:auto;background:#11141d;color:#eef0ff;border:1px solid #ffffff1f;border-radius:18px;padding:16px;box-shadow:0 24px 70px #000c}',
 '.rk-gtop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}',
 '.rk-gtop b{font-size:18px;line-height:1.2}.rk-gtop .rk-gsub2{font-size:12px;color:#9aa0ad;margin-top:2px}',
 '.rk-gx{width:34px;height:34px;border-radius:10px;border:1px solid #ffffff1f;background:#ffffff10;color:#fff;font-size:15px;padding:0;line-height:1}',
 '.rk-gact{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}',
 '.rk-gact button{min-height:52px;border-radius:14px;border:1px solid #ffffff1f;background:#1b2030;color:#eef0ff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px}',
 '.rk-gact button.rk-danger{background:#3a1520;border-color:#7f2436;color:#ffd9e1}',
 '.rk-gact button:disabled{opacity:.45}',
 '.rk-gact span{font-size:17px}',
 '.rk-gsub3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#8b90a8;margin:4px 0 8px}',
 '.rk-gpl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}',
 '.rk-gpl li{display:flex;align-items:center;gap:9px;background:#181c28;border:1px solid #ffffff14;border-radius:11px;padding:9px 11px;font-size:14px}',
 '.rk-gpl .rk-dot{width:8px;height:8px;border-radius:50%;background:#35c4a0;flex:none}',
 '.rk-gpl .rk-me{margin-left:auto;font-size:11px;color:#ffd23f;font-weight:700}',
 '.rk-gpl .rk-kd{margin-left:auto;font-size:12px;color:#9aa0ad}',
 '.rk-gempty{font-size:13px;color:#9aa0ad;background:#181c28;border:1px dashed #ffffff1f;border-radius:11px;padding:12px}',
 '.rk-gfoot{font-size:11px;color:#7c8199;margin-top:12px;line-height:1.5}',
 '#chatw{left:10px;bottom:calc(150px + env(safe-area-inset-bottom,0px));width:min(360px,66vw);background:#080b14d9;border:1px solid #ffffff1a;border-radius:14px;padding:8px;display:flex;flex-direction:column;gap:6px;backdrop-filter:blur(8px)}',
 '#chatw.rk-hide{display:none!important}',
 '.rk-chathead{display:flex;align-items:center;justify-content:space-between;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#9aa0ad;padding:0 2px}',
 '.rk-chathead b{color:#cfd4ea;font-size:11px}',
 '#cbox{display:flex;flex-direction:column;gap:3px;max-height:24vh;overflow:auto;font-size:13px;line-height:1.35}',
 '#cbox div{background:#ffffff10;border-radius:9px;padding:4px 9px;word-break:break-word}',
 '#cbox b{color:#ffd23f;font-weight:700;margin-right:4px}',
 '.rk-emotes{display:flex;gap:5px;flex-wrap:wrap}',
 '.rk-emotes button{font-size:11px;padding:4px 9px;min-height:26px;border-radius:8px;border:1px solid #ffffff1f;background:#ffffff12;color:#d8dcef}',
 '#cin{display:flex;gap:6px;margin:0}#cin input{flex:1;margin:0;padding:9px 11px;min-height:38px;background:#0d1120;color:#fff;border:1px solid #ffffff24;border-radius:10px;font-size:14px}',
 '#cin button{min-height:38px;padding:0 12px;border-radius:10px;border:1px solid #ffffff1f;background:#2f80ed;color:#fff;font-weight:700}',
 '.rk-tapnote{position:absolute;left:50%;bottom:calc(96px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);font-size:12px;color:#9aa0ad;background:#00000088;padding:4px 10px;border-radius:9px;pointer-events:none;display:none}',
 '#pad button{background:#ffffff1c;border:1px solid #ffffff2b;border-radius:16px;color:#fff;font-size:20px;backdrop-filter:blur(8px)}',
 '#pad button:active{background:#ffffff38}',
 '#jb{background:#2f80edcc!important;border-color:#2f80ed!important;font-weight:800;font-size:15px!important}',
 '#padx button{background:#ff4b4bd9!important;border:1px solid #ffffff2e;font-size:15px;box-shadow:0 8px 24px #0007}',
 '#acts button{background:#2f80edd9!important;border:1px solid #ffffff2e;box-shadow:0 8px 24px #0007}',
 '#gmsg{top:calc(60px + env(safe-area-inset-top,0px));font-size:19px;font-weight:800;letter-spacing:.01em}',
 '#gmsg span{background:#000000a8;padding:7px 14px;border-radius:11px;display:inline-block}',
 '#hpb{bottom:calc(12px + env(safe-area-inset-bottom,0px));height:12px;border:1px solid #ffffff2b;background:#00000080}',
 '#hpb i{background:linear-gradient(90deg,#35c4a0,#5bd16a)}',
 '#kdl{top:auto;bottom:calc(196px + env(safe-area-inset-bottom,0px));right:10px;background:#00000080;border-radius:10px;padding:6px 9px;font-size:12px;max-width:52vw;line-height:1.4}',
 '#wl{bottom:calc(32px + env(safe-area-inset-bottom,0px));background:#00000080;display:inline-block;width:auto;left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:9px;font-size:12px}',
 '#svd{top:auto;bottom:calc(232px + env(safe-area-inset-bottom,0px));left:10px;background:#00000080;border-radius:10px;padding:5px 10px;font-size:12px}',
 '#sbd{top:calc(64px + env(safe-area-inset-top,0px));right:10px;background:#00000070;border-radius:11px;padding:6px 9px;font-size:11px;line-height:1.5;text-align:left;display:none}',
 '@media(max-width:520px){#gt{max-width:46vw;font-size:13px}#chatw{width:78vw;bottom:calc(168px + env(safe-area-inset-bottom,0px))}#cbox{max-height:20vh}.rk-gact{grid-template-columns:1fr}}'
 ].join('\n');
 document.head.appendChild(st);
}
function gTidy(){
 const t=gEl('gt');if(!t)return;
 const raw=t.textContent||'';
 if(raw===GTXT)return;
 GTXT=raw;
 const bits=raw.split(' · ');
 if(bits.length<2)return;
 t.innerHTML=''+esc(bits[0])+(bits[1]&&/^Server/.test(bits[1])?' <small>'+esc(bits[1].replace('Server ','server #'))+'</small>':'');
}
function gPlayers(){
 const list=gEl('gplist');if(!list)return;
 const P=Array.isArray(window.RKROSTER)?window.RKROSTER:[];
 if(!P.length){
  list.innerHTML='<li class="rk-gempty">'+(window.RKPLAY&&window.RKPLAY.solo?'You are playing solo — nobody else is here.':'No one else has joined yet.')+'</li>';
  return;
 }
 list.innerHTML=P.map(p=>{
  const nm=esc(p.name||'Player');
  const kd=(p.k!=null||p.d!=null)?'<span class="rk-kd">'+(p.k||0)+' / '+(p.d||0)+'</span>':'';
  return '<li><span class="rk-dot"></span><span>'+nm+'</span>'+(p.isMe?'<span class="rk-me">you</span>':kd)+'</li>';
 }).join('');
}
function gOpen(){
 const m=gEl('rk-gmenu');if(!m)return;
 GMENU=1;m.classList.add('on');
 const t=gEl('gmtitle');if(t)t.textContent=(window.RKPLAY&&window.RKPLAY.game)||'Game menu';
 const rs=gEl('gmrespawn');
 if(rs){
  const can=!!(window.RKPLAY&&typeof window.RKPLAY.respawn==='function');
  rs.disabled=!can;rs.title=can?'':'Respawn is not available in this game';
  rs.innerHTML='<span>↻</span>Respawn';
 }
 gPlayers();
}
function gClose(){const m=gEl('rk-gmenu');if(m)m.classList.remove('on');GMENU=0}
function gChat(show){
 const cw=gEl('chatw');if(!cw)return;
 GCHAT=show?1:0;
 cw.style.display=GCHAT?'flex':'none';
 if(GCHAT){const b=gEl('rkchatbadge');if(b)b.classList.remove('on')}
}
function gSend(t){
 const i=gEl('ci'),b=gEl('cs');
 if(!i||!b)return;
 i.value=t;
 try{b.click()}catch(e){}
 gChat(1);
}
function gBuild(){
 gStyle();
 const W=gEl('game');if(!W)return;
 const hud=gEl('hud');if(!hud)return;
 if(gEl('rk-gmenu')){
  GBUILT=1;
  const ex=gEl('ex');if(ex&&!ex.classList.contains('rk-gone'))ex.classList.add('rk-gone');
  gClose();gPlayers();gTidy();return;
 }
 GBUILT=1;
 const left=document.createElement('div');left.className='rk-hud-l';
 const right=document.createElement('div');right.className='rk-hud-r';
 const gt=gEl('gt'),gh=gEl('gh'),ex=gEl('ex');
 if(gt){left.appendChild(gt);GTXT=''}
 if(gh)left.appendChild(gh);
 if(ex){ex.classList.add('rk-gone');left.appendChild(ex)}
 const cb=document.createElement('button');cb.className='rk-hbtn';cb.id='rkchatbtn';cb.setAttribute('aria-label','Chat');
 cb.innerHTML='💬<span class="rk-badge" id="rkchatbadge"></span>';
 const mb=document.createElement('button');mb.className='rk-hbtn';mb.id='rkmenubtn';mb.setAttribute('aria-label','Game menu');
 mb.textContent='☰';
 right.append(cb,mb);
 hud.innerHTML='';hud.append(left,right);
 if(ex)hud.appendChild(ex);
 const menu=document.createElement('div');menu.id='rk-gmenu';menu.className='rk-gmenu';
 menu.innerHTML='<div class="rk-gcard"><div class="rk-gtop"><div><b id="gmtitle">Game menu</b><div class="rk-gsub2" id="gmsub">Take a breather</div></div><button class="rk-gx" id="gmclose" aria-label="Close">✕</button></div>'+
  '<div class="rk-gact"><button id="gmrespawn"><span>↻</span>Respawn</button><button id="gmleave" class="rk-danger"><span>🚪</span>Leave game</button></div>'+
  '<div class="rk-gsub3">Players in this server</div><ul class="rk-gpl" id="gplist"></ul>'+
  '<div class="rk-gfoot">Respawn puts you back at the start of the level.</div></div>';
 W.appendChild(menu);
 const cw=gEl('chatw');
 if(cw&&!cw.querySelector('.rk-chathead')){
  const head=document.createElement('div');head.className='rk-chathead';
  head.innerHTML='<b>Chat</b><span id="rkchathint">Enter to send</span>';
  cw.prepend(head);
  const em=document.createElement('div');em.className='rk-emotes';
  em.innerHTML=['GG','Hi!','Nice!','Help'].map(t=>'<button data-e="'+t+'">'+t+'</button>').join('');
  cw.appendChild(em);
  em.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>gSend(b.dataset.e));
 }
 cb.onclick=()=>gChat(!GCHAT);
 mb.onclick=()=>GMENU?gClose():gOpen();
 gEl('gmclose').onclick=gClose;
 gEl('gmrespawn').onclick=()=>{
  if(window.RKPLAY&&typeof window.RKPLAY.respawn==='function'){gClose();try{window.RKPLAY.respawn()}catch(e){}toast('Back at the start.',true)}
  else toast('Respawn is not available in this game.');
 };
 gEl('gmleave').onclick=()=>{gClose();const e=gEl('ex');if(e)e.click()};
 const cbox=gEl('cbox');
 if(cbox&&!cbox.dataset.watched){
  cbox.dataset.watched='1';
  new MutationObserver(()=>{
   const b=gEl('rkchatbadge');if(!b)return;
   if(!GCHAT)b.classList.add('on');
  }).observe(cbox,{childList:true});
 }
 gChat(window.innerWidth>560?1:0);
 gPlayers();gTidy();
 const note=gEl('rk-tapnote');
 if(note&&window.innerWidth<=560){note.style.display='block';clearTimeout(window.__rkNote);window.__rkNote=setTimeout(()=>{note.style.display='none'},4200)}
}
function gWatch(){
 gStyle();
 const W=gEl('game');if(!W)return;
 const W2=W;
 if(!gEl('rk-tapnote')){
  const note=document.createElement('div');note.id='rk-tapnote';note.className='rk-tapnote';
  note.textContent='Tap ☰ for respawn or to leave';W2.appendChild(note);
 }
 let wasOn=false;
 const tick=()=>{
  const on=!!W2.style.display&&W2.style.display!=='none';
  if(on&&!wasOn){wasOn=true;gBuild();gClose();gTidy();gPlayers()}
  else if(!on&&wasOn){wasOn=false;gClose();GBUILT=0;window.RKROSTER=[];if(window.RKPLAY)window.RKPLAY=null}
 };
 tick();
 new MutationObserver(tick).observe(W2,{attributes:true,attributeFilter:['style']});
 addEventListener('rk-roster',()=>{if(GMENU)gPlayers()});
 gTidy();
}
(function(){
 gStyle();
 const ready=()=>{try{gWatch()}catch(e){}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();
