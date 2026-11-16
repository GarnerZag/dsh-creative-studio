/** Reads the last visible text the job session produced, so the UI can show it. */
export interface JobReply { text:string; truncated:boolean; running:boolean; reason:'idle'|'input-required'|'timeout'; records?:number }
type Unknown={[key:string]:unknown};
const isObject=(value:unknown):value is Unknown=>typeof value==='object'&&value!==null&&!Array.isArray(value);

/** Text parts of one Assistant message, or '' when this value is not one. */
const textOfMessage=(value:unknown):string=>{
 if(!isObject(value))return '';
 const message=value.message;
 if(!isObject(message)||message.role!=='assistant')return '';
 const content=Array.isArray(message.content)?message.content:[];
 return content.filter(part=>isObject(part)&&part.type==='text'&&typeof part.text==='string')
  .map(part=>(part as Unknown).text as string).join('\n').trim();
};
/**
 * Walks a history record and finds Assistant text without depending on the exact envelope
 * (records can arrive as the raw event, as `{type:'event', event}`, or nested further) or on
 * the event's own `type`/`stype` field name. Reasoning parts are ignored.
 */
const scan=(value:unknown,depth:number,state:{text:string;seq:number|undefined},inherited:number|undefined):void=>{
 if(depth>6||!isObject(value))return;
 const own=typeof value.seq==='number'?value.seq:inherited;
 const text=textOfMessage(value);
 if(text){const better=own!==undefined?(state.seq===undefined||own>=state.seq):state.seq===undefined;if(better){state.text=text;if(own!==undefined)state.seq=own;}}
 for(const child of Object.values(value)){
  if(isObject(child)||Array.isArray(child))scan(child,depth+1,state,own);
 }
};
/**
 * Record order is not assumed: the highest `seq` with visible Assistant text wins, so a history
 * page that arrives chronologically and one that arrives newest-first both resolve to the latest
 * answer when every record carries a seq.
 */
export function extractReply(records:readonly unknown[],truncated:boolean,limit=6000):{text:string;truncated:boolean}{
 const state:{text:string;seq:number|undefined}={text:'',seq:undefined};
 for(const record of records)scan(record,0,state,undefined);
 if(!state.text)return {text:'',truncated};
 if(state.text.length<=limit)return {text:state.text,truncated};
 return {text:state.text.slice(0,limit),truncated:true};
}
