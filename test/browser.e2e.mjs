import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
import {setTimeout as pause} from "node:timers/promises";
import puppeteer from "puppeteer-core";
import pg from "pg";
import {hashPassword} from "../src/server/security.mjs";

const chrome=process.env.CHROME_PATH||"/usr/bin/google-chrome";
const host="http://127.0.0.1:4174";
const log=message=>console.log("[browser-e2e] "+message);
const child=spawn(process.execPath,["tools/pilot-server.mjs"],{
 env:{...process.env,HOST:"127.0.0.1",PORT:"4174",APP_ORIGIN:host},
 stdio:["ignore","pipe","pipe"]
});
let serviceLog="";
child.stdout.on("data",x=>serviceLog+=x.toString());
child.stderr.on("data",x=>serviceLog+=x.toString());
async function untilReady(){
 for(let attempt=0;attempt<80;attempt++){
  if(child.exitCode!==null)throw new Error("Pilot server exited: "+serviceLog.slice(-1200));
  try{const r=await fetch(host+"/api/ready");if(r.ok)return;}catch{}
  await pause(125);
 }
 throw new Error("Pilot server startup timed out: "+serviceLog.slice(-1200));
}
async function fillForm(page,formId,values){
 for(const [name,value] of Object.entries(values)){
  await page.$eval(formId+' [name="'+name+'"]',(field,text)=>{
   field.value=text;
   field.dispatchEvent(new Event("input",{bubbles:true}));
   field.dispatchEvent(new Event("change",{bubbles:true}));
  },value);
 }
}
async function clickText(page,root,text){
 const clicked=await page.evaluate((selector,label)=>{
  const el=[...document.querySelectorAll(selector+" button")].find(x=>x.textContent.trim()===label);
  if(!el||el.disabled)return false;
  el.click();return true;
 },root,text);
 assert.equal(clicked,true,"button not found or disabled: "+text);
}
async function waitVisible(page,selector){
 await page.waitForFunction(s=>{const el=document.querySelector(s);return !!el&&!el.hidden&&getComputedStyle(el).display!=="none";},{timeout:12000},selector);
}
let browser;
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:4});
try{
 await untilReady();
 const unique=randomUUID().slice(0,8);
 const accounts=[
  {id:randomUUID(),email:"browser-reporter-"+unique+"@example.org",password:"PrivatePilotPass!2026",role:"reporter"},
  {id:randomUUID(),email:"browser-reviewer-"+unique+"@example.org",password:"PrivateReviewPass!2026",role:"reviewer"}
 ];
 for(const account of accounts){
  await pool.query("INSERT INTO civic_users(id,email,password_hash,role) VALUES($1,$2,$3,$4)",[account.id,account.email,hashPassword(account.password),account.role]);
 }
 browser=await puppeteer.launch({executablePath:chrome,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const page=await browser.newPage();
 page.on("pageerror",err=>{throw new Error("Browser JS exception: "+err.message);});
 await page.setViewport({width:1280,height:800});
 await page.goto(host+"/pilot.html",{waitUntil:"networkidle0"});
 await waitVisible(page,"#auth-section");
 log("login form loaded");
 await fillForm(page,"#login-form",{email:accounts[0].email,password:accounts[0].password});
 await clickText(page,"#login-form","Hyr në pilot");
 await waitVisible(page,"#authenticated");
 log("reporter logged in");
 const title="Raport browser "+unique;
 await fillForm(page,"#case-form",{
  title,category:"Infrastrukturë",area:"Qyteti i testit",
  description:"Ky është një raportim artificial për testimin real në Chromium dhe publikimin editorial.",
  source:"https://example.org/browser-test"
 });
 await clickText(page,"#case-form","Dërgo për verifikim");
 await page.waitForFunction(t=>[...document.querySelectorAll("#my-cases h3")].some(x=>x.textContent===t),{timeout:12000},title);
 log("submitted case appears in reporter queue");
 await clickText(page,"header","Dil");
 await waitVisible(page,"#auth-section");
 await fillForm(page,"#login-form",{email:accounts[1].email,password:accounts[1].password});
 await clickText(page,"#login-form","Hyr në pilot");
 await waitVisible(page,"#review-section");
 await page.waitForFunction(t=>[...document.querySelectorAll("#review-cases h3")].some(x=>x.textContent===t),{timeout:12000},title);
 const caseIndex=await page.evaluate(t=>[...document.querySelectorAll("#review-cases .pilot-card")].findIndex(el=>el.querySelector("h3")?.textContent===t),title);
 assert.ok(caseIndex>=0);
 const selectCard="#review-cases .pilot-card:nth-child("+(caseIndex+1)+")";
 await page.click(selectCard+" .pilot-evidence summary");
 await page.waitForSelector(selectCard+" .pilot-source");
 await page.$eval(selectCard+" .pilot-source textarea",el=>el.value="Burimi testues është kontrolluar manualisht për demonstrimin.");
 await clickText(page,selectCard+" .pilot-source","Prano burimin");
 await page.waitForFunction(s=>document.querySelector(s)?.textContent.includes("Burim i verifikuar"),{timeout:12000},selectCard+" .pilot-source small");
 await page.$eval(selectCard+' > textarea.review-note',el=>el.value="Dosja demonstrative u kontrollua sipas procedurës dhe mund të publikohet.");
 await page.$$eval(selectCard+" .pilot-checklist input",els=>els.forEach(x=>x.checked=true));
 await clickText(page,selectCard,"Publiko pas verifikimit");
 await page.waitForFunction(t=>[...document.querySelectorAll("#public-cases h3")].some(x=>x.textContent===t),{timeout:12000},title);
 log("independent reviewer verified source and published");
 await clickText(page,"header","Dil");
 await waitVisible(page,"#auth-section");
 await fillForm(page,"#login-form",{email:accounts[0].email,password:accounts[0].password});
 await clickText(page,"#login-form","Hyr në pilot");
 await waitVisible(page,"#authenticated");
 await page.waitForNetworkIdle({idleTime:350,timeout:12000});
 const publicCard=await page.evaluate(t=>[...document.querySelectorAll("#public-cases .pilot-card")].findIndex(x=>x.querySelector("h3")?.textContent===t),title);
 assert.ok(publicCard>=0);
 const publicSel="#public-cases .pilot-card:nth-child("+(publicCard+1)+")";
 await page.evaluate(selector=>document.querySelector(selector)?.click(),publicSel+" details:last-child summary");
 await page.$eval(publicSel+' details:last-child [name="reason"]',el=>el.value="Kërkoj korrigjim të materialit demonstrues sepse mbetet pa kontekst të mjaftueshëm.");
 await clickText(page,publicSel+" details:last-child","Dërgo kërkesën");
 await page.waitForFunction(()=>document.querySelectorAll("#my-corrections .pilot-card").length>0,{timeout:12000});
 log("citizen correction request submitted");
 await clickText(page,"header","Dil");
 await waitVisible(page,"#auth-section");
 await fillForm(page,"#login-form",{email:accounts[1].email,password:accounts[1].password});
 await clickText(page,"#login-form","Hyr në pilot");
 await page.waitForFunction(t=>[...document.querySelectorAll("#review-corrections h3")].some(x=>x.textContent===t),{timeout:12000},title);
 const cIndex=await page.evaluate(t=>[...document.querySelectorAll("#review-corrections .pilot-card")].findIndex(x=>x.querySelector("h3")?.textContent===t),title);
 const correction="#review-corrections .pilot-card:nth-child("+(cIndex+1)+")";
 await page.$eval(correction+" textarea",el=>el.value="Kërkesa u kontrollua, pranohet për tërheqjen e dosjes demonstrative.");
 await clickText(page,correction,"Prano dhe tërhiq dosjen");
 await page.waitForFunction(t=>![...document.querySelectorAll("#public-cases h3")].some(x=>x.textContent===t),{timeout:12000},title);
 log("reviewed correction withdrew published case");
 await page.waitForFunction(()=>[...document.querySelectorAll("#public-ledger strong")].some(x=>x.textContent.includes("tërhequr")),{timeout:12000});
 log("public retraction history contains no private review details");

 await page.setViewport({width:390,height:844,isMobile:true});
 await pause(300);
 const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
 assert.ok(size.scroll<=size.viewport+2,"Mobile overflow: "+JSON.stringify(size));
 log("mobile viewport has no horizontal page overflow");
 log("private pilot journey and mobile viewport passed");
 await page.goto(host+"/#cases",{waitUntil:"networkidle0"});
 await page.waitForSelector("#query");
 await page.$eval("#query",el=>{el.value="Mjedis";el.dispatchEvent(new Event("input",{bubbles:true}));});
 await page.waitForFunction(()=>document.querySelector(".result-count")?.textContent.includes("1 rezultate"),{timeout:12000});
 log("demo search filter works");
 await page.$eval("#query",el=>{el.value="";el.dispatchEvent(new Event("input",{bubbles:true}));});
 await page.evaluate(()=>{
  const btn=[...document.querySelectorAll('[data-compose="case"]')].find(x=>x.offsetParent!==null);
  btn?.click();
 });
 await page.waitForSelector("#composer[open]");
 const demoTitle="Raport demonstrimi browser "+unique;
 await fillForm(page,"#compose-form",{
  title:demoTitle,category:"Mjedis",area:"Zona demo",
  description:"Test i përmbajtjes lokale në shfletues, pa pretendime për institucione reale.",
  source:"https://example.org/example"
 });
 await clickText(page,"#compose-form","Ruaj lokalisht →");
 await page.waitForFunction(t=>[...document.querySelectorAll("#content .record h3")].some(x=>x.textContent===t),{timeout:12000},demoTitle);
 assert.ok((await page.evaluate(()=>localStorage.getItem("protesto.demo.v1"))).includes(demoTitle));
 await page.reload({waitUntil:"networkidle0"});
 await page.waitForFunction(t=>[...document.querySelectorAll("#content .record h3")].some(x=>x.textContent===t),{timeout:12000},demoTitle);
 page.once("dialog",async dialog=>dialog.accept());
 await page.click("#reset-btn");
 await page.waitForFunction(t=>![...document.querySelectorAll("#content .record h3")].some(x=>x.textContent===t),{timeout:12000},demoTitle);
 const demoSize=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
 assert.ok(demoSize.scroll<=demoSize.viewport+2,"Demo mobile overflow: "+JSON.stringify(demoSize));
 log("demo case creation, local persistence, reset and mobile layout passed");
 console.log("Chromium E2E passed: pilot publication/corrections and browser-only demo.");

}finally{
 if(browser)await browser.close();
 await pool.end();
 child.kill("SIGTERM");
 await pause(100);
}
