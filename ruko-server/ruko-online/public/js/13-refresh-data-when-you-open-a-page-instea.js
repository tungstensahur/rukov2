/* ---------- v13: refresh data when you open a page instead of on a timer ---------- */
let NAVN=0;
async function refreshRoute(){const a=location.hash.slice(2).split('/')[0],jobs=[];
 jobs.push(api('/api/me').then(r=>{if(r&&r.me){const pv=ME;ME=r.me;if(pv){const d=((r.me.ernSales||0)-(pv.ernSales||0))+((r.me.ernVisits||0)-(pv.ernVisits||0));if(d>0)toast('💰 You earned 🪙 '+d+' from your creations!',true)}}}));
 if(['','catalog','hat','create','servers','user','avatar'].includes(a))jobs.push(loadAll());
 if(a==''||a=='servers')jobs.push(api('/api/servers').then(s=>{if(s&&s.players){PL=s.players.map(p=>({...p,at:Date.now()}));LIVE={};s.players.forEach(p=>{const id=p.server.replace(/x\d+$/,'');LIVE[id]=(LIVE[id]||0)+1})}}));
 await Promise.all(jobs)}
async function navigate(){const n=++NAVN;if(ME)await refreshRoute();if(n!==NAVN)return;render()}
app.addEventListener('click',e=>{if(e.target.id=='rf'){e.target.textContent='↻ …';navigate()}});
