/** Restrictive adapter for already finalized public counts; never accepts raw ballots. */
const DISCLAIMER='Rezultate vullnetare nga pjesëmarrësit në platformë; jo sondazh përfaqësues.';
const UUID=/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
const counts=['participants','agree_count','disagree_count','pass_count'];
export function adaptPublicDialogueRows(rows){
 if(!Array.isArray(rows))throw new TypeError('Rows must be an array');
 const items=[];
 for(const raw of rows){
  if(!raw || typeof raw!=='object' || Array.isArray(raw))throw new TypeError('Invalid aggregate row');
  if(counts.some(key=>!Number.isSafeInteger(raw[key])||raw[key]<0))throw new RangeError('Invalid counts');
  const sum=raw.agree_count+raw.disagree_count+raw.pass_count;
  if(!Number.isSafeInteger(sum)||sum!==raw.participants)throw new RangeError('Inconsistent aggregate counts');
  if(raw.participants<10)continue;
  if(!UUID.test(raw.topic_id)||!UUID.test(raw.statement_id)||typeof raw.statement!=='string'||!raw.statement.trim()||raw.statement.length>360)throw new TypeError('Invalid public statement metadata');
  const {topic_id,statement_id,statement,participants,agree_count,disagree_count,pass_count}=raw;
  items.push({topic_id,statement_id,statement,participants,agree_count,disagree_count,pass_count});
 }
 return {items,disclaimer:DISCLAIMER};
}
