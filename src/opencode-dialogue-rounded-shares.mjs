/** Finalized dialogue counts only; no inference about the population. */
const DISCLAIMER = 'Përgjigje vullnetare, jo sondazh përfaqësues i popullsisë.';
const KEYS = ['agree_count','disagree_count','pass_count'];
function validate(counts){
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) throw new TypeError('Aggregate counts are required');
  const values = KEYS.map(key => counts[key]);
  if (values.some(value => !Number.isSafeInteger(value) || value < 0)) throw new RangeError('Counts must be nonnegative safe integers');
  const total = values.reduce((sum, n) => sum + n, 0);
  if (!Number.isSafeInteger(total) || total < 10) throw new RangeError('At least ten responses required');
  if (counts.participants !== undefined && counts.participants !== total) throw new RangeError('Participant count disagrees with choices');
  return {values,total};
}
/** Largest remainder method with agree/disagree/pass as fixed tie order. */
export function roundedDialogueShares(counts){
  const {values,total} = validate(counts);
  const exact = values.map(value => value * 100 / total);
  const floors = exact.map(Math.floor);
  const missing = 100 - floors.reduce((sum,x) => sum + x, 0);
  const priority = [0,1,2].sort((a,b) => (exact[b]-floors[b])-(exact[a]-floors[a]) || a-b);
  for(let i=0;i<missing;i++)floors[priority[i]]++;
  return {participants:total,agree_percent:floors[0],disagree_percent:floors[1],pass_percent:floors[2],disclaimer:DISCLAIMER};
}
export const dialogueSharesDisclaimer = DISCLAIMER;
