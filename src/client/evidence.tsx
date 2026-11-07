import * as React from 'react';
import type {ResearchEvidencePage} from '../types.js';
export function EvidenceView({read,t}:{read:(offset:number)=>Promise<ResearchEvidencePage>;t:(key:string)=>string}):React.ReactElement{
 const [page,setPage]=React.useState<ResearchEvidencePage>(),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
 const live=React.useRef(true);React.useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 const load=async(offset:number)=>{setBusy(true);setError('');try{const value=await read(offset);if(live.current)setPage(value);}catch(e){if(live.current)setError(String(e));}finally{if(live.current)setBusy(false);}};
 return <div><button disabled={busy} onClick={()=>void load(0)}>{t('evidenceOpen')}</button>{page?.nextOffset!=null&&<button disabled={busy} onClick={()=>void load(page.nextOffset!)}>{t('evidenceNext')}</button>}{error&&<p role="alert">{error}</p>}{page&&<><small>{t('evidenceRawNotice')} · {page.total}</small><pre style={{maxHeight:320,overflow:'auto',whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{page.text}</pre></>}</div>;
}
