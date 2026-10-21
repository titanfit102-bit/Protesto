// Original Protesto Albanian deliberation UI. Public views never expose voter identity.
const $=id=>document.getElementById(id);
const make=(tag,className,content)=>{
 const el=document.createElement(tag);if(className)el.className=className;
 if(content!==undefined)el.textContent=content;
 return el;
};
let selectedTopic="";
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
export async function renderDialogue({user,call,notice,refresh,cases}){
 context={user,call,notice,refresh};
 const result=await call("/api/dialogue/topics"),topics=result.items;
 const select=$("dialogue-topic-select");select.replaceChildren(listOption("","Zgjidh një diskutim..."));
 for(const item of topics)select.append(listOption(item.id,item.title+" — "+(item.state==="closed"?"mbyllur":"hapur")));
 if(!topics.some(x=>x.id===selectedTopic))selectedTopic=topics[0]?.id||"";
 select.value=selectedTopic;
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
   const buttons=make("div","pilot-review-actions");
   for(const [decision,text] of [["accepted","Mirato deklaratën"],["rejected","Refuzo deklaratën"]]){
    const btn=make("button","btn subtle",text);btn.type="button";
    btn.addEventListener("click",async()=>{
     btn.disabled=true;
     try{await call("/api/dialogue/statements/"+encodeURIComponent(stmt.id)+"/review","POST",{decision,note:field.value});
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
 $("dialogue-topic-select").addEventListener("change",async event=>{
  selectedTopic=event.target.value;await openTopic(selectedTopic);
 });
 $("dialogue-create-form").addEventListener("submit",async event=>{
  event.preventDefault();
  try{
   const form=event.currentTarget;
   const result=await call("/api/dialogue/topics","POST",Object.fromEntries(new FormData(form)));
   selectedTopic=result.item.id;form.reset();notice("Diskutimi u hap mbi një dosje të verifikuar.");await refresh();
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
