import test from "node:test";import assert from "node:assert/strict";import {publicSourceLinkSafety} from "../src/opencode-public-source-link-safety.mjs";
test("valid HTTPS public link",()=>{const r=publicSourceLinkSafety("https://example.org/public/report.pdf");assert.equal(r.allowed,true);assert.equal(r.verifiedAuthenticity,false);});
test("dangerous scheme rejected",()=>{for(const value of ["file:///tmp/a","javascript:alert(1)","http://example.org"])assert.equal(publicSourceLinkSafety(value).allowed,false);});
test("embedded credentials denied",()=>{assert.equal(publicSourceLinkSafety("https://username:password@example.org/a").allowed,false);});
test("local and private hosts denied",()=>{for(const h of ["localhost","127.0.0.1","192.168.1.10","10.0.0.1","172.16.0.2","169.254.1.2","[::1]"])assert.equal(publicSourceLinkSafety("https://"+h+"/a").allowed,false);});
test("encoded characters and spacing denied",()=>{for(const v of ["https://example.org/a%0dB"," https://example.org/a","https://example.org/a\nb"])assert.equal(publicSourceLinkSafety(v).allowed,false);});
test("public paths deterministic",()=>{const s="https://example.org/a/b?x=1";assert.deepEqual(publicSourceLinkSafety(s),publicSourceLinkSafety(s));});
