import test from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORIES, cleanText, validateSourceUrl, validateCase, validateInitiative,
  validateGathering, filterCases, summarize, restoreState
} from "../src/domain.mjs";
import { SEED } from "../src/seed.mjs";

const now = new Date("2026-10-21T10:00:00Z");
const id = () => "test-id";
const validCase = {
  title: "Ndriçimi i rrugës së lagjes",
  description: "Ky është një raportim demonstrimi me përshkrim të mjaftueshëm për verifikim.",
  area: "Lagjja e testimit",
  category: CATEGORIES[0],
  source: "https://example.org/prove"
};

test("normalizimi nuk lejon karaktere kontrolli", () => {
  assert.equal(cleanText("  një   tekst\n prova "), "një tekst prova");
});
test("burimet lejojnë vetëm lidhje HTTPS pa kredenciale", () => {
  assert.equal(validateSourceUrl(""), "");
  assert.equal(validateSourceUrl("https://example.org/a"), "https://example.org/a");
  for (const url of ["javascript:alert(1)", "http://example.org", "https://x:y@example.org", "/relative"]) {
    assert.throws(() => validateSourceUrl(url));
  }
});
test("dosja valide merr status fillestar dhe krijohet lokalisht", () => {
  const item = validateCase(validCase, now, id);
  assert.equal(item.id, "test-id");
  assert.equal(item.status, "Raportuar");
  assert.equal(item.sample, false);
  assert.equal(item.createdAt, now.toISOString());
});
test("dosja e pavlefshme refuzohet", () => {
  assert.throws(() => validateCase({ ...validCase, title: "shkurt" }, now, id));
  assert.throws(() => validateCase({ ...validCase, category: "Pa kategori" }, now, id));
  assert.throws(() => validateCase({ ...validCase, source: "javascript:evil()" }, now, id));
});
test("nismat verifikohen para ruajtjes", () => {
  const item = validateInitiative({
    title: "Kërkesë për ndriçim publik", type: "Peticioni", area: "Lagjja Demo",
    description: "Nismë lokale demonstrimi e qytetarëve për infrastrukturë më të mirë."
  }, now, id);
  assert.equal(item.type, "Peticioni");
});
test("tubimet duhet të kenë datë të ardhshme", () => {
  const base = {
    title: "Tubim paqësor demonstrues", area: "Sheshi Demo", date: "2026-11-15",
    description: "Tubim informues demonstrues me respektimin e ligjit dhe të sigurisë publike."
  };
  assert.equal(validateGathering(base, now, id).peaceful, true);
  assert.throws(() => validateGathering({ ...base, date: "2026-01-01" }, now, id));
  assert.throws(() => validateGathering({ ...base, date: "jo-date" }, now, id));
});
test("filtrimi kërkon brenda dosjeve dhe kategorive", () => {
  assert.equal(filterCases(SEED.cases, { query: "ndricim" }).length, 1);
  assert.equal(filterCases(SEED.cases, { status: "Zgjidhur" }).length, 1);
  assert.equal(filterCases(SEED.cases, { category: "Mjedis" }).length, 1);
});
test("statistikat dhe rikthimi i të dhënave kanë fallback", () => {
  const counts = summarize(SEED.cases, SEED.initiatives, SEED.gatherings);
  assert.deepEqual(counts, { cases: 4, open: 3, initiatives: 1, gatherings: 1 });
  assert.deepEqual(restoreState("{gabim", SEED), SEED);
  assert.deepEqual(restoreState(JSON.stringify(SEED), SEED), SEED);
});
