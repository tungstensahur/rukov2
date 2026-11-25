/* ---------- v34: game sound stops when you leave the game ---------- */
/* A looping track is an audio element owned by the block runner. Leaving a game tears down the
   scene and the renderer but nothing told that element to stop, so the music carried on until the
   page was reloaded. This watches every audio element the game creates and stops them all when the
   player leaves, however they leave. */
(function(){
 if(window.RKSOUNDSTOP)return;
 window.RKSOUNDSTOP=1;
 const A=window.Audio;
 if(!A)return;

 const live=new Set();
 function Tracked(){
  const el=new A(...arguments);
  try{
   live.add(el);
   el.addEventListener('ended',()=>{if(!el.loop)live.delete(el)});
  }catch(e){}
  return el;
 }
 Tracked.prototype=A.prototype;
 try{Object.setPrototypeOf(Tracked,A)}catch(e){}
 window.Audio=Tracked;

 function stopAll(){
  if(!live.size)return;
  live.forEach(el=>{
   try{if(!el.paused)el.pause();if(el.loop)el.currentTime=0;else live.delete(el)}catch(e){}
  });
 }
 try{window.RKSTOPSOUND=stopAll}catch(e){}

 // The exit button, a change of address, or the tab being put away.
 document.addEventListener('click',e=>{
  const t=e.target;
  if(t&&t.closest&&t.closest('#ex'))setTimeout(stopAll,0);
 },true);
 addEventListener('hashchange',stopAll);
 addEventListener('pagehide',stopAll);

 // A game can also be left some other way: back button, the editor's "Test" session ending, or a
 // route the address bar never hears about. The game screen is the thing that actually goes away,
 // so while anything is still sounding, check that it is still on screen. The editor keeps a
 // canvas of its own, which is why this looks at the game screen and not just any canvas.
 const inGame=()=>{
  const g=document.getElementById('game');
  if(!g||g.style.display==='none')return false;
  return !!g.querySelector('canvas');
 };
 let sawGame=false;
 setInterval(()=>{
  if(!live.size)return;
  if(inGame())sawGame=true;
  else if(sawGame)stopAll();
 },400);
})();
/* ---------- the studio's language ----------
   RukoScript is three files that are only needed on the Studio screen, so they are fetched here
   instead of being listed in the page. This file is one the server stamps with its own timestamp on
   every deploy, so a new copy of the language is never served from a browser's cache — which is
   exactly what happens to a file the page names without a version. Each of the three guards itself. */
(function(){
 if(window.RKS_LOADER)return;
 window.RKS_LOADER=1;
 ['60-rukoscript.js','60b-rukoscript-reader.js','60c-rukoscript-editor.js'].forEach(name=>{
  const s=document.createElement('script');
  s.src='js/'+name+'?v='+Date.now();
  s.async=false;
  document.head.appendChild(s);
 });
})();
