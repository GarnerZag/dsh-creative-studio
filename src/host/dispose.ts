export type Cleanup=()=>unknown;
/** Release every acquired resource, even when a later registration fails. */
export async function disposeAll(stack:Cleanup[]):Promise<void>{
 const errors:unknown[]=[];
 for(const dispose of stack.splice(0).reverse())try{await dispose();}catch(error){errors.push(error);}
 if(errors.length)throw new AggregateError(errors,'Creative Studio resource cleanup failed');
}
