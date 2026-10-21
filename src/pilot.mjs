import {attachEvidence,attachCorrection,displayCorrections} from "./pilot-evidence.mjs";
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
 attachEvidence(article,item,{user,review,call,notice,refresh});
 attachCorrection(article,item,{user,call,notice,refresh});
 if(!review&&!item.state&&user&&(user.role==="reviewer"||user.role==="admin")){
  const div=document.createElement("div");div.className="pilot-review-actions";
  const button=document.createElement("button");button.type="button";button.className="btn subtle";button.textContent="Tërhiq publikimin";
  button.addEventListener("click",async()=>{
   const note=window.prompt("Arsyetimi i tërheqjes (min. 20 karaktere):","");
   if(note===null)return;
   button.disabled=true;
   try{await call("/api/archive/"+encodeURIComponent(item.id),"POST",{note});notice("Publikimi u tërhoq dhe u regjistrua.");await refresh();}
   catch(e){notice(e.message,true);}finally{button.disabled=false;}
  });
  div.appendChild(button);article.appendChild(div);
 }
 if(review){
  const field=document.createElement("textarea");field.className="review-note";field.rows=3;field.maxLength=1000;field.placeholder="Arsyetim konkret për vendimin (minimumi 15 karaktere)...";field.setAttribute("aria-label","Arsyetimi i verifikimit");
  const checklist=document.createElement("fieldset");checklist.className="pilot-checklist";
  const legend=document.createElement("legend");legend.textContent="Kontrollet për publikim";checklist.append(legend);
  const checks={};
  for(const [key,label] of [["sourceReviewed","Kam kontrolluar provat"],["privacyReviewed","Kam kontrolluar privatësinë"],["replyConsidered","Kam marrë parasysh të drejtën e përgjigjes"]]){
   const wrapper=document.createElement("label");const input=document.createElement("input");input.type="checkbox";wrapper.append(input,document.createTextNode(" "+label));checks[key]=input;checklist.append(wrapper);
  }
  const actions=document.createElement("div");actions.className="pilot-review-actions";
  for(const [decision,label] of [["published","Publiko pas verifikimit"],["rejected","Refuzo"]]){
   const btn=document.createElement("button");btn.className="btn "+(decision==="published"?"primary":"subtle");btn.textContent=label;btn.type="button";
   if(item.author_id===user.id){btn.disabled=true;btn.title="Nuk mund të shqyrtosh dosjen tënde.";}
   btn.addEventListener("click",async()=>{
    if(field.value.trim().length<15){notice("Shkruaj arsyetim prej të paktën 15 karakteresh.",true);return;}
    btn.disabled=true;
    try{await call("/api/review/"+encodeURIComponent(item.id),"POST",{decision,note:field.value,checks:{sourceReviewed:checks.sourceReviewed.checked,privacyReviewed:checks.privacyReviewed.checked,replyConsidered:checks.replyConsidered.checked}});notice("Vendimi u regjistrua.");await refresh();}
    catch(e){notice(e.message,true);}finally{btn.disabled=false;}
   });
   actions.appendChild(btn);
  }
  article.append(field,checklist,actions);
 }
 return article;
}
function actionCard(item,review=false){
 const div=document.createElement("article");div.className="pilot-card";
 const kind=item.kind==="gathering"?"Tubim paqësor":item.subtype||"Nismë";
 const date=item.event_date?'<span>'+escapeHTML(String(item.event_date).slice(0,10))+'</span>':"";
 div.innerHTML='<div class="pilot-meta"><span>'+escapeHTML(kind)+'</span><span>'+escapeHTML(item.area)+'</span>'+date+'</div><h3>'+escapeHTML(item.title)+'</h3><p>'+escapeHTML(item.description)+'</p>';
 if(review){
  const note=document.createElement("textarea");note.rows=3;note.className="review-note";note.maxLength=1000;note.placeholder="Arsyetimi i verifikimit (të paktën 15 karaktere)";note.setAttribute("aria-label","Arsyetimi");
  const buttons=document.createElement("div");buttons.className="pilot-review-actions";
  for(const [decision,label] of [["published","Publiko pas kontrollit"],["rejected","Refuzo"]]){
   const btn=document.createElement("button");btn.type="button";btn.className="btn "+(decision==="published"?"primary":"subtle");btn.textContent=label;
   if(item.author_id===user.id)btn.disabled=true;
   btn.addEventListener("click",async()=>{btn.disabled=true;try{await call("/api/actions/review/"+encodeURIComponent(item.id),"POST",{decision,note:note.value});notice("Vendimi u regjistrua.");await refresh();}catch(e){notice(e.message,true);}finally{btn.disabled=false;}});
   buttons.appendChild(btn);
  }
  div.append(note,buttons);
 }else if(!item.state&&user&&(user.role==="reviewer"||user.role==="admin")){
  const btn=document.createElement("button");btn.type="button";btn.className="btn subtle";btn.textContent="Tërhiq publikimin";
  btn.addEventListener("click",async()=>{
   const note=window.prompt("Arsyetimi i tërheqjes (20+ karaktere):","");
   if(note===null)return;
   btn.disabled=true;try{await call("/api/actions/archive/"+encodeURIComponent(item.id),"POST",{note});notice("Publikimi u tërhoq.");await refresh();}catch(e){notice(e.message,true);}finally{btn.disabled=false;}
  });
  div.appendChild(btn);
 }
 return div;
}
function fillActions(target,items,review=false){
 target.replaceChildren();
 if(!items.length){const empty=document.createElement("div");empty.className="pilot-empty";empty.textContent="Nuk ka regjistrime.";target.appendChild(empty);return;}
 items.forEach(item=>target.appendChild(actionCard(item,review)));
}
function fill(target,items,review=false){
 target.replaceChildren();
 if(!items.length){const empty=document.createElement("div");empty.className="pilot-empty";empty.textContent="Nuk ka dosje për të shfaqur.";target.appendChild(empty);return;}
 items.forEach(item=>target.appendChild(record(item,review)));
}
async function refresh(){
 const publicActions=await call("/api/actions/public");fillActions($("public-actions"),publicActions.items);
 const publicRows=await call("/api/public/cases");
 fill($("public-cases"),publicRows.items);
 if(!user)return;
 const myCorrections=await call("/api/corrections/mine");displayCorrections($("my-corrections"),myCorrections.items,{review:false,call,notice,refresh,user});
 const myActions=await call("/api/actions/mine");fillActions($("my-actions"),myActions.items);
 const myRows=await call("/api/cases/mine");
 fill($("my-cases"),myRows.items);
 if(user.role==="reviewer"||user.role==="admin"){
  const corrections=await call("/api/corrections/queue");displayCorrections($("review-corrections"),corrections.items,{review:true,call,notice,refresh,user});
  const actionQueue=await call("/api/actions/review/queue");fillActions($("review-actions"),actionQueue.items,true);
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
for(const [formId,kind] of [["initiative-form","initiative"],["gathering-form","gathering"]]){
 $(formId).addEventListener("submit",async event=>{
  event.preventDefault();const form=event.currentTarget;
  try{await call("/api/actions","POST",{...Object.fromEntries(new FormData(form)),kind});form.reset();notice("Nisma ose tubimi u dërgua për verifikim.");await refresh();}
  catch(e){notice(e.message,true);}
 });
}
$("logout").addEventListener("click",async()=>{
 try{await call("/api/auth/logout","POST",{});user=null;notice("Dole nga llogaria.");await load();}
 catch(e){notice(e.message,true);}
});
load();