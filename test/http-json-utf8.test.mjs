import test from "node:test";
import assert from "node:assert/strict";
import {Readable} from "node:stream";
import {readJSON} from "../src/server/app.mjs";

function request(chunks,contentType="application/json"){
 const input=Readable.from(chunks);
 input.headers={"content-type":contentType};
 return input;
}

test("JSON HTTP decoding preserves Albanian and multibyte text across arbitrary chunks",async()=>{
 const input={title:"Dëmtim në rrugë – çështje qytetare",text:"Çdo qytetar kërkon përgjigje: 🏛️"};
 const encoded=Buffer.from(JSON.stringify(input),"utf8");
 for(let split=1;split<encoded.length;split++){
  const result=await readJSON(request([encoded.subarray(0,split),encoded.subarray(split)]));
  assert.deepEqual(result,input,"byte boundary "+split);
 }
 const byteChunks=Array.from(encoded,(_,i)=>encoded.subarray(i,i+1));
 assert.deepEqual(await readJSON(request(byteChunks)),input);
});

test("JSON HTTP decoding rejects malformed UTF-8, oversize bodies and invalid shapes",async()=>{
 await assert.rejects(readJSON(request([Buffer.from([123,34,120,34,58,34,0xc3,40,34,125])])),e=>e.status===400);
 await assert.rejects(readJSON(request([Buffer.alloc(16385,0x20)])),e=>e.status===413);
 await assert.rejects(readJSON(request([Buffer.from("[1,2,3]")])),e=>e.status===400);
 await assert.rejects(readJSON(request([Buffer.from("{}")],"text/plain")),e=>e.status===415);
});
