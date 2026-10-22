import test from "node:test";
import assert from "node:assert/strict";
import {safePublicExternalUrl} from "../src/server/public-url.mjs";
test("publication links reject query tokens, unsafe schemes and local network destinations",()=>{
 assert.equal(safePublicExternalUrl("https://example.org/source"),"https://example.org/source");
 for(const x of ["https://example.org/path?secret=1","https://example.org/path#person","https://user:pass@example.org/a","http://example.org/a",
 "https://localhost/a","https://127.0.0.1/a","https://10.2.3.4/a","https://192.168.0.1/a","https://172.16.1.2/a",
 "https://169.254.169.254/a","https://[::1]/","javascript:alert(1)"]){
  assert.equal(safePublicExternalUrl(x),null,x);
 }
});
