import test from "node:test";import assert from "node:assert/strict";import {accessibleStatusMessage} from "../src/opencode-accessible-status-messages.mjs";
test("loading polite",()=>{assert.deepEqual(accessibleStatusMessage("loading"),{severity:"info",message:"Përmbajtja po ngarkohet.",ariaLive:"polite"});});
test("empty results are neutral",()=>{assert.equal(accessibleStatusMessage("empty").severity,"info");});
test("unauthorized assertive",()=>{assert.equal(accessibleStatusMessage("unauthorized").ariaLive,"assertive");});
test("rate limit warning",()=>{assert.equal(accessibleStatusMessage("rate_limited").severity,"warning");});
test("safe unknown code",()=>{assert.equal(accessibleStatusMessage("<script>private</script>").message.includes("<script>"),false);});
test("deterministic and not stateful",()=>{assert.deepEqual(accessibleStatusMessage("pending_review"),accessibleStatusMessage("pending_review"));assert.match(accessibleStatusMessage("finalized_aggregates").message,/nuk përfaqësojnë/);});
