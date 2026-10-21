const $=id=>document.getElementById(id);
let user=null;
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function call(path,method="GET",payload){
 const options={method,credentials:"same-origin",cache:"no-store",headers:{}};
 if(method==="POST"){options.headers={"Content-Type":"application/json","X-Protesto-Request":"1"};options.body=JSON.stringify(payload||{});}
 const response=await fetch(path,options);
 let body;try{body=await response.json();}catch{body={error:"Përgjigje e pavlefshme nga serveri."};}
 if(!response.ok)throw Error(body.error||"Kërkesa dështoi ("+response.status+").");
 return body;
}
function notice(message,error=false){const n=$("pilot-notice");n.hidden=false;n.textContent=message;n.classList.toggle("error",error);}
function record(item,review=false){
 const article=document.createElement("article");article.className="pilot-card";
 const state=item.state||"publikuar";
 const source=item.source_url&&/^https:\/\//.test(item.source_url)?'<a href="'+escapeHTML(item.source_url)+'" target="_blank" rel="noopener noreferrer">Shiko burimin ↗</a>':"";
 article.innerHTML='<div class="pilot-meta"><span>'+escapeHTML(item.category)+'</span><span>'+escapeHTML(state)+'</span><span>'+escapeHTML(item.area)+'</span></div><h3>'+escapeHTML(item.title)+'</h3><p>'+escapeHTML(item.description)+'</p>'+source;
 if(review){
  const field=document.createElement("textarea");field.className="review-note";field.rows=3;field.maxLength=1000;field.placeholder="Arsyetim konkret për vendimin (minimumi 15 karaktere)...";field.setAttribute("aria-label","Arsyetimi i verifikimit");
  const actions=document.createElement("div");actions.className="pilot-review-actions";
  for(const [decision,label] of [["published","Publiko pas verifikimit"],["rejected","Refuzo"]]){
   const btn=document.createElement("button");btn.className="btn "+(decision==="published"?"primary":"subtle");btn.textContent=label;btn.type="button";
   if(item.author_id===user.id){btn.disabled=true;btn.title="Nuk mund të shqyrtosh dosjen tënde.";}
   btn.addEventListener("click",async()=>{
    if(field.value.trim().length<15){notice("Shkruaj arsyetim prej të paktën 15 karakteresh.",true);return;}
    btn.disabled=true;
    try{await call("/api/review/"+encodeURIComponent(item.id),"POST",{decision,note:field.value});notice("Vendimi u regjistrua.");await refresh();}
    catch(e){notice(e.message,true);}finally{btn.disabled=false;}
   });
   actions.appendChild(btn);
  }
  article.append(field,actions);
 }
 return article;
}
function fill(target,items,review=false){
 target.replaceChildren();
 if(!items.length){const empty=document.createElement("div");empty.className="pilot-empty";empty.textContent="Nuk ka dosje për të shfaqur.";target.appendChild(empty);return;}
 items.forEach(item=>target.appendChild(record(item,review)));
}
async function refresh(){
 const publicRows=await call("/api/public/cases");
 fill($("public-cases"),publicRows.items);
 if(!user)return;
 const myRows=await call("/api/cases/mine");
 fill($("my-cases"),myRows.items);
 if(user.role==="reviewer"||user.role==="admin"){
  const queue=await call("/api/review/queue");
  fill($("review-cases"),queue.items,true);
 }
}
async function load(){
 try{const result=await call("/api/me");user=result.user;}
 catch{user=null;}
 $("auth-section").hidden=!!user;
 $("authenticated").hidden=!user;
 $("logout").hidden=!user;
 $("account-label").textContent=user?user.email+" ("+user.role+")":"";
 $("review-section").hidden=!(user&&(user.role==="reviewer"||user.role==="admin"));
 try{await refresh();}catch(e){notice(e.message,true);}
}
$("login-form").addEventListener("submit",async event=>{
 event.preventDefault();const form=event.currentTarget;
 try{const data=Object.fromEntries(new FormData(form));const result=await call("/api/auth/login","POST",data);user=result.user;form.reset();notice("Identifikimi u krye.");await load();}
 catch(e){notice(e.message,true);}
});
$("case-form").addEventListener("submit",async event=>{
 event.preventDefault();const form=event.currentTarget;
 try{const data=Object.fromEntries(new FormData(form));await call("/api/cases","POST",data);form.reset();notice("Raportimi u dërgua për verifikim, jo për publikim.");await refresh();}
 catch(e){notice(e.message,true);}
});
$("logout").addEventListener("click",async()=>{
 try{await call("/api/auth/logout","POST",{});user=null;notice("Dole nga llogaria.");await load();}
 catch(e){notice(e.message,true);}
});
load();