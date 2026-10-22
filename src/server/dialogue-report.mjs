// Privacy-preserving public projection of finalized dialogue aggregates.
// Intentionally does not import experimental, unmerged OpenCode modules.
export const MIN_PUBLIC_DIALOGUE_PARTICIPANTS = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CHOICES = ["agree_count", "disagree_count", "pass_count"];

function nonNegativeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(name + " must be a nonnegative safe integer");
  }
  return value;
}

function validatedCounts(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TypeError("Aggregate row must be an object");
  }
  const participants = nonNegativeInteger(raw.participants, "participants");
  const counts = CHOICES.map(key => nonNegativeInteger(raw[key], key));
  if (counts.reduce((total, value) => total + BigInt(value), 0n) !== BigInt(participants)) {
    throw new RangeError("Aggregate counts must equal participants");
  }
  return {participants, counts};
}

// Largest-remainder percentages: deterministic ties (agree, disagree, pass)
// and exactly 100%, even for thirds and other nonterminating fractions.
export function roundedDialogueShares(raw) {
  const {participants, counts} = validatedCounts(raw);
  if (participants < MIN_PUBLIC_DIALOGUE_PARTICIPANTS) {
    throw new RangeError("Aggregate is below the public privacy threshold");
  }
  const exact = counts.map(count => count * 100 / participants);
  const rounded = exact.map(Math.floor);
  const remaining = 100 - rounded.reduce((sum, value) => sum + value, 0);
  const priority = [0, 1, 2].sort((a, b) =>
    (exact[b] - rounded[b]) - (exact[a] - rounded[a]) || a - b
  );
  for (let i = 0; i < remaining; i++) rounded[priority[i]]++;
  return {agree_percent:rounded[0], disagree_percent:rounded[1], pass_percent:rounded[2]};
}

function publicText(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError("Invalid public text: " + name);
  }
  return value;
}

function safePublicSource(value) {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password ? value : null;
  } catch {
    return null;
  }
}

export function publicDialogueReportItems(rows) {
  if (!Array.isArray(rows)) throw new TypeError("Aggregate rows must be an array");
  const items = [];
  for (const raw of rows) {
    const {participants, counts} = validatedCounts(raw);
    // Validate even suppressed rows, but never release a low-volume aggregate.
    if (participants < MIN_PUBLIC_DIALOGUE_PARTICIPANTS) continue;
    if (![raw.topic_id, raw.statement_id, raw.case_id].every(id => typeof id === "string" && UUID.test(id))) {
      throw new TypeError("Invalid public aggregate identifiers");
    }
    if (!(raw.closed_at instanceof Date) && (typeof raw.closed_at !== "string" || !Number.isFinite(Date.parse(raw.closed_at)))) {
      throw new TypeError("Finalized topic timestamp missing");
    }
    const closedAt = raw.closed_at instanceof Date ? raw.closed_at.toISOString() : raw.closed_at;
    const [agree_count, disagree_count, pass_count] = counts;
    // Strict allowlist. No reporter, reviewer, email, voter key, consent, or vote rows.
    items.push({
      topic_id:raw.topic_id,
      case_id:raw.case_id,
      topic_title:publicText(raw.topic_title, "topic_title"),
      statement_id:raw.statement_id,
      statement:publicText(raw.statement, "statement"),
      participants,
      agree_count, disagree_count, pass_count,
      ...roundedDialogueShares(raw),
      closed_at:closedAt,
      case_title:publicText(raw.case_title, "case_title"),
      source_url:safePublicSource(raw.source_url)
    });
  }
  return items;
}
