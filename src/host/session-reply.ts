/** Reads the last visible text the job session produced, so the UI can show it. */
export interface JobReply { text:string; truncated:boolean; running:boolean; reason:'idle'|'input-required'|'timeout' }
type HistoryRecord={readonly type?:string;readonly data?:unknown};
const textOf=(data:unknown):string=>{
 const message=(data as {message?:{role?:string;content?:readonly {type?:string;text?:string}[]}})?.message;
 if(!message||message.role!=='assistant')return '';
 return (message.content??[]).filter(part=>part.type==='text'&&typeof part.text==='string').map(part=>part.text as string).join('\n').trim();
};
/**
 * `records` are newest-first. Reasoning parts are dropped: only what the user can act on is shown,
 * and the newest non-empty assistant text wins so an older message never masks the latest answer.
 */
export function extractReply(records:readonly HistoryRecord[],truncated:boolean,limit=6000):{text:string;truncated:boolean}{
 for(const record of records){
  if(record.type!=='assistant/message')continue;
  const text=textOf(record.data);
  if(!text)continue;
  if(text.length<=limit)return {text,truncated};
  return {text:text.slice(0,limit),truncated:true};
 }
 return {text:'',truncated};
}
