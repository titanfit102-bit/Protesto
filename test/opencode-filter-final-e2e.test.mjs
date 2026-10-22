import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, CASE_STATUSES, filterCases } from "../src/domain.mjs";

const MJE = CATEGORIES[3];
const ARS = CATEGORIES[1];
const RAP = CASE_STATUSES[0];
const ZGJ = CASE_STATUSES[4];

const T = {
  d1: "2026-10-01T08:00:00.000Z",
  d2: "2026-10-02T08:30:00.000Z",
  d3: "2026-10-02T09:15:00.000Z",
  d4: "2026-10-03T21:45:00.000Z"
};

function demo(id, overrides = {}) {
  return {
    id,
    title: "Dosje demonstruese sintetike",
    description: "Përshkrim demonstrues pa të dhëna reale as njerëz të identifikueshëm.",
    area: "Zona Sinteze",
    category: CATEGORIES[5],
    status: RAP,
    source: "",
    createdAt: T.d1,
    sample: true,
    ...overrides
  };
}

const ids = (list) => list.map((item) => item.id);

test("kërkimi është i pandjeshëm ndaj zararit të shkronjave dhe huqeve", () => {
  const drita = demo("s-01", {
    title: "Ndriçimi i Sheshit Demonstrues",
    area: "Zona Gjatë",
    description: "Raport sintetik për disa shtylla drite pa të dhëna reale."
  });
  const uji = demo("s-02", {
    title: "Uji i Pastër për Lagjen",
    createdAt: T.d2,
    description: "Shembull fiktiv për kontrollin e çezmave në zonë."
  });
  const records = [drita, uji];
  assert.deepEqual(ids(filterCases(records, { query: "NDRICIM" })), ["s-01"]);
  assert.deepEqual(ids(filterCases(records, { query: "ndriçim" })), ["s-01"]);
  assert.deepEqual(ids(filterCases(records, { query: "SHESHIT" })), ["s-01"]);
  assert.deepEqual(ids(filterCases(records, { query: "gjate" })), ["s-01"]);
  assert.deepEqual(ids(filterCases(records, { query: "  pastër  " })), ["s-02"]);
  assert.deepEqual(ids(filterCases([drita], { query: "ZONA" })), ["s-01"]);
  assert.deepEqual(ids(filterCases([uji], { query: "ZONA" })), ["s-02"]);
  assert.deepEqual(filterCases(records, { query: "gjembvlera" }), []);
});

test("filtrimi i kombinuar kategoria/status/pyetja përkon vetëm në mospërputhje të plota", () => {
  const lumiA = demo("c-01", {
    title: "Lumi i vogël sintetik",
    category: MJE,
    status: RAP,
    createdAt: T.d3,
    description: "Shembull fiktiv pranë një lumi demonstrues pa vend real."
  });
  const lumiB = demo("c-02", {
    title: "Lumi i thatë i zonës sinteze",
    category: MJE,
    status: ZGJ,
    createdAt: T.d2,
    description: "Dosje fiktive mbyllur pas një verifikimi hipotetik."
  });
  const klasa = demo("c-03", {
    title: "Lëndorja e klasës sintetike",
    category: ARS,
    status: RAP,
    createdAt: T.d1,
    description: "Rregjistrim demo për inventarin e një klase imagjinare."
  });
  const records = [lumiA, lumiB, klasa];
  assert.deepEqual(ids(filterCases(records, { query: "LUM", category: MJE, status: RAP })), ["c-01"]);
  assert.deepEqual(ids(filterCases(records, { query: "lënda", category: MJE, status: RAP })), []);
  assert.deepEqual(ids(filterCases(records, { category: MJE })), ["c-01", "c-02"]);
  assert.deepEqual(ids(filterCases(records, { status: ZGJ })), ["c-02"]);
  assert.deepEqual(ids(filterCases(records, { query: "KLASE", category: ARS, status: RAP })), ["c-03"]);
  assert.deepEqual(ids(filterCases(records, { query: "lum", category: ARS, status: ZGJ })), []);
});

test("rendi zbritas sipas createdAt kthehet mbi një array të ri", () => {
  const mix = [
    demo("o-02", { createdAt: T.d2 }),
    demo("o-04", { createdAt: T.d4 }),
    demo("o-01", { createdAt: T.d1 }),
    demo("o-03", { createdAt: T.d3 })
  ];
  const ordered = filterCases(mix);
  assert.deepEqual(ids(ordered), ["o-04", "o-03", "o-02", "o-01"]);
  assert.notEqual(ordered, mix);
  const replica = filterCases(mix, {});
  assert.deepEqual(ids(replica), ["o-04", "o-03", "o-02", "o-01"]);
  assert.notEqual(replica, ordered);
  assert.equal(ordered[0], mix[1]);
  assert.equal(filterCases(mix, { query: "" }).length, 4);
});

test("filtrimi nuk e muton array-in hyrës as rekordet", () => {
  const records = [
    demo("o-02", { createdAt: T.d2, status: ZGJ }),
    demo("o-04", { createdAt: T.d4, title: "Ndriçim fiktiv i rrugës" }),
    demo("o-01", { createdAt: T.d1, category: MJE }),
    demo("o-03", { createdAt: T.d3, title: "Uji i pastër i demo-s" })
  ];
  const before = structuredClone(records);
  const origOrder = ids(records);
  filterCases(records, { query: "  NDRIÇIM  " });
  filterCases(records, { query: "uji", category: MJE });
  filterCases(records, { status: ZGJ, query: "dosje" });
  filterCases(records, { query: "PASTËR", status: RAP });
  filterCases(records);
  assert.deepEqual(records, before);
  assert.deepEqual(ids(records), origOrder);
  const first = filterCases(records, { query: "ndricim" });
  const second = filterCases(records, { query: "ndricim" });
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  const empty = filterCases(records, { query: "asgjëkëndkurrë" });
  assert.deepEqual(empty, []);
  assert.notEqual(empty, records);
});
