// Packages: custom bodies for the player rig, made by the Ruko account and worn by anyone.
// A package has two halves:
//   sizes  - head/torso/arms/legs widths, heights, depths and spacing (the classic body)
//   mesh   - per body part, a list of pieces built from the same shapes the accessory editor uses
// A part with pieces uses them instead of its plain box; a part without pieces keeps its box.
// Colours may be a hex value or @skin / @shirt / @pants, which follow the player's own colours.
// A piece may also show the face or the t-shirt instead of a colour (tex).
// Everything is clamped and nothing is code, so a strange package can never break the rig.
//   GET  /api/packages
//   POST /api/packages {action:'create'|'update'|'delete', ...}   (Ruko only)
const MAX=40, MAXP=16;
const SHAPES=['box','sphere','dome','cylinder','cone','pyramid','prism','octa','ico','torus'];
const FINISH=['matte','shiny','metal','glass','neon'];
const TOKEN=['@skin','@shirt','@pants'];
const TEX=['none','face','tee'];
const SLOTS=['head','torso','arms','legs'];
const N=(o,k,a,b,d)=>{
 const v=o&&typeof o=='object'?+o[k]:NaN;
 return Math.max(a,Math.min(b,isNaN(v)?d:v));
};
const part=(o,w,h,d,def)=>({
 w:N(o,'w',w[0],w[1],def.w),
 h:N(o,'h',h[0],h[1],def.h),
 d:N(o,'d',d[0],d[1],def.d)
});
const piece=p=>{
 if(!p||typeof p!=='object')return null;
 const t=String(p.t||'box');
 if(!SHAPES.includes(t))return null;
 const c=String(p.c||'@skin');
 return {
  t,
  c:TOKEN.includes(c)?c:(/^#[0-9a-f]{3,8}$/i.test(c)?c.toLowerCase():'@skin'),
  f:FINISH.includes(p.f)?p.f:'matte',
  sx:N(p,'sx',.05,4,1),sy:N(p,'sy',.05,4,1),sz:N(p,'sz',.05,4,1),
  rnd:N(p,'rnd',0,1,0),
  tex:TEX.includes(String(p.tex))?String(p.tex):'',
  x:N(p,'x',-2.5,2.5,0),y:N(p,'y',-2.5,2.5,0),z:N(p,'z',-2.5,2.5,0),
  r:N(p,'r',-180,180,0),q:N(p,'q',-180,180,0),ry:N(p,'ry',-180,180,0),
  m:p.m?1:0
 };
};
const mesh=m=>{
 if(!m||typeof m!=='object')return null;
 const out={};let n=0;
 for(const k of SLOTS){
  const list=Array.isArray(m[k])?m[k].slice(0,MAXP).map(piece).filter(Boolean):[];
  out[k]=list;
  n+=list.length;
 }
 return n?out:null;
};
const CLASSIC={
 id:'classic',name:'Classic',
 head:{w:.7,h:.7,d:.7},
 torso:{w:1.2,h:1.2,d:.6},
 arms:{w:.55,h:1.2,d:.55},
 legs:{w:.55,h:1.2,d:.55},
 spread:1,mesh:null,creator:'Ruko',at:0
};
function pack(p){
 if(!p||typeof p!=='object')return null;
 const id=String(p.id||'').replace(/[^\w-]/g,'').slice(0,20);
 if(!id)return null;
 return {
  id,
  name:String(p.name||'Package').replace(/\s+/g,' ').trim().slice(0,24)||'Package',
  head:part(p.head,[.3,2],[.3,2],[.3,2],CLASSIC.head),
  torso:part(p.torso,[.5,3],[.5,3],[.25,1.8],CLASSIC.torso),
  arms:part(p.arms,[.15,1.5],[.3,3],[.15,1.5],CLASSIC.arms),
  legs:part(p.legs,[.15,1.5],[.3,3],[.15,1.5],CLASSIC.legs),
  spread:N(p,'spread',.5,2,1),
  mesh:mesh(p.mesh),
  creator:String(p.creator||'Ruko').slice(0,20),
  at:+p.at||Date.now()
 };
}
const list=D=>{
 if(!Array.isArray(D.packages))D.packages=[];
 if(!D.packages.some(p=>p&&p.id==='classic'))D.packages.unshift({...CLASSIC,at:Date.now()});
 return D.packages.map(pack).filter(Boolean);
};

module.exports=function packages(c){
 const {req,res,b,me,send,need,D,save,p}=c;
 if(p==='/api/packages'||p==='/api/packages/'){
  if(req.method!=='POST')return send(res,200,{packages:list(D)});
  if(!me)return need();
  if(!me.admin)return send(res,403,{error:'Only the Ruko account can change packages.'});
  const act=String(b.action||'create');
  const all=list(D);
  if(act==='delete'){
   const id=String(b.id||'');
   if(id==='classic')return send(res,400,{error:'The classic body cannot be removed.'});
   D.packages=D.packages.filter(x=>x.id!==id);
   save();
   return send(res,200,{ok:1,packages:all.filter(x=>x.id!==id)});
  }
  if(act==='create'){
   if(D.packages.length>=MAX)return send(res,400,{error:'There are already '+MAX+' packages.'});
   let id='pc'+Math.random().toString(36).slice(2,8);
   while(D.packages.some(x=>x.id===id))id='pc'+Math.random().toString(36).slice(2,8);
   const made=pack({...b,id,creator:me.name,at:Date.now()});
   D.packages.push(made);
   save();
   return send(res,200,{ok:1,package:pack(made),packages:list(D)});
  }
  if(act==='update'){
   const i=D.packages.findIndex(x=>x.id===String(b.id||''));
   if(i<0)return send(res,404,{error:'No such package.'});
   if(D.packages[i].id==='classic')return send(res,400,{error:'The classic body cannot be changed.'});
   D.packages[i]=pack({...D.packages[i],...b,id:D.packages[i].id,creator:D.packages[i].creator,at:Date.now()});
   save();
   return send(res,200,{ok:1,package:pack(D.packages[i]),packages:list(D)});
  }
  return send(res,400,{error:'Unknown action.'});
 }
 return send(res,404,{error:'Not found.'});
};

module.exports.pack=pack;
module.exports.list=list;
module.exports.piece=piece;
module.exports.mesh=mesh;
module.exports.CLASSIC=CLASSIC;
