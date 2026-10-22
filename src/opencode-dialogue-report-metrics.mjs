export const DIALOGUE_METRICS_MIN_PARTICIPANTS = 10;

export const DIALOGUE_METRICS_DISCLAIMER =
  "Shumat janë përshkrime të pjesëmarrjes vullnetare vetë-selektuese në këtë pilot privat: nuk janë anketë e përfaqshueshme popullore, konsensus i verifikuar apo mandat qytetar; nuk nxirren individë, identitete, grupe demografike apo profile politike.";

function assertSafeNonNegative(value, label) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(label + " duhet të jetë numër i plotë jonegativ brenda limitit të sigurt.");
  }
  return value;
}

function readValidatedCounts(item) {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    throw new Error("Çdo element i raportit duhet të jetë objekt agregimi.");
  }
  const participants = assertSafeNonNegative(item.participants, "Pjesëmarrja");
  const agreeCount = assertSafeNonNegative(item.agree_count, "Numri i pajtimeve");
  const disagreeCount = assertSafeNonNegative(item.disagree_count, "Numri i kundërshtimeve");
  const passCount = assertSafeNonNegative(item.pass_count, "Numri i kalimeve");
  if (BigInt(agreeCount) + BigInt(disagreeCount) + BigInt(passCount) !== BigInt(participants)) {
    throw new Error("Shuma e pajtimeve, kundërshtimeve dhe kalimeve nuk përputhet me pjesëmarrjen.");
  }
  return { participants, agreeCount, disagreeCount, passCount };
}

function sharePercent(count, participants) {
  return Math.round((count / participants) * 100);
}

function buildStatement(counts) {
  return Object.freeze({
    participants: counts.participants,
    agree_count: counts.agreeCount,
    disagree_count: counts.disagreeCount,
    pass_count: counts.passCount,
    agree_share: sharePercent(counts.agreeCount, counts.participants),
    disagree_share: sharePercent(counts.disagreeCount, counts.participants),
    pass_share: sharePercent(counts.passCount, counts.participants)
  });
}

export function validateDialogueAggregate(item) {
  const counts = readValidatedCounts(item);
  if (counts.participants < DIALOGUE_METRICS_MIN_PARTICIPANTS) {
    throw new Error("Teza pa pragun minimal të pjesëmarrjes nuk lejohet në raport.");
  }
  return buildStatement(counts);
}

export function summarizeDialogueReport(items) {
  if (!Array.isArray(items)) {
    throw new Error("Raporti i dialogut duhet të jetë listë elementesh agregimi.");
  }
  const entries = [];
  let suppressed = 0;
  for (const item of items) {
    const counts = readValidatedCounts(item);
    if (counts.participants < DIALOGUE_METRICS_MIN_PARTICIPANTS) {
      suppressed += 1;
      continue;
    }
    entries.push({ statement: buildStatement(counts), originalIndex: entries.length });
  }
  entries.sort((a, b) => (b.statement.participants - a.statement.participants) || (a.originalIndex - b.originalIndex));
  return Object.freeze({
    format: "protesto-dialogue-aggregates/1",
    representative: false,
    disclaimer: DIALOGUE_METRICS_DISCLAIMER,
    statements: entries.map((entry) => entry.statement),
    included: entries.length,
    suppressed
  });
}
