import * as React from 'react';

// Turn raw parser/schema output into something a Chinese-speaking PM can act on.
function describeSceneError(error:unknown,t:(key:string)=>string):string{
 const raw=error instanceof Error?error.message:String(error);
 if(raw.includes('REQUIREMENT_NOT_FOUND'))return t('demoRequirementMissing');
 if(error instanceof SyntaxError)return t('demoJsonInvalid');
 if(raw.trim().startsWith('[')){
  try{const first=(JSON.parse(raw) as {path?:unknown[]}[])[0];const path=Array.isArray(first?.path)?first.path.join('.'):'';return `${t('demoSchemaInvalid')}${path?`（${path}）`:''}`;}catch{return t('demoSchemaInvalid');}
 }
 return raw;
}
import {demoDocument} from '../domain/demo-document.js';
import {validateScene,type DemoScene} from '../domain/demo.js';
import type {ProjectSnapshot} from '../types.js';
function Viewport({scene,width,height,replay}:{scene:DemoScene;width:number;height:number;replay:number}):React.ReactElement{
 const host=React.useRef<HTMLDivElement>(null);const [available,setAvailable]=React.useState(400);
 React.useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(entries=>{setAvailable(entries[0]?.contentRect.width??400);});observer.observe(host.current);return()=>observer.disconnect();},[]);
 const html=React.useMemo(()=>demoDocument(scene,Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('')),[scene]);
 const scale=Math.min(1,available/width);
 return <div ref={host} style={{minWidth:0,width:'100%'}}><small>{width} × {height} CSS px</small><div style={{height:height*scale,overflow:'hidden',border:'1px solid var(--cs-border)',borderRadius:8}}><iframe key={`${scene.title}-${width}-${replay}`} title={`${scene.title} ${width}`} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={html} style={{width,height,border:0,transform:`scale(${scale})`,transformOrigin:'top left'}}/></div></div>;
}
export function CandidateDemo({scene,t}:{scene:DemoScene;t:(key:string)=>string}):React.ReactElement{const [open,setOpen]=React.useState(false);return <section><button type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{t('candidateDemo')}</button>{open&&<><p>{t('candidateDemoNotice')}</p><div style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)',gap:8}}><Viewport scene={scene} width={1440} height={900} replay={0}/><Viewport scene={scene} width={390} height={844} replay={0}/></div></>}</section>;}
export function DemoPanel({project,t,stacked=false,busy,save,selectedRequirement}:{selectedRequirement?:string|null;project:ProjectSnapshot;t:(key:string)=>string;stacked?:boolean;busy:boolean;save:(scene:DemoScene)=>void}):React.ReactElement{
 const [mode,setMode]=React.useState<'desktop'|'mobile'|'both'>('both');
 const [replay,setReplay]=React.useState(0);const [custom,setCustom]=React.useState<DemoScene>();const [input,setInput]=React.useState(''),[error,setError]=React.useState('');
 const [autoPlayed,setAutoPlayed]=React.useState(false);const lastRevision=React.useRef(project.contentRevision);
 // Replaying on content changes turns "add a requirement" into visible behaviour instead of a silent save.
 React.useEffect(()=>{if(project.contentRevision===lastRevision.current)return;lastRevision.current=project.contentRevision;setReplay(v=>v+1);setAutoPlayed(true);const timer=setTimeout(()=>setAutoPlayed(false),4000);return()=>clearTimeout(timer);},[project.contentRevision]);
 const sample=React.useMemo(()=>validateScene({id:'template-list',title:project.name,contentRevision:project.contentRevision,requirementIds:[],state:{query:'',notice:false},components:[{id:'search',kind:'input',label:t('demoSearch'),binding:'query'},{id:'results',kind:'list',label:t('demoItems'),binding:'query',rows:project.nodes.length?project.nodes.map(n=>n.title):[t('demoSample')]},{id:'show',kind:'button',label:t('demoShow'),actionId:'show'},{id:'notice',kind:'notice',label:t('demoMock'),binding:'notice'}],actions:[{id:'show',changes:[{key:'notice',value:true}]}],steps:[{componentId:'search',value:project.nodes[0]?.title??''},{actionId:'show'}]}),[project.name,project.nodes,project.contentRevision,t]);
 const scene=custom??project.demo??sample;
  const selected=project.nodes.find(n=>n.id===selectedRequirement);
 return <section><h3>{t('demoTitle')}</h3><p>{custom||project.demo?t('demoCustom'):t('demoTemplateNotice')}</p><button disabled={busy||scene.contentRevision!==project.contentRevision} onClick={()=>save(scene)}>{t('demoSave')}</button>{scene.contentRevision!==project.contentRevision&&<p role="status">{t('demoStale')}</p>}
 {selected&&<aside aria-label={t('selectedDemoCoverage')}><strong>{selected.title}</strong><p>{t(scene.requirementIds.includes(selected.id)?'selectedDemoMapped':'selectedDemoUnmapped')}</p><small>{t('selectedDemoCaution')}</small></aside>}
  {autoPlayed&&<p role="status" className="cs-hint">{t('demoAutoReplay')}</p>}
 <div className="cs-demo-controls"><label>{t('demoViewport')}<select value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="both">{t('demoBoth')}</option><option value="desktop">{t('demoDesktop')}</option><option value="mobile">{t('demoMobile')}</option></select></label><button type="button" title={t('demoReplayHint')} onClick={()=>setReplay(v=>v+1)}>{t('demoReplay')}</button></div>
 <div style={{display:'grid',gridTemplateColumns:mode==='both'&&!stacked?'minmax(0,2fr) minmax(0,1fr)':'minmax(0,1fr)',gap:12}}>{mode!=='mobile'&&<Viewport scene={scene} width={1440} height={900} replay={replay}/>} {mode!=='desktop'&&<Viewport scene={scene} width={390} height={844} replay={replay}/>}</div>
 <details><summary>{t('demoSceneEditor')}</summary><p>{t('demoLocalOnly')}</p><label className="cs-field"><span>{t('demoSceneEditor')}</span><textarea aria-label={t('demoSceneEditor')} rows={10} style={{width:'100%'}} value={input} onChange={e=>setInput(e.target.value)}/></label><button onClick={()=>{try{const next=validateScene(JSON.parse(input));if(next.requirementIds.some(id=>!project.nodes.some(n=>n.id===id)))throw new Error('REQUIREMENT_NOT_FOUND');setCustom(next);setError('');}catch(e){setError(describeSceneError(e,t));}}}>{t('demoApply')}</button><button onClick={()=>{setInput(JSON.stringify(scene,null,2));}}>{t('demoLoad')}</button><button onClick={()=>{setCustom(undefined);setError('');}}>{t('demoReset')}</button>{error&&<p role="alert" className="cs-error">{error}</p>}</details>
 </section>;
}
