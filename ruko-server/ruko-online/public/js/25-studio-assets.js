/* ---------- v25: uploading pictures and sounds for a game ---------- */
/* Adds the "picture" and "sound" pickers inside the block editor: choose something already
   uploaded, or press ＋ Upload to add a new one. Uploads are shrunk in the browser before they
   are sent, so a phone screenshot still fits through the server's size limits. */
(function(){
 if(window.RKSTUDIOASSETS)return;
 window.RKSTUDIOASSETS=1;
 const MAXIMG=240000,MAXSND=300000;
 const cache={};
 const ge=()=>{try{return typeof GE==='undefined'?null:GE}catch(e){return null}};
 const gid=()=>{const g=ge();return (g&&g.id)||''};
 const list=()=>{const c=cache[gid()];return (c&&c.list)||[]};
 const say=m=>{try{typeof toast==='function'?toast(m):console.log(m)}catch(e){}};

 function ensure(){
  const g=gid();if(!g)return;
  const c=cache[g]=cache[g]||{list:[],loaded:false,loading:false};
  if(c.loaded||c.loading)return;
  c.loading=true;
  api('/api/assets?game='+encodeURIComponent(g)).then(d=>{
   c.list=(d&&d.assets)||[];c.loaded=true;c.loading=false;
   try{if($('#cd'))codeRender()}catch(e){}
  },()=>{c.loading=false});
 }
 function reload(){
  const c=cache[gid()];if(c){c.loaded=false;c.loading=false}
  ensure();
 }

 /* ---------- the editor's inputs, with a picture/sound picker ---------- */
 const origInputs=window.inputsHTML;
 window.inputsHTML=function(b,fl,path){
  const objs=((ge()&&ge().objs)||[]).map((o,i)=>[o.u||'',labelOf(o,i)]);
  return (fl||[]).map(f=>{
   const k=f[0],ty=f[1],op=f[2];
   if(k=='t')return '<span class="bt">'+esc(ty)+'</span>';
   const v=getKey(b,k),a='data-bp="'+path+'" data-bk="'+k+'"';
   if(ty=='text')return '<input class="bi" '+a+' value="'+esc(v)+'" maxlength="80" placeholder="'+esc((op&&op.ph)||'')+'" size="'+Math.max(6,Math.min(18,String(v).length+2))+'">';
   if(ty=='num'){const o2=op||NUM;return '<input class="bi n" type="number" '+a+' value="'+(+v)+'" min="'+o2.min+'" max="'+o2.max+'" step="'+(o2.step||1)+'">'}
   if(ty=='col')return '<input class="bi c" type="color" '+a+' value="'+esc(v||'#ffffff')+'">';
   if(ty=='sel')return '<select class="bi" '+a+'>'+op.o.map(x=>'<option value="'+x[0]+'" '+(String(x[0])==String(v)?'selected':'')+'>'+esc(x[1])+'</option>').join('')+'</select>';
   if(ty=='obj'){const has=objs.some(x=>x[0]==v&&v);return '<select class="bi" '+a+'><option value="">(choose an object)</option>'+(has?'':'<option value="'+esc(v)+'" selected>(deleted object)</option>')+objs.map(x=>'<option value="'+x[0]+'" '+(x[0]==v?'selected':'')+'>'+esc(x[1])+'</option>').join('')+'</select>'}
   if(ty=='asset'){
    const kind=(op&&op.kind)||'img';
    const items=list().filter(x=>x.k===kind);
    const url=v?('/api/asset/'+encodeURIComponent(gid())+'/'+encodeURIComponent(v)):'';
    return '<span class="rk-af"><select class="bi" '+a+'><option value="">(choose '+(kind=='snd'?'a sound':'a picture')+')</option>'
     +(v&&!items.some(x=>x.id==v)?'<option value="'+esc(v)+'" selected>(missing '+(kind==='snd'?'sound':'picture')+')</option>':'')
     +items.map(x=>'<option value="'+x.id+'" '+(x.id==v?'selected':'')+'>'+esc(x.n||'untitled')+'</option>').join('')
     +'</select><button type="button" class="rk-up" data-au="'+path+'" data-ak="'+k+'" data-kind="'+kind+'">＋ Upload</button>'
     +(url&&kind=='img'?'<img class="rk-ap" src="'+url+'" alt="">':'')+'</span>';
   }
   return origInputs?origInputs(b,[f],path):'';
  }).join('');
 };

 /* ---------- pick and upload a file ---------- */
 function pick(path,key,kind){
  const g=gid();
  if(!g)return say('Save this game once, then you can upload.');
  const inp=document.createElement('input');
  inp.type='file';
  inp.accept=kind=='snd'?'audio/*':'image/*';
  inp.style.display='none';
  document.body.appendChild(inp);
  inp.onchange=()=>{
   const f=inp.files&&inp.files[0];
   inp.remove();
   if(!f)return;
   const done=data=>{
    if(!data)return;
    if(data.length>(kind=='snd'?MAXSND:MAXIMG))return say(kind=='snd'?'That sound is too big. Try one under 250 KB.':'That picture is too big. Try a smaller one.');
    say('Uploading…');
    api('/api/assets/upload',{game:g,kind,name:String(f.name||'').slice(0,40),data}).then(r=>{
     if(!r||!r.id){say((r&&r.error)||'Upload failed. Try again.');return}
     const tgt=getAt(path);
     if(tgt){setKey(tgt,key,r.id);try{codeSave()}catch(e){}}
     reload();
     say('Uploaded.',true);
     try{codeRender()}catch(e){}
    },()=>say('Upload failed. Try again.'));
   };
   const fr=new FileReader();
   fr.onload=()=>{
    if(kind=='snd')return done(fr.result);
    const im=new Image();
    im.onload=()=>{
     try{
      const max=512;let w=im.width||512,h=im.height||512;
      const sc=Math.min(1,max/Math.max(w,h));w=Math.max(1,Math.round(w*sc));h=Math.max(1,Math.round(h*sc));
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;
      const g2=cv.getContext('2d');g2.drawImage(im,0,0,w,h);
      let out=cv.toDataURL('image/webp',.8);
      if(out.indexOf('data:image/webp')!==0)out=cv.toDataURL('image/jpeg',.8);
      done(out);
     }catch(e){done(fr.result)}
    };
    im.onerror=()=>done(fr.result);
    im.src=fr.result;
   };
   fr.onerror=()=>done(null);
   fr.readAsDataURL(f);
  };
  inp.click();
 }

 document.addEventListener('click',e=>{
  const b=e.target&&e.target.closest?e.target.closest('[data-au]'):null;
  if(!b)return;
  e.preventDefault();e.stopPropagation();
  pick(b.dataset.au||'',b.dataset.ak||'',b.dataset.kind||'img');
 },true);

 /* ---------- make sure the list is loaded whenever the editor draws ---------- */
 try{
  if(typeof codeRender==='function'){
   const origRender=window.codeRender;
   window.codeRender=function(){ensure();return origRender.apply(this,arguments)};
  }
 }catch(e){}

 try{
  const st=document.createElement('style');st.id='rk-asset-style';
  st.textContent=['.rk-af{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;max-width:100%}',
   '.rk-af select{max-width:190px}',
   '.rk-up{min-height:34px;padding:6px 10px;font-size:13px;border-radius:8px;background:#7c5cff;border-color:#7c5cff;color:#fff}',
   '.rk-ap{width:38px;height:38px;object-fit:cover;border-radius:7px;border:1px solid #3a3d44;background:#111}',
   '#cd .rk-af .bi{font-size:13px}',
   '@media(max-width:900px){.rk-af{width:100%}.rk-af select{flex:1;max-width:none}.rk-up{min-height:40px}}'
  ].join('\n');
  document.head.appendChild(st);
 }catch(e){}

 window.RKASSETS={reload,ensure,list};
})();
