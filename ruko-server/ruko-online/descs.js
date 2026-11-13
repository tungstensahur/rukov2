// Short descriptions for catalog items (hats, accessories and t-shirts).
// Stored beside the news: Upstash Redis when configured, otherwise a JSON file in DATA_DIR.
const http=require('http'),fs=require('fs'),path=require('path');
const RURL=(process.env.UPSTASH_REDIS_REST_URL||'').replace(/\/$/,''),RTOK=(process.env.UPSTASH_REDIS_REST_TOKEN)||'';
const FILE=path.join(process.env.DATA_DIR||path.join(__dirname,'data'),'descs.json');
const PORT=process.env.PORT||3000,MAXLEN=240,KEY='ruko:descs';
const json=(res,c,o)=>{res.writeHead(c,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(o))};
const redis=async(cmd,suffix)=>{const r=await fetch(RURL+(suffix||''),{method:'POST',headers:{Authorization:'Bearer '+RTOK,'content-type':'application/json'},body:JSON.stringify(cmd)});const t=await r.text();const j=JSON.parse(t||'{}');if(j&&j.error)throw new Error(j.error);return j.result};
async function readAll(){
 if(RURL&&RTOK){const a=await redis(['HGETALL',KEY])||[],o={};for(let i=0;i<a.length;i+=2)o[a[i]]=a[i+1];return o}
 try{const o=JSON.parse(fs.readFileSync(FILE,'utf8'));return o&&typeof o==='object'?o:{}}catch(e){return {}}
}
async function writeAll(map){
 if(RURL&&RTOK){
  const cur=await redis(['HGETALL',KEY])||[],have=[];for(let i=0;i<cur.length;i+=2)have.push(cur[i]);
  const keep=new Set(Object.keys(map)),cmds=[];
  for(const id in map)cmds.push(['HSET',KEY,id,map[id]]);
  for(const id of have)if(!keep.has(id))cmds.push(['HDEL',KEY,id]);
  if(cmds.length)await redis(cmds,'/pipeline');
  return;
 }
 fs.mkdirSync(path.dirname(FILE),{recursive:true});const tmp=FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(map));fs.renameSync(tmp,FILE);
}
const body=req=>new Promise(ok=>{let s='';req.on('data',d=>{s+=d;if(s.length>100000){req.destroy();ok({})}});req.on('end',()=>{try{ok(JSON.parse(s||'{}'))}catch(e){ok({})}});req.on('error',()=>ok({}))});
const get=(p,headers)=>new Promise(ok=>{
 const r=http.request({host:'127.0.0.1',port:PORT,path:p,method:'GET',headers:headers||{},timeout:4000},res=>{let s='';res.on('data',d=>s+=d);res.on('end',()=>{try{ok(JSON.parse(s))}catch(e){ok(null)}})});
 r.on('error',()=>ok(null));r.on('timeout',()=>{r.destroy();ok(null)});r.end();
});
module.exports=async function(req,res){
 try{
  if(req.method==='GET')return json(res,200,{descs:await readAll()});
  const b=await body(req),auth={authorization:req.headers.authorization||''};
  const who=await get('/api/me',auth);
  if(!who||!who.me)return json(res,401,{error:'Please log in again.'});
  const id=String(b.id||'');
  if(!/^[\w-]{1,40}$/.test(id))return json(res,400,{error:'Unknown item.'});
  const cat=await get('/api/hats',{});
  const item=cat?[...(cat.hats||[]),...(cat.mine||[])].find(h=>h&&h.id===id):null;
  if(!item)return json(res,404,{error:'That item is not in the catalog.'});
  const mine=(item.creator||'').toLowerCase()===(who.me.name||'').toLowerCase();
  if(!mine&&!who.me.admin)return json(res,403,{error:'Only the creator can describe this item.'});
  const text=String(b.text==null?'':b.text).replace(/\r/g,'').trim().slice(0,MAXLEN);
  const map=await readAll();
  if(text)map[id]=text;else delete map[id];
  await writeAll(map);
  return json(res,200,{ok:1,descs:map});
 }catch(e){console.error('descs:',e.message);return json(res,500,{error:'Could not save that description.'})}
};
