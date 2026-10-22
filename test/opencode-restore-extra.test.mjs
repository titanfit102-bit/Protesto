import test from "node:test";
import assert from "node:assert/strict";
import { restoreState, summarize } from "../src/domain.mjs";
import { SEED } from "../src/seed.mjs";

const syntheticCase = (n) => ({
  id: `demo-r-${String(n).padStart(4, "0")}`,
  title: `Dosje demonstruese sintetike ${n}`,
  description: "Përshkrim fiktiv demonstrues për testimin e rikthimit të të dhënave.",
  area: "Zona Sintetike",
  category: "Tjetër",
  status: "Raportuar",
  source: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  sample: true
});

const syntheticInitiative = (n) => ({
  id: `demo-ri-${String(n).padStart(4, "0")}`,
  title: `Nismë demonstruese sintetike ${n}`,
  description: "Nismë fiktive demonstruese për testimin e rikthimit të të dhënave.",
  type: "Peticioni",
  area: "Zona Sintetike",
  createdAt: "2026-01-01T00:00:00.000Z",
  sample: true
});

const syntheticGathering = (n) => ({
  id: `demo-rg-${String(n).padStart(4, "0")}`,
  title: `Tubim demonstrues sintetik ${n}`,
  description: "Tubim fiktiv demonstrues paqësor për testimin e rikthimit të të dhënave.",
  area: "Sheshi Sintetik",
  date: "2027-06-01",
  peaceful: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  sample: true
});

test("rikthimi: JSON i pavlefshëm, bosh ose formë e gabuar kthen klone të pavarur të farës", () => {
  for (const input of ["", null, undefined, "{gabim", "[1,2,3]", "{\"version\":1}"]) {
    const restored = restoreState(input, SEED);
    assert.deepEqual(restored, SEED);
    assert.notEqual(restored, SEED);
    assert.notEqual(restored.cases, SEED.cases);
    restored.cases.push({ id: "e-hua", title: "Objekt i huaj" });
    assert.equal(SEED.cases.length, 4);
  }
  const wrongShapes = [
    JSON.stringify({ version: 2, cases: [], initiatives: [], gatherings: [] }),
    JSON.stringify({ version: 1, cases: "jo-massiv", initiatives: [], gatherings: [] }),
    JSON.stringify({ version: 1, cases: [], gatherings: [] }),
    JSON.stringify({ cases: [], initiatives: [], gatherings: [] })
  ];
  for (const input of wrongShapes) {
    assert.deepEqual(restoreState(input, SEED), SEED);
  }
});

test("rikthimi: kufijtë 500/200/200 zbatohen para filtrimit", () => {
  const payload = {
    version: 1,
    cases: [
      ...Array.from({ length: 499 }, (_, i) => syntheticCase(i + 1)),
      null,
      ...Array.from({ length: 10 }, (_, i) => syntheticCase(1000 + i))
    ],
    initiatives: Array.from({ length: 205 }, (_, i) => syntheticInitiative(i + 1)),
    gatherings: Array.from({ length: 210 }, (_, i) => syntheticGathering(i + 1))
  };
  const restored = restoreState(JSON.stringify(payload), SEED);
  assert.equal(restored.version, 1);
  assert.equal(restored.cases.length, 499);
  assert.equal(restored.initiatives.length, 200);
  assert.equal(restored.gatherings.length, 200);
  assert.equal(restored.cases[0].id, "demo-r-0001");
  assert.equal(restored.cases[498].id, "demo-r-0499");
  assert.equal(restored.initiatives[199].id, "demo-ri-0200");
  assert.equal(restored.gatherings[199].id, "demo-rg-0200");
  assert.ok(!restored.cases.some((item) => item?.id === "demo-r-1000"));
});

test("rikthimi: regjistrat e pavlefshëm hiqen, të vlefshmit ruhen të paprekur", () => {
  const good = syntheticCase(7);
  const payload = {
    version: 1,
    cases: [
      good,
      null,
      42,
      "tekst i thjeshtë",
      { title: "pa id" },
      { id: "pa-titull" },
      { id: 123, title: "id numerik" },
      { id: "demo-r-0008", title: 999 }
    ],
    initiatives: [syntheticInitiative(1), undefined, { id: {}, title: "id objekt" }],
    gatherings: [syntheticGathering(1), [], { id: "demo-rg-0002", title: "titull" }, [1, 2]]
  };
  const restored = restoreState(JSON.stringify(payload), SEED);
  assert.deepEqual(restored.cases, [good]);
  assert.equal(restored.initiatives.length, 1);
  assert.equal(restored.initiatives[0].id, "demo-ri-0001");
  assert.equal(restored.gatherings.length, 2);
  assert.deepEqual(
    restored.gatherings.map((item) => item.id),
    ["demo-rg-0001", "demo-rg-0002"]
  );
});

test("sumarizimi: numëron saktë të hapura kundrejt të zgjidhura", () => {
  const cases = [
    { ...syntheticCase(1), status: "Raportuar" },
    { ...syntheticCase(2), status: "Në verifikim" },
    { ...syntheticCase(3), status: "Kërkesë dërguar" },
    { ...syntheticCase(4), status: "Përgjigje marrë" },
    { ...syntheticCase(5), status: "Zgjidhur" },
    { ...syntheticCase(6), status: "Zgjidhur" },
    { ...syntheticCase(7), status: "Status i panjohar demonstrues" }
  ];
  const initiatives = [syntheticInitiative(1), syntheticInitiative(2)];
  const gatherings = [syntheticGathering(1)];
  assert.deepEqual(summarize(cases, initiatives, gatherings), {
    cases: 7,
    open: 5,
    initiatives: 2,
    gatherings: 1
  });
  assert.deepEqual(summarize([], [], []), { cases: 0, open: 0, initiatives: 0, gatherings: 0 });
  assert.deepEqual(summarize([{ ...syntheticCase(9), status: "Zgjidhur" }], [], []), {
    cases: 1,
    open: 0,
    initiatives: 0,
    gatherings: 0
  });
});
