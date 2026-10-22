// UI helpers for source provenance and corrective review; does not make external network requests.
const node=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;};
const field=(label,name,required=true,kind="input")=>{
 const wrap=node("label","pilot-evidence-label"),caption=node("span","",label);
 const input=node(kind==="textarea"?"textarea":"input","review-note");
 input.name=name;input.required=required;
 if(kind==="url")input.type="url";
 if(kind==="textarea")input.rows=3;
 wrap.append(caption,input);return wrap;
};
function button(label,handler){
 const b=node("button","btn subtle",label);b.type="button";
 b.addEventListener("click",async()=>{b.disabled=true;try{await handler();}finally{b.disabled=false;}});
 return b;
}
export function attachEvidence(article,item,{user,review,call,notice,refresh}){
 const details=node("details","pilot-evidence");
 const summary=node("summary","","Burimet dhe verifikimi");
 details.append(summary);
 let first=true;
 async function reload(){
  const container=node("div","pilot-evidence-body");
  details.querySelector(".pilot-evidence-body")?.remove();
  details.append(container);
  try{
   const result=await call("/api/dossiers/"+encodeURIComponent(item.id)+"/sources");
   const list=node("div","pilot-records");
   for(const source of result.items){
    const entry=node("div","pilot-source");
    const title=node("strong","",source.title);
    const url=node("a","pilot-evidence-link","Hap burimin ↗");url.href=source.url;url.target="_blank";url.rel="noopener noreferrer";
    const status=node("small","",source.state==="accepted"?"Burim i shqyrtuar (jo provë e autenticitetit)":source.state==="rejected"?"Burim i refuzuar":"Në pritje të verifikimit");
    entry.append(title,url);
    // Source context is private: the public API omits it and the UI does not render empty copies.
    if(typeof source.context==="string"&&source.context)entry.append(node("p","",source.context));
    entry.append(status);
    if(review&&source.state==="pending"&&item.author_id!==user?.id){
     const note=field("Shpjego verifikimin (20–900 karaktere)","note",true,"textarea");
     note.querySelector("textarea").maxLength=900;
     const attestation=node("fieldset","pilot-checklist");
     attestation.append(node("legend","","Kontrolle të detyrueshme vetëm për pranimin"));
     const checks={};
     for(const [key,label] of [
      ["sourceOpened","E hapa dhe e shqyrtova burimin"],
      ["privacyReviewed","Kontrollova privatësinë dhe të dhënat personale"],
      ["publicMetadataReviewed","Kontrollova titullin, URL-në dhe tekstet që do të shfaqen publikisht"]
     ]){
      const wrapper=node("label"),input=node("input");input.type="checkbox";
      wrapper.append(input,document.createTextNode(" "+label));attestation.append(wrapper);checks[key]=input;
     }
     const controls=node("div","pilot-review-actions");
     for(const [decision,label] of [["accepted","Prano burimin"],["rejected","Refuzo burimin"]]){
      controls.append(button(label,async()=>{
       try{await call("/api/dossiers/"+encodeURIComponent(item.id)+"/sources/"+encodeURIComponent(source.id)+"/review","POST",{decision,note:note.querySelector("textarea").value,checks:{
        sourceOpened:checks.sourceOpened.checked,
        privacyReviewed:checks.privacyReviewed.checked,
        publicMetadataReviewed:checks.publicMetadataReviewed.checked
       }});notice("Vendimi u regjistrua; shqyrtimi nuk provon autenticitetin e burimit.");await reload();}
       catch(e){notice(e.message,true);}
      }));
     }
     entry.append(note,attestation,controls);
    }
    if(review&&source.state==="accepted"&&item.author_id!==user?.id){
     const fp=node("section","pilot-fingerprint");
     const fpPath="/api/dossiers/"+encodeURIComponent(item.id)+"/sources/"+encodeURIComponent(source.id)+"/fingerprint";
     const previous=await call(fpPath);
     fp.append(node("h4","","Gjurmë integriteti e dokumentit (PDF)"));
     if(previous.item){
      fp.append(node("p","","SHA-256 (deklaruar): "+previous.item.sha256));
      fp.append(node("small","","Nuk certifikon origjinën. Skedari nuk ruhet në Protesto."));
     }else{
      const input=node("input");input.type="file";input.accept=".pdf,application/pdf";
      input.setAttribute("aria-label","Zgjidh dokumentin PDF vetëm për llogaritje lokale të SHA-256");
      const intro=node("p","","Zgjidh PDF deri 8 MiB: përmbajtja nuk ngarkohet në server. Vetëm SHA-256 dhe madhësia ruhen privatisht.");
      const declarations=node("fieldset","pilot-checklist");
      declarations.append(node("legend","","Konfirmime editoriale për gjurmën"));
      const matching=node("input"),privacy=node("input");
      matching.type="checkbox";privacy.type="checkbox";
      const one=node("label"),two=node("label");
      one.append(matching,document.createTextNode(" E krahasova këtë PDF me burimin e shqyrtuar"));
      two.append(privacy,document.createTextNode(" Kontrollova privatësinë; skedari nuk do të publikohet nga kjo veprimtari"));
      declarations.append(one,two);
      const save=button("Regjistro SHA-256",async()=>{
       try{
        const file=input.files?.[0];
        if(!file||file.size<5||file.size>8*1024*1024)throw Error("Zgjidh PDF me madhësi 5 bajte deri 8 MiB.");
        if(!matching.checked||!privacy.checked)throw Error("Konfirmo dy kontrollet editoriale.");
        if(!globalThis.crypto?.subtle)throw Error("Kërkohet mjedis i sigurt (HTTPS ose localhost) për SHA-256.");
        const bytes=await file.arrayBuffer();
        const magic=String.fromCharCode(...new Uint8Array(bytes.slice(0,5)));
        if(magic!=="%PDF-")throw Error("Skedari nuk ka firmën bazë të një PDF-je.");
        const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
        const sha256=[...digest].map(x=>x.toString(16).padStart(2,"0")).join("");
        await call(fpPath,"POST",{
         sha256,byteLength:bytes.byteLength,mediaType:"application/pdf",
         acknowledgedCorrespondence:true,acknowledgedPrivacy:true
        });
        input.value="";
        notice("SHA-256 u regjistrua privatisht. Origjina e PDF-së nuk është certifikuar.");
        await reload();
       }catch(error){notice(error.message,true);}
      });
      fp.append(intro,input,declarations,save);
     }
     entry.append(fp);
    }
    list.append(entry);
   }
   if(!result.items.length)list.append(node("p","pilot-empty","Nuk ka burime ende. Publikimi kërkon të paktën një burim të kontrolluar."));
   container.append(list);
   if(!review&&item.state==="pending"&&user){
    const form=node("form","pilot-evidence-form");
    form.append(field("Titulli i dokumentit","title"),field("URL HTTPS","url",true,"url"),field("Përshkrim i lidhjes me dosjen","context",true,"textarea"));
    const submit=node("button","btn secondary","Shto burimin");submit.type="submit";form.append(submit);
    form.addEventListener("submit",async event=>{
     event.preventDefault();submit.disabled=true;
     try{
      await call("/api/dossiers/"+encodeURIComponent(item.id)+"/sources","POST",Object.fromEntries(new FormData(form)));
      notice("Burimi u shtua për verifikim.");await reload();
     }catch(e){notice(e.message,true);}finally{submit.disabled=false;}
    });
    container.append(form);
   }
  }catch(e){container.append(node("p","pilot-empty","Burimet nuk mund të ngarkohen: "+e.message));}
 }
 details.addEventListener("toggle",()=>{if(details.open&&first){first=false;reload();}});
 article.append(details);
}
export function attachCorrection(article,item,{user,call,notice,refresh}){
 if(!user||item.state)return;
 const details=node("details","pilot-evidence");details.append(node("summary","","Kërko korrigjim ose verifikim të ri"));
 const form=node("form","pilot-evidence-form");
 form.append(field("Pse mendon se dosja duhet korrigjuar? (30+ karaktere)","reason",true,"textarea"),field("Burim kundërshtues HTTPS (opsional)","source",false,"url"));
 const btn=node("button","btn subtle","Dërgo kërkesën");btn.type="submit";form.append(btn);
 form.addEventListener("submit",async event=>{
  event.preventDefault();btn.disabled=true;
  try{
   await call("/api/corrections","POST",{...Object.fromEntries(new FormData(form)),caseId:item.id});
   form.reset();details.open=false;notice("Kërkesa u ruajt për verifikim. Dosja nuk ndryshohet automatikisht.");await refresh();
  }catch(e){notice(e.message,true);}finally{btn.disabled=false;}
 });
 details.append(form);article.append(details);
}
export function displayCorrections(target,items,{review,call,notice,refresh,user}){
 target.replaceChildren();
 if(!items.length){target.append(node("p","pilot-empty","Nuk ka kërkesa korrigjimi."));return;}
 for(const item of items){
  const article=node("article","pilot-card");
  article.append(node("h3","",review?item.title:"Kërkesë për dosjen "+item.case_id),node("p","",item.reason));
  article.append(node("small","",item.state??"Në pritje"));
  if(item.counter_source_url){
   const link=node("a","pilot-evidence-link","Shiko burimin kundërshtues ↗");
   link.href=item.counter_source_url;link.target="_blank";link.rel="noopener noreferrer";article.append(link);
  }
  if(!review&&item.state==="rejected"){
   const details=node("details","pilot-evidence");details.append(node("summary","","Apelo vendimin e refuzimit"));
   const form=node("form","pilot-evidence-form");
   form.append(field("Pse kërkon shqyrtim të dytë? (30+ karaktere)","reason",true,"textarea"));
   const send=node("button","btn subtle","Dërgo apelimin");send.type="submit";form.append(send);
   form.addEventListener("submit",async event=>{
    event.preventDefault();send.disabled=true;
    try{await call("/api/appeals","POST",{correctionId:item.id,...Object.fromEntries(new FormData(form))});notice("Apelimi u dërgua për shqyrtim të pavarur.");await refresh();}
    catch(e){notice(e.message,true);}finally{send.disabled=false;}
   });
   details.append(form);article.append(details);
  }
  if(review&&item.author_id!==user?.id){
   const note=field("Arsyetimi i vendimit (20+ karaktere)","note",true,"textarea");
   article.append(note);
   const buttons=node("div","pilot-review-actions");
   for(const [decision,label] of [["accepted","Prano dhe tërhiq dosjen"],["rejected","Refuzo korrigjimin"]]){
    buttons.append(button(label,async()=>{
     try{
      await call("/api/corrections/review/"+encodeURIComponent(item.id),"POST",{decision,note:note.querySelector("textarea").value});
      notice("Kërkesa e korrigjimit u shqyrtua.");await refresh();
     }catch(e){notice(e.message,true);}
    }));
   }
   article.append(buttons);
  }
  target.append(article);
 }
}

