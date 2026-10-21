import test from "node:test";
import assert from "node:assert/strict";
import {rateKey} from "../src/server/rate-limits.mjs";

test("rate-limit identities are secret-keyed hashes, not raw personal identifiers",()=>{
 const secret="unique-synthetic-test-secret-not-for-real-production";
 const raw="citizen@example.org";
 const first=rateKey(secret,"login-email",raw);
 assert.match(first,/^[0-9a-f]{64}$/);
 assert.equal(first,rateKey(secret,"login-email",raw));
 assert.notEqual(first,rateKey(secret,"login-ip",raw));
 assert.notEqual(first,rateKey(secret+"-another","login-email",raw));
 assert.equal(first.includes(raw),false);
 assert.throws(()=>rateKey("short","login-email",raw));
});
