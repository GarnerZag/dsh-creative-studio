import {z} from 'zod';
const id=z.string().min(1),value=z.union([z.string(),z.boolean()]);
const ComponentSchema=z.discriminatedUnion('kind',[
 z.object({id,kind:z.literal('text'),label:z.string()}).strict(),
 z.object({id,kind:z.literal('input'),label:z.string(),binding:id}).strict(),
 z.object({id,kind:z.literal('button'),label:z.string(),actionId:id}).strict(),
 z.object({id,kind:z.literal('list'),label:z.string(),binding:id,rows:z.array(z.string())}).strict(),
 z.object({id,kind:z.literal('notice'),label:z.string(),binding:id}).strict(),
]);
export const SceneSchema=z.object({id,title:z.string(),contentRevision:z.number().int().nonnegative(),requirementIds:z.array(id),state:z.record(id,value),components:z.array(ComponentSchema),actions:z.array(z.object({id,changes:z.array(z.object({key:id,value}).strict())}).strict()),steps:z.array(z.union([z.object({actionId:id}).strict(),z.object({componentId:id,value:z.string()}).strict()]))}).strict();
export type DemoScene=z.infer<typeof SceneSchema>;
export type DemoState=DemoScene['state'];
const forbidden=new Set(['__proto__','prototype','constructor']);
export function validateScene(input:unknown):DemoScene{
 const scene=SceneSchema.parse(input),keys=new Set(Object.keys(scene.state)),actions=new Set(scene.actions.map(a=>a.id)),components=new Set(scene.components.map(c=>c.id));
 if([...keys].some(k=>forbidden.has(k)))throw new Error('INVALID_STATE_KEY');
 if(actions.size!==scene.actions.length||components.size!==scene.components.length)throw new Error('DUPLICATE_DEMO_ID');
 for(const a of scene.actions)for(const change of a.changes){if(!keys.has(change.key))throw new Error('STATE_KEY_NOT_FOUND');if(typeof scene.state[change.key]!==typeof change.value)throw new Error('STATE_TYPE_MISMATCH');}
 for(const c of scene.components){
  if('binding'in c){if(!keys.has(c.binding))throw new Error('STATE_KEY_NOT_FOUND');if(typeof scene.state[c.binding]!== (c.kind==='notice'?'boolean':'string'))throw new Error('STATE_TYPE_MISMATCH');}
  if(c.kind==='button'&&!actions.has(c.actionId))throw new Error('ACTION_NOT_FOUND');
 }
 for(const step of scene.steps){if('actionId'in step){if(!actions.has(step.actionId))throw new Error('ACTION_NOT_FOUND');}else if(!scene.components.some(c=>c.id===step.componentId&&c.kind==='input'))throw new Error('INPUT_NOT_FOUND');}
 return scene;
}
export function runDemoAction(scene:DemoScene,state:DemoState,actionId:string):DemoState{
 const action=scene.actions.find(a=>a.id===actionId);if(!action)throw new Error('ACTION_NOT_FOUND');
 const next={...state};for(const change of action.changes)next[change.key]=change.value;return next;
}
export function visibleRows(rows:string[],query:string):string[]{return rows.filter(row=>row.toLocaleLowerCase().includes(query.toLocaleLowerCase()));}
