import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
import {setTimeout as pause} from "node:timers/promises";
import puppeteer from "puppeteer-core";
import pg from "pg";
import {hashPassword} from "../src/server/security.mjs";
import {checkAccessibility} from "./accessibility.smoke.mjs";

if(!process.env.DATABASE_URL)throw Error("Disposable DATABASE_URL required.");
const host="http://127.0.0.1:4178";
const child=spawn(process.execPath,["tools/pilot-server.mjs"],{
 env:{...process.env,HOST:"127.0.0.1",PORT:"4178",APP_ORIGIN:host},stdio:["ignore","pipe","pipe"]
});
let logs="";child.stdout.on("data",x=>logs+=x.toString());child.stderr.on("data",x=>logs+=x.toString());
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:4});
let browser;
async function ready(){
 for(let i=0;i<80;i++){
  if(child.exitCode!==null)throw Error("Dialogue server exited: "+logs.slice(-1200));
  try{if((await fetch(host+"/api/ready")).ok)return;}catch{}
  await pause(130);
 }
 throw Error("Dialogue server readiness timeout "+logs.slice(-1200));
}
async function form(page,selector,fields){
 for(const [name,value] of Object.entries(fields)){
  await page.$eval(selector+' [name="'+name+'"]',(el,v)=>{
   el.value=v;el.dispatchEvent(new Event("change",{bubbles:true}));el.dispatchEvent(new Event("input",{bubbles:true}));
  },value);
 }
}
async function click(page,selector,label){
 const done=await page.evaluate((selector,label)=>{
  const btn=[...document.querySelectorAll(selector+" button")].find(b=>b.textContent.trim()===label);
  if(!btn||btn.disabled)return false;btn.click();return true;
 },selector,label);
 assert.equal(done,true,"Button missing "+selector+" "+label);
}
async function login(page,account){
 await page.waitForSelector("#auth-section:not([hidden])");
 await form(page,"#login-form",{email:account.email,password:account.password});
 await click(page,"#login-form","Hyr në pilot");
 await page.waitForSelector("#authenticated:not([hidden])");
 await page.waitForNetworkIdle({idleTime:250,timeout:15000});
}
async function logout(page){
 await click(page,"header","Dil");
 await page.waitForSelector("#auth-section:not([hidden])");
}
try{
 await ready();
 const suffix=randomUUID().slice(0,8);
 const reviewer={id:randomUUID(),role:"reviewer",email:"browser-dialogue-review-"+suffix+"@example.org",password:"BrowserDialogueReviewer!2026"};
 const citizen={id:randomUUID(),role:"reporter",email:"browser-dialogue-citizen-"+suffix+"@example.org",password:"BrowserDialogueCitizen!2026"};
 for(const account of [reviewer,citizen]){
  await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",[account.id,account.email,hashPassword(account.password),account.role]);
 }
 const caseId=randomUUID();
 await pool.query("INSERT INTO civic_cases(id,author_id,title,description,area,category,state) VALUES($1,$2,$3,$4,$5,$6,'published')",
  [caseId,citizen.id,"Dosje prove për dialogun","Dosje sintetike për testim në browser, pa pretendime publike reale.","Prova "+suffix,"Mjedis"]);
 browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const page=await browser.newPage();
 const jsErrors=[];page.on("pageerror",error=>jsErrors.push(error.message));
 await page.setViewport({width:1366,height:900});
 if(process.env.PROTESTO_CAPTURE_PREVIEW==="1")await mkdir("dist-preview",{recursive:true});
 await page.goto(host+"/pilot.html",{waitUntil:"networkidle0"});
 if(process.env.PROTESTO_CAPTURE_PREVIEW==="1")await page.screenshot({path:"dist-preview/04-hyrja-pilot.png",fullPage:true});
 await login(page,reviewer);
 await page.waitForSelector("#dialogue-create-section:not([hidden])");
 await form(page,"#dialogue-create-form",{caseId,title:"Konsultim sintetik për mjedisin",description:"Ky është një diskutim sintetik për verifikimin e funksioneve të moderimit dhe votimit."});
 await click(page,"#dialogue-create-form","Hap diskutimin");
 await page.waitForFunction(()=>document.querySelector("#dialogue-details h3")?.textContent==="Konsultim sintetik për mjedisin",{timeout:15000});
 console.log("[dialogue browser] Reviewer created a topic linked to published case");
 await logout(page);
 await login(page,citizen);
 await page.waitForSelector("#dialogue-statement-form:not([hidden])");
 await form(page,"#dialogue-statement-form",{body:"Institucionet duhet të publikojnë raporte të kontrollueshme për shërbimet publike."});
 await click(page,"#dialogue-statement-form","Dërgo deklaratën për moderim");
 await page.waitForFunction(()=>document.querySelector("#pilot-notice")?.textContent.includes("moderim"),{timeout:12000});
 await logout(page);
 await login(page,reviewer);
 await page.waitForSelector("#review-dialogue-statements .pilot-card");
 await page.$eval("#review-dialogue-statements .pilot-card textarea",x=>x.value="Deklaratë e paanshme, pa identifikues privatë, e kontrolluar manualisht.");
 await click(page,"#review-dialogue-statements .pilot-card","Mirato deklaratën");
 await page.waitForSelector("#dialogue-details .pilot-dialogue-statement");
 console.log("[dialogue browser] Statement approved by separate moderator");
 await logout(page);
 await login(page,citizen);
 await page.waitForSelector("#dialogue-details .pilot-dialogue-statement button");
 await click(page,"#dialogue-details .pilot-dialogue-statement","Pajtohem");
 await page.waitForFunction(()=>document.querySelector("#pilot-notice")?.textContent.includes("konfirmo njoftimin"),{timeout:12000});
 await page.$eval("#dialogue-consent",el=>el.click());
 await click(page,"#dialogue-details .pilot-dialogue-statement","Pajtohem");
 await page.waitForFunction(()=>document.querySelector("#pilot-notice")?.textContent.includes("u ruajt"),{timeout:12000});
 assert.match(await page.$eval("#dialogue-details .pilot-dialogue-statement small",x=>x.textContent),/fshihen/);
 if(process.env.PROTESTO_CAPTURE_PREVIEW==="1"){
  const el=await page.$("#dialogue-section");
  await el.screenshot({path:"dist-preview/05-dialogu-qytetar.png"});
 }
 console.log("[dialogue browser] Consent enforced, vote recorded, live tally suppressed");
 await logout(page);
 await login(page,reviewer);
 await page.waitForSelector("#dialogue-close-form:not([hidden])");
 await form(page,"#dialogue-close-form",{note:"Mbyllja e konsultimit sintetik pas kontrollit të procedurave."});
 await click(page,"#dialogue-close-form","Mbyll diskutimin dhe finalizo rezultatet");
 await page.waitForFunction(()=>document.querySelector("#dialogue-details .pilot-dialogue-disclaimer")?.textContent.includes("mbyllur"),{timeout:12000});
 const remaining=await pool.query("SELECT count(*)::integer n FROM dialogue_votes");
 assert.equal(remaining.rows[0].n,0);
 await page.setViewport({width:390,height:844,isMobile:true});
 await checkAccessibility(page,"dialogue closed mobile");
 const size=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(size.scroll<=size.viewport+2,"Dialogue mobile overflow "+JSON.stringify(size));
 assert.deepEqual(jsErrors,[],"No browser JS errors expected");
 console.log("Dialogue Chromium E2E passed: case → topic → moderation → consent → vote → close → deletion → mobile.");
}finally{
 if(browser)await browser.close();
 await pool.end();
 child.kill("SIGTERM");
 await pause(120);
}
