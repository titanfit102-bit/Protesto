import test from "node:test";
import assert from "node:assert/strict";
import { cleanText, validateSourceUrl, validateCase, validateGathering } from "../src/domain.mjs";

const now = new Date("2026-10-21T10:00:00Z");
const id = () => "test-id-extra";
const todayLocal = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");

const baseCase = {
  title: "Titull demonstrues i gjatë mjaftueshëm",
  description: "Ky është një përshkrim demonstrues sintetik i mjaftueshëm për testet e kufijve.",
  area: "Lagjja sintetike",
  category: "Infrastrukturë",
  source: ""
};

test("titulli pranon saktësisht 8 dhe 120 karaktere dhe refuzon 7 dhe 121", () => {
  assert.equal(cleanText("Titulli"), "Titulli");
  const equalMin = validateCase({ ...baseCase, title: "Rruga-9A" }, now, id);
  assert.equal(equalMin.title, "Rruga-9A");
  const exactMax = validateCase({ ...baseCase, title: "T".repeat(120) }, now, id);
  assert.equal(exactMax.title.length, 120);
  assert.throws(() => validateCase({ ...baseCase, title: "7karakt" }, now, id), /8–120/);
  assert.throws(() => validateCase({ ...baseCase, title: "T".repeat(121) }, now, id), /8–120/);
});

test("përshkrimi pranon saktësisht 25 dhe 2000 karaktere dhe refuzon 24 dhe 2001", () => {
  const equalMin = validateCase({ ...baseCase, description: "a".repeat(25) }, now, id);
  assert.equal(equalMin.description.length, 25);
  const exactMax = validateCase({ ...baseCase, description: "p".repeat(2000) }, now, id);
  assert.equal(exactMax.description.length, 2000);
  assert.throws(() => validateCase({ ...baseCase, description: "a".repeat(24) }, now, id), /25–2000/);
  assert.throws(() => validateCase({ ...baseCase, description: "p".repeat(2001) }, now, id), /25–2000/);
});

test("lidhjet HTTPS me kredenciale refuzohen dhe lidhja valide normalizohet", () => {
  assert.throws(() => validateSourceUrl("https://përdorues@example.org/fajll"), /HTTPS/);
  assert.throws(() => validateSourceUrl("https://përdorues:fjalëkalim-fiktiv@example.org/fajll"), /HTTPS/);
  assert.throws(() => validateSourceUrl("https://example.org@stërvitje.example/fajll"), /HTTPS/);
  assert.equal(validateSourceUrl("HTTPS://EXAMPLE.ORG/Rruga?faqe=1"), "https://example.org/Rruga?faqe=1");
});

test("dita e brishtë e shkutit pranohet vetëm në vite të brishtë të ardhshme", () => {
  const gatheringTitle = "Tubim demonstrues sintetik";
  const base = {
    title: gatheringTitle,
    description: "Tubim sintetik demonstrues për verifikimin e kufijve të datës, pa përdorues realë.",
    area: "Sheshi sintetik",
    date: "2028-02-29"
  };
  const valid = validateGathering(base, now, id);
  assert.equal(valid.date, "2028-02-29");
  assert.equal(valid.peaceful, true);
  const pastLeap = validateGathering.bind(null, { ...base, date: "2024-02-29" }, now, id);
  assert.throws(pastLeap, /kaluarën/);
  assert.throws(() => validateGathering({ ...base, date: "2027-02-29" }, now, id), /datë të vlefshme/);
});

test("data e kaluar refuzohet, dita e tanishme lokale pranohet", () => {
  const base = {
    title: "Tubim për kufirin e datës",
    description: "Të dhëna sintetike demonstruese për verifikimin e datave të kaluara dhe të sotme.",
    area: "Sheshi i datave"
  };
  assert.throws(() => validateGathering({ ...base, date: "2025-12-31" }, now, id), /kaluarën/);
  const sameDay = validateGathering({ ...base, date: todayLocal }, now, id);
  assert.equal(sameDay.date, todayLocal);
});

test("pastrimi i tekstit heq karakteret e kontrollit dhe refuzon jo-stringje", () => {
  const withControl = "  a\tb\nc  ";
  assert.equal(cleanText(withControl), "a b c");
  assert.equal(cleanText(12345), "");
  assert.equal(cleanText(null), "");
});
