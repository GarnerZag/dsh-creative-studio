export interface EditorState<T extends Record<string,string>> {id:string|null;base:T;values:T;conflicts:(keyof T)[]}
export function openEditor<T extends Record<string,string>>(id:string|null,values:T):EditorState<T>{return {id,base:{...values},values:{...values},conflicts:[]};}
/** Rebase only untouched fields. Conflicting dirty fields stay visible and cannot silently save. */
export function refreshEditor<T extends Record<string,string>>(current:EditorState<T>,id:string|null,next:T):EditorState<T>{
 if(current.id!==id)return openEditor(id,next);
 const values={...current.values},conflicts=new Set(current.conflicts);
 for(const key of Object.keys(next) as (keyof T)[]){
  if(current.values[key]===current.base[key]){values[key]=next[key];conflicts.delete(key);}
  else if(current.values[key]===next[key])conflicts.delete(key);
  else if(next[key]!==current.base[key])conflicts.add(key);
 }
 return {id,base:{...next},values,conflicts:[...conflicts]};
}
export function editorDirty<T extends Record<string,string>>(editor:EditorState<T>):boolean{return Object.keys(editor.values).some(key=>editor.values[key]!==editor.base[key]);}
