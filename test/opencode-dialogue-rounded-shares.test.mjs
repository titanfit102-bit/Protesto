import test from 'node:test';
import assert from 'node:assert/strict';
import {roundedDialogueShares} from '../src/opencode-dialogue-rounded-shares.mjs';
test('fixed thirds total exactly 100',()=>{ const v=roundedDialogueShares({agree_count:4,disagree_count:4,pass_count:4}); assert.deepEqual([v.agree_percent,v.disagree_percent,v.pass_percent],[34,33,33]); });
test('zeros and exact sums',()=>{ const v=roundedDialogueShares({agree_count:10,disagree_count:0,pass_count:0,participants:10}); assert.equal(v.agree_percent,100); assert.equal(v.disagree_percent+v.pass_percent,0); });
test('rejects malformed totals',()=>{ for(const v of [{agree_count:4,disagree_count:4,pass_count:1},{agree_count:10,disagree_count:0,pass_count:0,participants:11},{agree_count:Infinity,disagree_count:0,pass_count:0},{agree_count:-1,disagree_count:11,pass_count:0}]) assert.throws(()=>roundedDialogueShares(v)); });
test('deterministic and non-mutating',()=>{ const original=Object.freeze({agree_count:7,disagree_count:3,pass_count:1}); const a=roundedDialogueShares(original); assert.deepEqual(a,roundedDialogueShares(original)); assert.equal(original.agree_count,7); assert.equal(a.agree_percent+a.disagree_percent+a.pass_percent,100); });
