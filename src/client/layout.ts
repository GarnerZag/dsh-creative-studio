export interface LayoutPreference {compare:boolean;split:number}
export function parseLayout(raw:string|null):LayoutPreference{
 const fallback={compare:false,split:50};
 try{const value:unknown=JSON.parse(raw??'null');if(!value||typeof value!=='object'||Array.isArray(value))return fallback;
 const v=value as Record<string,unknown>;return {compare:v.compare===true,split:typeof v.split==='number'&&Number.isFinite(v.split)?Math.max(30,Math.min(70,v.split)):50};
 }catch{return fallback;}
}
