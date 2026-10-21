export const CATEGORIES = Object.freeze([
  "Infrastrukturë", "Arsim", "Shëndetësi", "Mjedis", "Shërbime publike", "Tjetër"
]);

export const CASE_STATUSES = Object.freeze([
  "Raportuar", "Në verifikim", "Kërkesë dërguar", "Përgjigje marrë", "Zgjidhur"
]);

export const INITIATIVE_TYPES = Object.freeze([
  "Peticioni", "Kërkesë publike", "Diskutim komunitar"
]);

export function cleanText(value, maxLength = 2000) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function validateSourceUrl(value) {
  const input = cleanText(value, 2048);
  if (!input) return "";
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
      throw new Error("Lidhja duhet të jetë HTTPS dhe pa kredenciale.");
    }
    return url.toString();
  } catch {
    throw new Error("Jep një lidhje të vlefshme HTTPS ose lëre bosh.");
  }
}

export function validateCase(input, now = new Date(), idFactory = () => crypto.randomUUID()) {
  const title = cleanText(input.title, 121);
  const description = cleanText(input.description, 2001);
  const area = cleanText(input.area, 81);
  const category = cleanText(input.category, 60);
  const source = validateSourceUrl(input.source);
  if (title.length < 8 || title.length > 120) throw new Error("Titulli duhet të jetë 8–120 karaktere.");
  if (description.length < 25 || description.length > 2000) throw new Error("Përshkrimi duhet të jetë 25–2000 karaktere.");
  if (area.length < 2 || area.length > 80) throw new Error("Vendndodhja duhet të jetë 2–80 karaktere.");
  if (!CATEGORIES.includes(category)) throw new Error("Kategoria nuk është e vlefshme.");
  return {
    id: idFactory(), title, description, area, category, source,
    status: "Raportuar", createdAt: now.toISOString(), sample: false
  };
}

export function validateInitiative(input, now = new Date(), idFactory = () => crypto.randomUUID()) {
  const title = cleanText(input.title, 121);
  const description = cleanText(input.description, 2001);
  const type = cleanText(input.type, 60);
  const area = cleanText(input.area, 81);
  if (title.length < 8 || title.length > 120) throw new Error("Titulli duhet të jetë 8–120 karaktere.");
  if (description.length < 25 || description.length > 2000) throw new Error("Përshkrimi duhet të jetë 25–2000 karaktere.");
  if (!INITIATIVE_TYPES.includes(type)) throw new Error("Zgjidh llojin e nismës.");
  if (area.length < 2 || area.length > 80) throw new Error("Vendndodhja duhet të jetë 2–80 karaktere.");
  return { id: idFactory(), title, description, type, area, createdAt: now.toISOString(), sample: false };
}

export function validateGathering(input, now = new Date(), idFactory = () => crypto.randomUUID()) {
  const title = cleanText(input.title, 121);
  const description = cleanText(input.description, 2001);
  const area = cleanText(input.area, 121);
  const date = cleanText(input.date, 10);
  if (title.length < 8 || title.length > 120) throw new Error("Titulli duhet të jetë 8–120 karaktere.");
  if (description.length < 25 || description.length > 2000) throw new Error("Përshkrimi duhet të jetë 25–2000 karaktere.");
  if (area.length < 3 || area.length > 120) throw new Error("Vendndodhja duhet të jetë 3–120 karaktere.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + "T12:00:00Z")) || new Date(date + "T12:00:00Z").toISOString().slice(0, 10) !== date) {
    throw new Error("Zgjidh një datë të vlefshme.");
  }
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  if (date < today) throw new Error("Data nuk mund të jetë në të kaluarën.");
  return { id: idFactory(), title, description, area, date, peaceful: true, createdAt: now.toISOString(), sample: false };
}

function fold(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("sq");
}

export function filterCases(cases, { query = "", category = "all", status = "all" } = {}) {
  const needle = fold(query.trim());
  return cases.filter((record) => {
    if (category !== "all" && record.category !== category) return false;
    if (status !== "all" && record.status !== status) return false;
    return !needle || fold([record.title, record.description, record.area, record.category].join(" ")).includes(needle);
  }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function summarize(cases, initiatives, gatherings) {
  return {
    cases: cases.length,
    open: cases.filter((item) => item.status !== "Zgjidhur").length,
    initiatives: initiatives.length,
    gatherings: gatherings.length
  };
}

export function restoreState(storageValue, fallback) {
  if (!storageValue) return structuredClone(fallback);
  try {
    const data = JSON.parse(storageValue);
    if (data?.version !== 1 || !Array.isArray(data.cases) ||
      !Array.isArray(data.initiatives) || !Array.isArray(data.gatherings)) {
      return structuredClone(fallback);
    }
    return {
      version: 1,
      cases: data.cases.slice(0, 500).filter((x) => x && typeof x.id === "string" && typeof x.title === "string"),
      initiatives: data.initiatives.slice(0, 200).filter((x) => x && typeof x.id === "string" && typeof x.title === "string"),
      gatherings: data.gatherings.slice(0, 200).filter((x) => x && typeof x.id === "string" && typeof x.title === "string")
    };
  } catch {
    return structuredClone(fallback);
  }
}
