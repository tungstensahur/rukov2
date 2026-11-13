// News posts from the official Ruko account.
// Posts live in the shared meta store, so they persist exactly like the rest of the data.
module.exports=async function(ctx){
 const {p,req,res,b,me,send,need,D,save,rnd}=ctx;
 if(p!=='/api/posts')return false;
 D.meta=D.meta||{};
 const all=()=>Object.keys(D.meta).filter(k=>k.indexOf('news:')===0).map(k=>Object.assign({id:k.slice(5)},D.meta[k])).sort((a,b)=>(b.at||0)-(a.at||0));
 if(req.method==='GET'){send(res,200,{posts:all().slice(0,30)});return true}
 if(!me){need();return true}
 if(!me.admin){send(res,403,{error:'Only the official Ruko account can post news.'});return true}
 const del=b&&b.delete;
 if(del){const k='news:'+String(del);if(!D.meta[k]){send(res,404,{error:'That post no longer exists.'});return true}delete D.meta[k];save();send(res,200,{ok:1,posts:all()});return true}
 const title=String((b&&b.title)||'').replace(/\s+/g,' ').trim().slice(0,90);
 const text=String((b&&b.text)||'').replace(/\r/g,'').trim().slice(0,1500);
 if(!title){send(res,400,{error:'Give the post a title.'});return true}
 if(!text){send(res,400,{error:'Write something in the post.'});return true}
 if(all().length>=40){send(res,400,{error:'That is 40 posts. Delete an older one first.'});return true}
 const id='p'+rnd(4),post={title,text,at:Date.now(),by:me.name};
 D.meta['news:'+id]=post;save();
 send(res,200,{ok:1,post:Object.assign({id},post),posts:all()});return true;
};
