// Original Protesto Albanian deliberation UI. Public views never expose voter identity.
const $=id=>document.getElementById(id);
const make=(tag,className,content)=>{
 const el=document.createElement(tag);if(className)el.className=className;
 if(content!==undefined)el.textContent=content;
 return el;
};
let selectedTopic="";
let publicAggregateReport=null;
let context;
function listOption(value,title){const opt=make("option","",title);opt.value=value;return opt;}
async function openTopic(id){
 const target=$("dialogue-details");target.replaceChildren();
 if(!id){target.append(make("p","pilot-empty","Nuk ka diskutime të hapura ende."));return;}
 try{
  const data=await context.call("/api/dialogue/topics/"+encodeURIComponent(id));
  const topic=data.item;
  const h=make("h3","",topic.title),p=make("p","",topic.description);
  const status=make("p","pilot-dialogue-disclaimer",topic.state==="closed"?
   "Tema është mbyllur. Përgjigjet individuale janë fshirë; shfaqen vetëm totalet e kualifikuara.":
   "Tema është e hapur. Rezultatet nuk shfaqen gjatë votimit për të mbrojtur privatësinë.");
  target.append(h,p,status);
  const canParticipate=!!context.user&&topic.state==="open";
  $("dialogue-statement-form").hidden=!canParticipate;
  $("dialogue-vote-consent").hidden=!canParticipate;
  $("dialogue-close-form").hidden=!(context.user&&["reviewer","admin"].includes(context.user.role)&&topic.state==="open");
  const records=make("div","pilot-records");
  if(!data.statements.length)records.append(make("p","pilot-empty","Nuk ka deklarata të verifikuara për momentin."));
  for(const statement of data.statements){
   const item=make("article","pilot-card pilot-dialogue-statement");
   item.append(make("p","pilot-dialogue-statement-text",statement.body));
   if(statement.participants===null){
    item.append(make("small","pilot-muted","Numrat e votave fshihen deri në mbyllje dhe pragun e privatësisë (10 pjesëmarrës)."));
   }else{
    item.append(make("small","pilot-muted","Përgjigje jo përfaqësuese: "+statement.participants));
    const stats=make("div","pilot-dialogue-stats");
    for(const [name,key] of [["Pajtohem","agree_count"],["Kundërshtoj","disagree_count"],["E kaloj","pass_count"]]){
     stats.append(make("span","",name+": "+statement[key]));
    }
    item.append(stats);
   }
   if(canParticipate){
    const buttons=make("div","pilot-review-actions");
    for(const [choice,label] of [["agree","Pajtohem"],["disagree","Kundërshtoj"],["pass","E kaloj"]]){
     const btn=make("button","btn subtle",label);btn.type="button";
     btn.addEventListener("click",async()=>{
      if(!$("dialogue-consent").checked){context.notice("Lexo dhe konfirmo njoftimin e privatësisë përpara përgjigjes.",true);return;}
      btn.disabled=true;
      try{
       await context.call("/api/dialogue/statements/"+encodeURIComponent(statement.id)+"/vote","POST",{choice,acknowledge:true});
       context.notice("Përgjigjja u ruajt. Mund ta ndryshosh deri në mbylljen e temës.");
      }catch(e){context.notice(e.message,true);}finally{btn.disabled=false;}
     });
     buttons.append(btn);
    }
    item.append(buttons);
   }
   records.append(item);
  }
  target.append(records);
 }catch(e){target.append(make("p","pilot-empty",e.message));}
}
async function loadAggregateReport(){
 const target=$("dialogue-report");
 target.replaceChildren();
 const report=await context.call("/api/dialogue/report");
 publicAggregateReport=report;
 if(!report.items.length){
  target.append(make("p","pilot-empty","Nuk ka ende rezultate të kualifikuara. Diskutimet mbyllen përpara publikimit të totalit."));
  return;
 }
 for(const item of report.items){
  const card=make("article","pilot-card");
  card.append(make("h3","",item.topic_title),make("p","",item.statement));
  card.append(make("p","pilot-dialogue-disclaimer",
   "Vetëm pjesëmarrësit e kësaj teme: "+item.participants+
   " përgjigje, "+item.agree_count+" pajtohen ("+item.agree_percent+
   "%), "+item.disagree_count+" kundërshtojnë ("+item.disagree_percent+"%), "+item.pass_count+" e kaluan ("+item.pass_percent+"%)."));
  const buttons=make("div","pilot-review-actions");
  const show=make("button","btn subtle","Shiko diskutimin");show.type="button";
  show.addEventListener("click",async()=>{
   selectedTopic=item.topic_id;$("dialogue-topic-select").value=selectedTopic;
   await openTopic(selectedTopic);
   $("dialogue-section").scrollIntoView({behavior:"smooth",block:"start"});
  });
  buttons.append(show);
  if(item.source_url&&/^https:\/\//.test(item.source_url)){
   const link=make("a","pilot-evidence-link","Burimi i verifikuar i dosjes ↗");
   link.href=item.source_url;link.target="_blank";link.rel="noopener noreferrer";
   buttons.append(link);
  }
  card.append(buttons);target.append(card);
 }
}
export async function renderDialogue({user,call,notice,refresh,cases}){
 context={user,call,notice,refresh};
 const result=await call("/api/dialogue/topics"),topics=result.items;
 await loadAggregateReport();
 const select=$("dialogue-topic-select");select.replaceChildren(listOption("","Zgjidh një diskutim..."));
 for(const item of topics)select.append(listOption(item.id,item.title+" — "+(item.state==="closed"?"mbyllur":"hapur")));
 if(!topics.some(x=>x.id===selectedTopic))selectedTopic=topics[0]?.id||"";
 select.value=selectedTopic;
 const reviews=$("review-dialogue-topics");
 if(user&&["reviewer","admin"].includes(user.role)){
  const queue=await call("/api/dialogue/topic-review/queue");
  reviews.replaceChildren();
  if(!queue.items.length)reviews.append(make("p","pilot-empty","Nuk ka tema në pritje të miratimit."));
  for(const item of queue.items){
   const card=make("article","pilot-card dialogue-topic-review");
   card.append(make("h3","",item.title),make("p","",item.description));
   const noteLabel=make("label","","Arsyetimi editorial");
   const note=make("textarea","dialogue-topic-note");
   note.rows=2;note.minLength=20;note.maxLength=1000;noteLabel.append(note);
   const titleLabel=make("label","","Titulli për publikim");
   const title=make("input","dialogue-topic-title");title.value=item.public_title||"";title.maxLength=140;titleLabel.append(title);
   const descriptionLabel=make("label","","Konteksti për publikim");
   const description=make("textarea","dialogue-topic-description");
   description.value=item.public_description||"";description.rows=3;description.maxLength=1200;
   descriptionLabel.append(description);card.append(noteLabel,titleLabel,descriptionLabel);
   if([item.created_by,item.case_author_id].includes(user.id)){
    card.append(make("p","pilot-muted","Nuk mund të miratosh temën tënde ose dosjen tënde."));
   }else{
    const copyLabel=make("label","",""),privacyLabel=make("label","","");
    const copyCheck=make("input",""),privacyCheck=make("input","");
    copyCheck.type="checkbox";privacyCheck.type="checkbox";
    copyLabel.append(copyCheck,document.createTextNode(" Kontrollova tekstin publik të redaktuar."));
    privacyLabel.append(privacyCheck,document.createTextNode(" Kontrollova privatësinë e përmbajtjes."));
    card.append(copyLabel,privacyLabel);
    const buttons=make("div","pilot-review-actions");
    for(const [decision,text] of [["approved","Mirato temën"],["rejected","Refuzo temën"]]){
     const button=make("button","btn subtle",text);button.type="button";
     button.addEventListener("click",async()=>{
      button.disabled=true;
      try{
       await call("/api/dialogue/topics/"+encodeURIComponent(item.id)+"/review","POST",{
        decision,note:note.value,public:{title:title.value,description:description.value},
        checks:{publicCopyReviewed:copyCheck.checked,privacyReviewed:privacyCheck.checked}
       });
       notice("Vendimi për temën u regjistrua.");await refresh();
      }catch(error){notice(error.message,true);}finally{button.disabled=false;}
     });buttons.append(button);
    }
    card.append(buttons);
   }
   reviews.append(card);
  }
 }else reviews.replaceChildren();
 const topicForm=$("dialogue-create-section");
 topicForm.hidden=!(user&&["reviewer","admin"].includes(user.role));
 const published=$("dialogue-case-select");published.replaceChildren(listOption("","Zgjidh dosjen e verifikuar..."));
 for(const item of cases)published.append(listOption(item.id,item.title));
 if(!user){$("dialogue-statement-form").hidden=true;$("dialogue-vote-consent").hidden=true;$("dialogue-close-form").hidden=true;}
 await openTopic(selectedTopic);
 if(user&&["reviewer","admin"].includes(user.role)){
  const q=await call("/api/dialogue/review/queue");
  const target=$("review-dialogue-statements");target.replaceChildren();
  if(!q.items.length)target.append(make("p","pilot-empty","Nuk ka deklarata për shqyrtim."));
  for(const stmt of q.items){
   const card=make("article","pilot-card");
   card.append(make("h3","",stmt.title),make("p","",stmt.body));
   if(stmt.author_id===user.id){card.append(make("small","pilot-muted","Nuk mund të verifikosh deklaratën tënde."));target.append(card);continue;}
   const label=make("label","pilot-dialogue-review-label","Arsyetimi i verifikimit");
   const field=make("textarea","review-note");field.rows=2;field.minLength=20;field.maxLength=1000;label.append(field);card.append(label);
   const publicLabel=make("label","pilot-dialogue-review-label","Kopja publike e redaktuar");
   const publicBody=make("textarea","dialogue-public-body");
   publicBody.rows=3;publicBody.maxLength=360;publicBody.minLength=25;publicBody.value=stmt.body;
   publicLabel.append(publicBody);card.append(publicLabel);
   const privacyLabel=make("label","pilot-dialogue-review-label");
   const privacy=make("input");privacy.type="checkbox";
   privacyLabel.append(privacy,document.createTextNode(" Kontrollova privatësinë e kopjes publike."));
   card.append(privacyLabel);
   const buttons=make("div","pilot-review-actions");
   for(const [decision,text] of [["accepted","Mirato deklaratën"],["rejected","Refuzo deklaratën"]]){
    const btn=make("button","btn subtle",text);btn.type="button";
    btn.addEventListener("click",async()=>{
     btn.disabled=true;
     try{await call("/api/dialogue/statements/"+encodeURIComponent(stmt.id)+"/review","POST",{decision,note:field.value,publicBody:publicBody.value,privacyReviewed:privacy.checked});
      notice("Vendimi për deklaratën u regjistrua.");await refresh();
     }catch(e){notice(e.message,true);}finally{btn.disabled=false;}
    });
    buttons.append(btn);
   }
   card.append(buttons);target.append(card);
  }
 }
}
export function initDialogue({call,notice,refresh}){
 $("dialogue-report-export").addEventListener("click",()=>{
  if(!publicAggregateReport||!publicAggregateReport.items.length){
   notice("Nuk ka ende të dhëna të agreguara për eksport.",true);return;
  }
  const url=URL.createObjectURL(new Blob([JSON.stringify(publicAggregateReport,null,2)],{type:"application/json"}));
  const link=make("a");link.href=url;link.download="protesto-dialogu-raport.json";link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  notice("U eksportuan vetëm statistikat e lejuara dhe përfundimtare.");
 });
 $("dialogue-topic-select").addEventListener("change",async event=>{
  selectedTopic=event.target.value;await openTopic(selectedTopic);
 });
 $("dialogue-create-form").addEventListener("submit",async event=>{
  event.preventDefault();
  try{
   const form=event.currentTarget;
   const draft=Object.fromEntries(new FormData(form));
    const result=await call("/api/dialogue/topics","POST",{
     caseId:draft.caseId,title:draft.title,description:draft.description,
     public:{title:draft.publicTitle,description:draft.publicDescription},
     checks:{privacyReviewed:draft.privacyReviewed==="on",publicCopyReviewed:draft.privacyReviewed==="on"}
    });
   selectedTopic="";form.reset();notice("Tema u dërgua për miratim të pavarur. Ende nuk është publike.");await refresh();
  }catch(e){notice(e.message,true);}
 });
 $("dialogue-statement-form").addEventListener("submit",async event=>{
  event.preventDefault();const form=event.currentTarget;
  try{
   if(!selectedTopic)throw Error("Zgjidh fillimisht një temë.");
   await call("/api/dialogue/topics/"+encodeURIComponent(selectedTopic)+"/statements","POST",Object.fromEntries(new FormData(form)));
   form.reset();notice("Deklarata u dërgua për moderim, nuk publikohet automatikisht.");await refresh();
  }catch(e){notice(e.message,true);}
 });
 $("dialogue-close-form").addEventListener("submit",async event=>{
  event.preventDefault();
  try{
   await call("/api/dialogue/topics/"+encodeURIComponent(selectedTopic)+"/close","POST",Object.fromEntries(new FormData(event.currentTarget)));
   notice("Tema u mbyll; votat individuale janë fshirë.");await refresh();
  }catch(e){notice(e.message,true);}
 });
}
