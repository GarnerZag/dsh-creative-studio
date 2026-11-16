/** Reads the last visible text the job session produced, so the UI can show it. */
export interface JobReply { text:string; truncated:boolean; running:boolean; reason:'idle'|'input-required'|'timeout' }
type HistoryRecord={readonly type?:string;readonly data?:unknown};
const textOf=(data:unknown):string=>{
 const message=(data as {message?:{role?:string;content?:readonly {type?:string;text?:string}[]}})?.message;
 if(!message||message.role!=='assistant')return '';
 return (message.content??[]).filter(part=>part.type==='text'&&typeof part.text==='string').map(part=>part.text as string).join('\n').trim();
};
/**
 * Record order is not assumed: the highest `seq` with visible assistant text wins, so a history page
 * that arrives chronologically and a wait output that arrives newest-first both resolve to the latest
 * answer. Reasoning parts are dropped; only text the user can act on is shown.
 */
export function extractReply(records:readonly HistoryRecord[],truncated:boolean,limit=6000):{text:string;truncated:boolean}{
 let best='',bestSeq=-Infinity;
 for(const record of records){
  if(record.type!=='assistant/message')continue;
  const text=textOf(record.data);
  if(!text)continue;
  const seq=typeof (record as {seq?:number}).seq==='number'?(record as {seq:number}).seq:bestSeq+1;
  if(seq>=bestSeq){best=text;bestSeq=seq;}
 }
 if(!best)return {text:'',truncated};
 if(best.length<=limit)return {text:best,truncated};
 return {text:best.slice(0,limit),truncated:true};
}
