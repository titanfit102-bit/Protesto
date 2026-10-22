import test from "node:test";
import assert from "node:assert/strict";
import {
  DIALOGUE_METRICS_MIN_PARTICIPANTS,
  DIALOGUE_METRICS_DISCLAIMER,
  validateDialogueAggregate,
  summarizeDialogueReport
} from "../src/opencode-dialogue-report-metrics.mjs";

const validBig = {
  participants: 40, agree_count: 20, disagree_count: 8, pass_count: 12,
  statement: "Tekst i paqenë që moduli nuk duhet ta lexojë."
};
const validMedium = { participants: 25, agree_count: 15, disagree_count: 7, pass_count: 3 };
const validSmall = { participants: 10, agree_count: 6, disagree_count: 2, pass_count: 2 };
const subThreshold = { participants: 9, agree_count: 4, disagree_count: 3, pass_count: 2 };

test("agregatet valide japin pjesë përçuese të rrumbullakosura dhe renditje të qëndrueshme", () => {
  const result = summarizeDialogueReport([validSmall, validBig, validMedium]);
  assert.equal(result.format, "protesto-dialogue-aggregates/1");
  assert.equal(result.representative, false);
  assert.equal(result.included, 3);
  assert.equal(result.suppressed, 0);
  assert.equal(typeof result.disclaimer, "string");
  assert.ok(result.disclaimer.length > 20);
  assert.deepEqual(result.statements, [
    { participants: 40, agree_count: 20, disagree_count: 8, pass_count: 12, agree_share: 50, disagree_share: 20, pass_share: 30 },
    { participants: 25, agree_count: 15, disagree_count: 7, pass_count: 3, agree_share: 60, disagree_share: 28, pass_share: 12 },
    { participants: 10, agree_count: 6, disagree_count: 2, pass_count: 2, agree_share: 60, disagree_share: 20, pass_share: 20 }
  ]);
  assert.ok(!("statement" in result.statements[0]));
});

test("teza nën pragun minimal shtypen, jo refuzohen me gabim", () => {
  assert.equal(DIALOGUE_METRICS_MIN_PARTICIPANTS, 10);
  const result = summarizeDialogueReport([validBig, subThreshold, validSmall]);
  assert.equal(result.included, 2);
  assert.equal(result.suppressed, 1);
  assert.deepEqual(result.statements.map((s) => s.participants), [40, 10]);
  assert.throws(() => validateDialogueAggregate(subThreshold), /pragun/);
});

test("shuma e pavlefshme apo konte mashtruese refuzohen menjëherë me gabim eksplicit", () => {
  for (const item of [
    { participants: 20, agree_count: 10, disagree_count: 5, pass_count: 4 },
    { participants: 30, agree_count: -1, disagree_count: 11, pass_count: 20 },
    { participants: 10.5, agree_count: 6, disagree_count: 3, pass_count: 1.5 },
    { participants: 40, agree_count: Number.POSITIVE_INFINITY, disagree_count: 0, pass_count: 40 },
    { participants: 10, agree_count: Number.NaN, disagree_count: 5, pass_count: 5 },
    { participants: "50", agree_count: 25, disagree_count: 15, pass_count: 10 },
    { participants: 33, agree_count: 30, disagree_count: 3 },
    { participants: 15, agree_count: null, disagree_count: 10, pass_count: 5 }
  ]) {
    assert.throws(() => summarizeDialogueReport([item]), /duhet të jetë numër|nuk përputhet|duhet të jetë objekt/);
    assert.throws(() => validateDialogueAggregate(item));
  }
  assert.throws(() => summarizeDialogueReport([null]), /objekt/);
  assert.throws(() => summarizeDialogueReport([[validSmall]]), /objekt/);
  assert.throws(() => summarizeDialogueReport("nuk-është-listë"), /listë/);
  assert.throws(() => summarizeDialogueReport(validBig), /listë/);
});

test("konte nën prag me shumë të pampërputhshme refuzohen para shtypjes", () => {
  const mismatchSmall = { participants: 9, agree_count: 5, disagree_count: 2, pass_count: 3 };
  assert.throws(() => summarizeDialogueReport([validBig, mismatchSmall]), /nuk përputhet/);
  assert.throws(() => validateDialogueAggregate(mismatchSmall), /pragun|përputhet/);
});

test("hyrja nuk mutohet dhe rendi është deterministik pavarësisht fillimit", () => {
  const input = [validSmall, validBig, validMedium, subThreshold];
  const snapshot = structuredClone(input);
  const first = summarizeDialogueReport(input);
  assert.deepEqual(input, snapshot);
  const second = summarizeDialogueReport(input);
  assert.deepEqual(first, second);
  const shuffled = [subThreshold, validMedium, validBig, validSmall];
  assert.deepEqual(summarizeDialogueReport(shuffled).statements, first.statements);
  assert.deepEqual(shuffled, structuredClone([subThreshold, validMedium, validBig, validSmall]));
  assert.ok(Object.isFrozen(first.statements[0]));
  assert.throws(() => { first.statements[0].participants = 1; });
});

test("pjesët mbeten brenda 0–100 dhe nuk përmbajnë identitete apo fusha politike", () => {
  const result = summarizeDialogueReport([validBig, validMedium, validSmall]);
  const allowedKeys = ["participants", "agree_count", "disagree_count", "pass_count", "agree_share", "disagree_share", "pass_share"];
  for (const statement of result.statements) {
    assert.deepEqual(Object.keys(statement).sort(), [...allowedKeys].sort());
    for (const key of allowedKeys) {
      assert.equal(typeof statement[key], "number");
      assert.ok(Number.isSafeInteger(statement[key]) && statement[key] >= 0);
      if (key.endsWith("_share")) assert.ok(statement[key] <= 100);
    }
  }
  assert.equal(result.disclaimer, DIALOGUE_METRICS_DISCLAIMER);
});
