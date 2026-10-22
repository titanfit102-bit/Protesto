// Separate, narrowly privileged publisher. NEVER executes generated JS.
import {readFileSync,existsSync,lstatSync,appendFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {createHash} from "node:crypto";
const repo="titanfit102-bit/Protesto",baseBranch="feat/protesto-foundation";
const root=resolve(process.env.QUEUE_ARTIFACT_DIR||"./queue-output");
const token=process.env.GITHUB_TOKEN;
if(!token)throw Error("Publisher missing token");
const raw=readFileSync("automation/opencode-approved-tasks.json","utf8");
const list=JSON.parse(raw),output=JSON.parse(readFileSync(join(root,"manifest.json"),"utf8"));
const hash=v=>createHash("sha256").update(v).digest("hex");
const fail=s=>{throw Error("OpenCode publisher: "+s);};
if(list.version!==2||list.policy!=="guarded-module-or-tests"||list.base!==baseBranch||list.maxTasksPerRun!==4)fail("Invalid controller queue policy");
if(output.version!==2||output.base!==baseBranch||output.queueDigest!==hash(raw)||!Array.isArray(output.tasks))fail("Stale or tampered generator manifest");
if(!Array.isArray(list.tasks)||output.tasks.length>list.tasks.length)fail("Manifest count invalid");
const baseURL="https://api.github.com/repos/"+repo;
async function api(method,path,body,accept404=false){
 const res=await fetch(baseURL+path,{
  method,
  headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28",...(body?{"Content-Type":"application/json"}:{})},
  body:body?JSON.stringify(body):undefined
 });
 const text=await res.text();
 if(accept404&&res.status===404)return null;
 if(!res.ok)fail(method+" "+path+" "+res.status+": "+text.slice(0,300));
 return text?JSON.parse(text):{};
}
const base=await api("GET","/git/ref/heads/"+baseBranch);
if(base.object.sha!==output.baseSha)fail("Base moved while agent was generating; do not publish stale code");
const results=[];
for(const item of output.tasks){
 const task=list.tasks.find(t=>t.id===item.id);
 if(!task||task.status!=="approved"||task.kind!==item.kind)fail("Task is not approved: "+item.id);
 if(!/^[a-z][a-z0-9-]{2,36}$/.test(task.id))fail("Bad task id");
 const branch="opencode/pilot-"+task.id;
 if(branch!==item.branch)fail("Branch mismatch");
 if(item.status==="pending"){results.push({id:item.id,status:"queued-for-next-owner-trigger"});continue;}
 if(item.status==="already-exists"){results.push({id:item.id,status:"already-exists",branch});continue;}
 if(item.status!=="verified"||!Number.isInteger(item.attempts)||item.attempts<1||item.attempts>3)fail("Not independently verified");
 const paths=task.kind==="tests"?["test/opencode-"+task.id+".test.mjs"]:
   task.kind==="pure-module"?["src/opencode-"+task.id+".mjs","test/opencode-"+task.id+".test.mjs"]:null;
 if(!paths||!Array.isArray(item.files)||item.files.length!==paths.length)fail("Unexpected source file count");
 const code=new Map();
 for(let i=0;i<paths.length;i++){
  const f=item.files[i],name=paths[i],expected=task.id+"-"+(name.startsWith("src/")?"module":"tests")+".mjs";
  if(f.path!==name||f.artifact!==expected||!/^[a-f0-9]{64}$/.test(f.sha256))fail("Artifact path invalid");
  const disk=join(root,expected);
  if(!existsSync(disk)||!lstatSync(disk).isFile()||lstatSync(disk).isSymbolicLink())fail("Unsafe artifact");
  const txt=readFileSync(disk,"utf8");
  if(txt.length<150||txt.length>20000||hash(txt)!==f.sha256)fail("Artifact checksum invalid");
  if(/\b(?:process|require|globalThis|eval|fetch|WebSocket|Worker|window|document|XMLHttpRequest|Function|child_process|worker_threads|fs|net|vm|Buffer|import\.meta)\b|\bimport\s*\(|\.\.\/\.\.\//.test(txt))fail("Unsafe generated source rejected");
  const imports=[...txt.matchAll(/\b(?:from\s*|import\s*)["']([^"']+)["']/g)].map(x=>x[1]);
  const allowed=new Set(["node:test","node:assert/strict","../src/domain.mjs","../src/seed.mjs","../src/opencode-"+task.id+".mjs"]);
  if(imports.some(x=>!allowed.has(x))||(name.startsWith("src/")&&imports.length))fail("Disallowed code imports");
  code.set(name,txt);
 }
 // Branch existence is the durable completion marker; never overwrite previously published work.
 const exists=await api("GET","/git/ref/heads/"+branch,undefined,true);
 if(exists){results.push({id:item.id,status:"already-exists",branch});continue;}
 // Create a new isolated branch at the exact tested base; never modify existing refs or main.
 await api("POST","/git/refs",{ref:"refs/heads/"+branch,sha:base.object.sha});
 for(const [name,txt] of code){
  await api("PUT","/contents/"+name,{
   message:"feat(opencode): reviewed-by-CI "+task.id+" "+name,
   branch,content:Buffer.from(txt).toString("base64")
  });
 }
 const pr=await api("POST","/pulls",{
  title:"feat(opencode): "+task.id+" — "+(task.kind==="pure-module"?"guarded pure module":"regression tests"),
  head:branch,base:baseBranch,draft:true,
  body:[
   "## Architect-owned OpenCode task",
   "Task: "+task.id+" (kind "+task.kind+").",
   "No personal data, deployment, source licensing reuse or production API credentials.",
   "## Independently verified on a disposable runner",
   "npm run verify"+(task.kind==="pure-module"?", npm run test:e2e and npm run test:backup":""),
   "Artifact sha256:",
   ...item.files.map(f=>"- "+f.path+": "+f.sha256),
   "Base SHA: "+base.object.sha,
   "## Release gate",
   "Draft only. Human architectural/security review and separate CI are required. No automatic merge, deployment or write to main."
  ].join("\n")
 });
 results.push({id:item.id,status:"draft-pr",url:pr.html_url});
 console.log("CREATED DRAFT PR "+pr.html_url);
}
const summary="## Protesto OpenCode guarded queue\n"+results.map(x=>"- "+x.id+": "+x.status+(x.url?" "+x.url:x.branch?" "+x.branch:"")).join("\n")+"\n";
console.log(summary);
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
