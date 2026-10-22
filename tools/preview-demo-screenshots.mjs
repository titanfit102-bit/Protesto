import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import puppeteer from "puppeteer-core";

// Screenshots of the actual bundled offline browser-only UI, not mocked artwork.
const folder=fileURLToPath(new URL("../dist-preview/",import.meta.url));
const html=join(folder,"Protesto-DEMO.html");
const browser=await puppeteer.launch({
 executablePath:process.env.CHROME_PATH||"/usr/bin/chromium",
 headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]
});
try{
 const page=await browser.newPage();
 const errors=[];page.on("pageerror",err=>errors.push(err.message));
 await page.setViewport({width:1440,height:900,deviceScaleFactor:1});
 await page.goto("file://"+html,{waitUntil:"load"});
 await page.waitForFunction(()=>document.querySelectorAll("#content article").length>0,{timeout:10000});
 assert.deepEqual(errors,[],"Offline preview JS must run without page errors");
 await page.screenshot({path:join(folder,"01-desktop.png"),fullPage:true});
 await page.goto("file://"+html+"#cases",{waitUntil:"load"});
 await page.waitForSelector("#content .filters",{timeout:10000});
 await page.screenshot({path:join(folder,"02-dosjet.png"),fullPage:true});
 for(const [width,height,name] of [[320,568,"03-mobile-320"],[360,780,"04-mobile-360"],[390,844,"05-mobile-390"],[768,1024,"06-tablet"]]){
  await page.setViewport({width,height,deviceScaleFactor:1,isMobile:width<600});
  await page.goto("file://"+html+"#overview",{waitUntil:"load"});
  await page.waitForFunction(()=>document.querySelector("#content article")!==null,{timeout:10000});
  const dimensions=await page.evaluate(()=>({
   scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,
   links:[...document.querySelectorAll("nav a")].filter(a=>a.getClientRects().length).length
  }));
  assert.ok(dimensions.scroll<=dimensions.client+2,"Horizontal overflow at "+width+"px: "+JSON.stringify(dimensions));
  assert.ok(dimensions.links>0,"No navigational links visible at "+width+"px");
  await page.screenshot({path:join(folder,name+".png"),fullPage:true});
 }
 console.log("Offline HTML verified in Chromium and original desktop/mobile screenshots saved.");
}finally{await browser.close();}
