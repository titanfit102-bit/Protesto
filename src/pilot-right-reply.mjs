// Minimal citizen reply interface; user-supplied content always goes via textContent.
const node=(tag,txt)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;return x;};
export function attachCitizenResponse(article,item,{user,call,notice,refresh}){
 const details=node("details"),summary=node("summary","Përgjigjet qytetare (jo të verifikuara institucionalisht)");details.append(summary);
 const box=node("div");details.append(box);let initialized=false;
 details.addEventListener("toggle",async()=>{
  if(!details.open||initialized)return;initialized=true;
  try{
   const rows=await call("/api/dossiers/"+encodeURIComponent(item.id)+"/responses");
   for(const r of rows.items){const p=node("p",r.body);box.append(p);}
   if(!rows.items.length)box.append(node("p","Nuk ka përgjigje të miratuara."));
   if(user&&user.id!==item.author_id){
    const form=node("form"),label=node("label","Dërgo përgjigje për shqyrtim (40–1800 karaktere)");
    const input=node("textarea");input.minLength=40;input.maxLength=1800;input.required=true;label.append(input);
    const submit=node("button","Dërgo privatisht");submit.type="submit";form.append(label,submit);
    form.addEventListener("submit",async event=>{
     event.preventDefault();submit.disabled=true;
     try{await call("/api/dossiers/"+encodeURIComponent(item.id)+"/responses","POST",{body:input.value});notice("Përgjigjja u dërgua privatisht.");await refresh();}
     catch(error){notice(error.message,true);}finally{submit.disabled=false;}
    });
    box.append(form);
   }
  }catch(error){box.append(node("p","Përgjigjet nuk u ngarkuan."));}
 });
 article.append(details);
}
export function displayCitizenResponseQueue(target,items,{call,notice,refresh,user}){
 target.replaceChildren();
 for(const item of items){
  const el=node("article");el.className="pilot-card";
  el.append(node("h3",item.title),node("p",item.body));
  if([item.author_id,item.case_author_id].includes(user?.id)){el.append(node("p","Konflikt interesi."));target.append(el);continue;}
  const input=node("textarea");input.value=item.body;input.setAttribute("aria-label","Kopja publike e përgjigjes");
  const note=node("textarea");note.setAttribute("aria-label","Arsyetimi editorial");
  const approved=node("input");approved.type="checkbox";
  const label=node("label"," Konfirmoj kontrollin e privatësisë së kopjes publike");label.prepend(approved);
  for(const decision of ["accepted","rejected"]){
   const b=node("button",decision==="accepted"?"Prano përgjigjen":"Refuzo përgjigjen");b.type="button";
   b.addEventListener("click",async()=>{
    b.disabled=true;
    try{await call("/api/editorial/responses/"+encodeURIComponent(item.id)+"/review","POST",{
     decision,note:note.value,publicBody:input.value,privacyReviewed:approved.checked
    });notice("Vendimi editorial u regjistrua.");await refresh();}
    catch(error){notice(error.message,true);}finally{b.disabled=false;}
   });el.append(b);
  }
  el.prepend(input,note,label);target.append(el);
 }
}
