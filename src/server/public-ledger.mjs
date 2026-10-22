// Only previously published cases are selected by the API SQL query.
// This module enforces the public wire format; it does not prove truth or
// authorize disclosure of private moderation records.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_TYPES = new Set(["published", "archived"]);
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/i;
const ORDER = {archived:0, published:1};

function timestamp(value) {
  if (!(value instanceof Date) && (typeof value !== "string" || !TIMESTAMP.test(value))) {
    throw new TypeError("Public ledger timestamp must include a timezone");
  }
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError("Invalid public ledger timestamp");
  return date.toISOString();
}

export function publicLedgerEvents(rows) {
  if (!Array.isArray(rows)) throw new TypeError("Public ledger requires an array");
  const unique = new Set(), events = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw) ||
        typeof raw.case_id !== "string" || !UUID.test(raw.case_id) ||
        !EVENT_TYPES.has(raw.event_type)) {
      throw new TypeError("Invalid public ledger event");
    }
    const created_at = timestamp(raw.created_at);
    const case_id = raw.case_id.toLowerCase();
    const event_type = raw.event_type;
    const key = case_id + "|" + event_type + "|" + created_at;
    if (unique.has(key)) continue;
    unique.add(key);
    // Strict field allowlist: no author, reviewer, evidence, notes or private IDs.
    events.push({case_id, event_type, created_at});
  }
  return events.sort((a,b) => b.created_at.localeCompare(a.created_at) ||
    a.case_id.localeCompare(b.case_id) || ORDER[a.event_type] - ORDER[b.event_type]);
}
