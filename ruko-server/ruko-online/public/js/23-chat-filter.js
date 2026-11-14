/* ---------- v23: chat filter notice ---------- */
/* The server is the one that decides a message is filtered (chatfilter.js) and it answers the
   sender with {ok:1,filtered:1}. This layer only shows the line back to the person who sent it,
   in whatever chat they were using, and puts their text back so they can edit it. */
(function(){
 if(window.RKCHATFILTER)return;
 window.RKCHATFILTER=1;
 const NOTICE='Your message was filtered.';
 const rk$=id=>document.getElementById(id);
 try{
  const st=document.createElement('style');
  st.id='rk-cf-style';
  st.textContent=['.rk-fil{color:#ff9b9b!important;font-style:italic}',
   '#cbox .rk-fil{background:#ff4b4b22;border:1px solid #ff6b6b55}',
   '#cl .rk-fil{margin:4px 0;font-size:13px}'].join('\n');
  document.head.appendChild(st);
 }catch(e){}
 // Append the notice where this chat shows its lines. Stays put for a while, then goes away.
 function note(host,sticky){
  if(!host)return;
  const d=document.createElement('div');
  d.className='rk-fil';
  d.textContent=NOTICE;
  const put=()=>{if(!host.isConnected)return;if(!host.contains(d))host.appendChild(d);host.scrollTop=host.scrollHeight};
  put();
  let ob=null;
  if(sticky){
   // The site chat redraws its list every couple of seconds, so put the line back each time.
   ob=new MutationObserver(()=>put());
   ob.observe(host,{childList:true});
  }
  setTimeout(()=>{
   if(ob)ob.disconnect();
   try{d.remove()}catch(e){}
  },sticky?20000:12000);
 }
 function show(kind,text){
  if(kind==='room'){
   note(rk$('cbox'),false);
   const i=rk$('ci');if(i&&!i.value&&text)i.value=text;
   return;
  }
  if(kind==='site'){
   note(rk$('cl'),true);
   const i=rk$('ct');if(i&&!i.value&&text)i.value=text;
   return;
  }
  // Direct messages: the list is redrawn from the server after every send, so the notice goes in
  // the line under the box instead of into the list itself.
  const err=rk$('dmerr');
  if(err){err.className='err';err.textContent=NOTICE}
  else if(typeof toast==='function')toast(NOTICE);
  const i=rk$('dmi');if(i&&!i.value&&text)i.value=text;
 }
 const of=window.fetch;
 window.fetch=function(input,init){
  let url='';
  try{url=typeof input==='string'?input:(input&&input.url)||''}catch(e){}
  const room=url.indexOf('/api/room/')===0||/\/api\/room\/[^/?]+\/chat(\?|$)/.test(url);
  const site=/\/api\/chat(\?|$)/.test(url);
  const dm=/\/api\/dm(\?|$)/.test(url);
  const p=of.apply(this,arguments);
  if(!(room||site||dm))return p;
  let text='';
  try{text=JSON.parse((init&&init.body)||'{}').text||''}catch(e){}
  return p.then(res=>{
   try{
    if(res&&res.ok)res.clone().json().then(d=>{
     if(d&&d.filtered)show(room?'room':site?'site':'dm',String(text||''));
    }).catch(()=>{});
   }catch(e){}
   return res;
  });
 };
})();