export function displayAppeals(target,items,{review,call,notice,refresh,user}){
 target.replaceChildren();
 if(!items.length){target.append(node("p","pilot-empty","Nuk ka apelime për të shfaqur."));return;}
 for(const item of items){
  const article=node("article","pilot-card");
  article.append(node("h3","",review?item.title:"Apelimi për korrigjimin "+item.correction_id));
  article.append(node("p","",item.reason),node("small","",item.state||"Në pritje"));
  if(review){
   const conflict=[item.author_id,item.original_reviewer_id,item.case_author_id].includes(user?.id);
   if(conflict){
    article.append(node("p","pilot-empty","Konflikt shqyrtimi: kërkohet një verifikues tjetër, i pavarur."));target.append(article);continue;
   }
   const note=field("Arsyetimi i shqyrtimit të dytë (25+ karaktere)","note",true,"textarea");
   const buttons=node("div","pilot-review-actions");
   for(const [decision,label] of [["accepted","Prano dhe tërhiq dosjen"],["rejected","Lë në fuqi vendimin"]]){
    buttons.append(button(label,async()=>{
     try{await call("/api/appeals/review/"+encodeURIComponent(item.id),"POST",{decision,note:note.querySelector("textarea").value});
      notice("Vendimi i apelimit u regjistrua në audit.");await refresh();
     }catch(e){notice(e.message,true);}
    }));
   }
   article.append(note,buttons);
  }
  target.append(article);
 }
}
