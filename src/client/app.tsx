import * as React from 'react';
import { ProjectWorkspace, type ProjectActions } from './projects.js';

export interface ConnectionState { status: 'connecting' | 'connected' | 'error'; error?: string }
export interface ConnectionStore {
  getSnapshot(): ConnectionState;
  subscribe(listener: () => void): () => void;
  retry(): void;
}

export function StudioIcon({ size = 22 }: { size?: number; active?: boolean }): React.ReactElement {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" strokeWidth="1.6"/><path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2v8" stroke="currentColor" strokeWidth="1.6"/><path d="m8 5.3 8 4.5v4" stroke="currentColor" strokeWidth="1.6"/></svg>;
}

export function createStudioPanel(store: ConnectionStore, fallbackT: (key: string) => string, projects: ProjectActions): React.ComponentType<{ t?: (key: string) => string }> {
  return function StudioPanel({ t = fallbackT }): React.ReactElement {
    const connection = React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    return <main className="creative-studio-root" data-testid="creative-studio">
      <style>{styles}</style>
      <header className="cs-header">
        <div className="cs-brand"><span className="cs-logo"><StudioIcon size={24}/></span><div><strong>{t('title')}</strong><small>CREATIVE STUDIO</small></div></div>
        <div className="cs-header-status"><div className={`cs-connection cs-connection-${connection.status}`} role="status"><span/>{t(connection.status)}</div>{connection.status !== 'connected' && <button type="button" className="cs-quiet" onClick={store.retry} disabled={connection.status === 'connecting'}>{t('retry')}</button>}</div>
      </header>
      <section className="cs-welcome">
        <span className="cs-eyebrow">{t('eyebrow')}</span>
        <h1>{t('headline')}</h1>
        <p className="cs-lead">{t('description')}</p>
        {connection.status === 'connected' ? <ProjectWorkspace api={projects} t={t}/> : <p role="alert" className="cs-error">{connection.error ?? t('initialStage')}</p>}
      </section>
      <footer className="cs-footer"><span>{t('draftRule')}</span><span>v0.1.0 · {t('native')}</span></footer>
    </main>;
  };
}

const styles = `
.creative-studio-root{box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;min-height:100%;width:100%;overflow:auto;padding:24px 32px 20px;color:inherit;font:inherit;font-size:15px;line-height:24px;
--cs-accent:#168b75;--cs-accent-strong:#0f6b5a;
--cs-muted:color-mix(in srgb,currentColor 64%,transparent);
--cs-border:color-mix(in srgb,currentColor 14%,transparent);
--cs-surface:color-mix(in srgb,currentColor 5%,transparent);
--cs-surface-2:color-mix(in srgb,currentColor 9%,transparent);
--cs-soft:color-mix(in srgb,var(--cs-accent) 8%,transparent);
--cs-text-xs:12px;--cs-text-sm:13px;--cs-text-md:15px;--cs-text-lg:19px;--cs-text-xl:28px}
.creative-studio-root *{box-sizing:border-box}
.creative-studio-root :is(h1,h2,h3,h4,h5,p,ul,ol,figure){margin:0}
.creative-studio-root :is(ul,ol){padding-left:20px}
.creative-studio-root li{margin:4px 0}
.creative-studio-root h1{font-size:var(--cs-text-xl);line-height:36px;font-weight:650;letter-spacing:-.02em}
.creative-studio-root h2{font-size:var(--cs-text-lg);line-height:28px;font-weight:650;margin:24px 0 8px}
.creative-studio-root h3{font-size:var(--cs-text-lg);line-height:28px;font-weight:600;margin:24px 0 8px}
.creative-studio-root h4{font-size:var(--cs-text-md);line-height:24px;font-weight:600;margin:16px 0 4px}
.creative-studio-root h5{font-size:var(--cs-text-sm);line-height:20px;font-weight:600;color:var(--cs-muted);margin:16px 0 4px}
.creative-studio-root p{margin:0 0 8px;max-width:72ch}
.creative-studio-root small{font-size:var(--cs-text-xs);line-height:16px;color:var(--cs-muted)}
.creative-studio-root code,.creative-studio-root pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:var(--cs-text-xs);line-height:16px;background:var(--cs-surface);border-radius:8px;padding:2px 4px;overflow-wrap:anywhere}
.creative-studio-root pre{padding:8px 12px;overflow:auto;max-height:280px}
.creative-studio-root a{color:inherit}
.creative-studio-root .cs-header{display:flex;align-items:center;justify-content:space-between;gap:24px;width:100%;align-self:stretch;padding-bottom:24px;border-bottom:1px solid var(--cs-border)}
.creative-studio-root .cs-header-status{display:flex;align-items:center;gap:12px}
.creative-studio-root .cs-brand{display:flex;align-items:center;gap:12px}
.creative-studio-root .cs-logo{display:grid;place-items:center;width:44px;height:44px;background:var(--cs-soft);color:var(--cs-accent-strong);border:1px solid color-mix(in srgb,var(--cs-accent) 24%,transparent);border-radius:12px}
.creative-studio-root .cs-brand strong{display:block;font-size:var(--cs-text-lg);line-height:28px;letter-spacing:.01em}
.creative-studio-root .cs-brand small{display:block;font-size:var(--cs-text-xs);line-height:16px;letter-spacing:.16em;margin-top:4px}
.creative-studio-root .cs-connection{display:flex;align-items:center;gap:8px;font-size:var(--cs-text-sm);line-height:20px;color:var(--cs-muted)}
.creative-studio-root .cs-connection>span{width:8px;height:8px;border-radius:50%;background:currentColor}
.creative-studio-root .cs-connection-connected>span{background:var(--cs-accent)}
.creative-studio-root .cs-connection-error{color:#c2554b}
.creative-studio-root .cs-welcome{width:100%;max-width:1100px;align-self:center;margin:48px 0 32px}
.creative-studio-root .cs-eyebrow{display:block;color:var(--cs-muted);font-size:var(--cs-text-xs);line-height:16px;letter-spacing:.12em;text-transform:uppercase;font-weight:600}
.creative-studio-root .cs-welcome h1{margin:12px 0 0;max-width:24ch}
.creative-studio-root .cs-lead{color:var(--cs-muted);font-size:var(--cs-text-md);line-height:24px;margin:12px 0 0;max-width:65ch}
.creative-studio-root .cs-flow{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin:32px 0}
.creative-studio-root .cs-stage{border:1px solid var(--cs-border);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--cs-surface)}
.creative-studio-root .cs-stage-number{font-size:var(--cs-text-xs);line-height:16px;color:var(--cs-muted);font-variant-numeric:tabular-nums;letter-spacing:.08em}
.creative-studio-root .cs-stage strong{font-size:var(--cs-text-sm);line-height:20px;font-weight:600}
.creative-studio-root .cs-empty{border:1px dashed var(--cs-border);border-radius:12px;text-align:center;padding:32px 24px;background:var(--cs-surface);margin-top:32px}
.creative-studio-root .cs-empty-icon{color:var(--cs-accent-strong)}
.creative-studio-root .cs-empty h2{margin:16px 0 8px}
.creative-studio-root .cs-empty p{font-size:var(--cs-text-sm);line-height:20px;color:var(--cs-muted);max-width:60ch;margin:0}
.creative-studio-root .cs-empty button{margin-top:16px}
.creative-studio-root button{font:inherit;font-size:var(--cs-text-sm);line-height:20px;border:1px solid var(--cs-border);border-radius:8px;padding:4px 12px;min-height:32px;background:transparent;color:inherit;cursor:pointer;margin:0}
.creative-studio-root button:hover:not(:disabled){background:var(--cs-surface-2)}
.creative-studio-root button:focus-visible,.creative-studio-root :is(input,select,textarea,summary):focus-visible{outline:2px solid var(--cs-accent);outline-offset:2px}
.creative-studio-root button:disabled{opacity:.5;cursor:not-allowed}
.creative-studio-root button[aria-pressed=true]{border-color:var(--cs-accent);background:var(--cs-soft)}
.creative-studio-root button.cs-primary{background:var(--cs-accent-strong);border-color:var(--cs-accent-strong);color:#fff;font-weight:600}
.creative-studio-root button.cs-primary:hover:not(:disabled){background:color-mix(in srgb,var(--cs-accent-strong) 86%,#000)}
.creative-studio-root button.cs-quiet{border-color:transparent;padding:4px 8px}
.creative-studio-root button.cs-danger{color:light-dark(#a3201b,#f2a7a1);border-color:light-dark(#e3b3ae,#5d2f2c)}
.creative-studio-root button.cs-danger:hover:not(:disabled){background:light-dark(#fdf3f2,#2a1a19);border-color:light-dark(#c98a84,#8a4741)}
.creative-studio-root :is(input,select,textarea){font:inherit;font-size:var(--cs-text-sm);line-height:20px;padding:4px 12px;min-height:32px;border:1px solid var(--cs-border);border-radius:8px;background-color:light-dark(#fbfbfc,#1b1b1e);color:inherit;max-width:100%}
.creative-studio-root select option,.creative-studio-root select optgroup{background-color:light-dark(#ffffff,#202024);color:light-dark(#111114,#f4f4f6)}
.creative-studio-root :is(input,select,textarea)::placeholder{color:var(--cs-muted);opacity:1}
.creative-studio-root textarea{line-height:24px;min-height:80px;padding:8px 12px;resize:vertical}
.creative-studio-root select{cursor:pointer}
.creative-studio-root input[type=checkbox]{width:16px;height:16px;min-height:0;padding:0;accent-color:var(--cs-accent-strong);vertical-align:middle}
.creative-studio-root input[type=range]{appearance:none;height:24px;min-height:24px;padding:0;border:0;background:transparent;cursor:pointer}
.creative-studio-root input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:4px;background:var(--cs-surface-2);border:1px solid var(--cs-border)}
.creative-studio-root input[type=range]::-webkit-slider-thumb{appearance:none;width:16px;height:16px;margin-top:-8px;border-radius:50%;background:var(--cs-accent-strong);border:2px solid #fff}
.creative-studio-root label{display:block;font-size:var(--cs-text-sm);line-height:20px;margin:0 0 12px}
.creative-studio-root label>input:not([type=checkbox]):not([type=range]),.creative-studio-root label>select,.creative-studio-root label>textarea{display:block;width:100%;margin-top:4px}
.creative-studio-root label:has(>input[type=checkbox]){display:flex;align-items:flex-start;gap:8px;min-height:24px;margin:0 0 4px;cursor:pointer}
.creative-studio-root label:has(>input[type=checkbox])>input{margin-top:4px;flex:0 0 auto}
.creative-studio-root summary{padding:4px 0;min-height:24px;font-size:var(--cs-text-sm);line-height:20px;cursor:pointer;color:var(--cs-muted)}
.creative-studio-root summary:hover{color:inherit}
.creative-studio-root fieldset{border:1px solid var(--cs-border);border-radius:12px;padding:12px 16px;margin:0 0 16px;min-width:0}
.creative-studio-root legend{font-size:var(--cs-text-sm);line-height:20px;font-weight:600;padding:0 4px}
.creative-studio-root table{width:100%;border-collapse:collapse;font-size:var(--cs-text-sm);line-height:20px}
.creative-studio-root :is(th,td){text-align:left;padding:8px;border-bottom:1px solid var(--cs-border);vertical-align:top}
.creative-studio-root th{font-weight:600}
.creative-studio-root hr{border:0;border-top:1px solid var(--cs-border);margin:16px 0}
.creative-studio-root .cs-error{color:#c2554b;overflow-wrap:anywhere}
.creative-studio-root .cs-footer{display:flex;justify-content:space-between;gap:24px;color:var(--cs-muted);font-size:var(--cs-text-xs);line-height:16px;width:100%;max-width:none;margin:0;padding-top:16px;border-top:1px solid var(--cs-border)}
.creative-studio-root .cs-projects{display:flex;flex-direction:column;gap:16px;width:100%;max-width:1100px;align-self:center;margin:32px 0 0}
.creative-studio-root:has(.cs-projects article) .cs-projects{max-width:none;align-self:stretch}
.creative-studio-root .cs-chooser-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:12px}
.creative-studio-root .cs-chooser-title{margin:0}
.creative-studio-root .cs-project-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.creative-studio-root .cs-project-card{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:8px 12px;min-height:48px;background:var(--cs-surface);border-color:var(--cs-border)}
.creative-studio-root .cs-project-card:hover:not(:disabled){background:var(--cs-soft);border-color:var(--cs-accent)}
.creative-studio-root .cs-project-head{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:0 0 8px}
.creative-studio-root .cs-project-head .cs-toolbar{margin:0}
.creative-studio-root .cs-project-title{margin:0}
.creative-studio-root .cs-table-wrap{overflow-x:auto;border:1px solid var(--cs-border);border-radius:12px;margin:0 0 16px}
.creative-studio-root .cs-table{border-collapse:collapse;width:100%;font-size:var(--cs-text-sm);line-height:20px}
.creative-studio-root .cs-table th,.creative-studio-root .cs-table td{padding:8px 12px;text-align:left;vertical-align:top;border-bottom:1px solid var(--cs-border)}
.creative-studio-root .cs-table thead th{font-size:var(--cs-text-xs);color:var(--cs-muted);font-weight:600;white-space:nowrap}
.creative-studio-root .cs-table tbody tr:last-child th,.creative-studio-root .cs-table tbody tr:last-child td{border-bottom:0}
.creative-studio-root .cs-table tbody th{font-weight:600}
.creative-studio-root .cs-table tbody th small{display:block;font-weight:400}
.creative-studio-root .cs-table-refs td:nth-child(3){max-width:320px}
.creative-studio-root .cs-table-matrix th{white-space:nowrap}
.creative-studio-root .cs-table-matrix td{min-width:140px}
.creative-studio-root .cs-code-clip{display:block;max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.creative-studio-root .cs-row-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.creative-studio-root .cs-table .cs-row-actions{margin-top:0}
.creative-studio-root .cs-chip{display:inline-flex;flex-direction:column;align-items:flex-start;gap:0;text-align:left;padding:4px 8px;min-height:32px;margin:0 4px 4px 0;background:var(--cs-surface);border-color:var(--cs-border)}
.creative-studio-root .cs-chip small{color:var(--cs-muted);font-size:var(--cs-text-xs);line-height:16px}
.creative-studio-root .cs-chip[aria-pressed='true']{background:var(--cs-soft);border-color:var(--cs-accent)}
.creative-studio-root .cs-muted{color:var(--cs-muted)}
.creative-studio-root .cs-feature-detail{padding:12px 16px;border:1px solid var(--cs-border);border-radius:12px;background:var(--cs-surface);margin:0 0 16px}
.creative-studio-root .cs-feature-detail h4{margin:0 0 8px}
.creative-studio-root .cs-feature-detail p{margin:0 0 12px}
.creative-studio-root .cs-pairs{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:8px 16px;margin:0 0 12px}
.creative-studio-root .cs-pairs dt{color:var(--cs-muted);font-size:var(--cs-text-sm);line-height:20px}
.creative-studio-root .cs-pairs dd{margin:0}
.creative-studio-root .cs-disclosure{margin:0 0 12px}
.creative-studio-root .cs-form-stack{display:grid;gap:0;margin:8px 0 0}
.creative-studio-root .cs-form-stack .cs-checks{margin-bottom:12px}
.creative-studio-root .cs-brief{margin:16px 0;padding:16px;border:1px solid var(--cs-border);border-radius:12px;background:var(--cs-surface)}
.creative-studio-root .cs-brief h4{margin:0 0 8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.creative-studio-root .cs-intent{font-size:var(--cs-text-xs);line-height:16px;font-weight:600;padding:2px 8px;border-radius:8px;border:1px solid var(--cs-border);background:var(--cs-soft);color:var(--cs-accent-strong)}
.creative-studio-root .cs-intent-operation{border-color:light-dark(#e3b3ae,#5d2f2c);color:light-dark(#a3201b,#f2a7a1)}
.creative-studio-root .cs-intent-unclear{color:var(--cs-muted)}
.creative-studio-root .cs-brief-restated{margin:0 0 8px;font-size:var(--cs-text-md);line-height:24px}
.creative-studio-root .cs-brief-list{margin:0;padding-left:20px;font-size:var(--cs-text-sm);line-height:20px}
.creative-studio-root .cs-brief-list li+li{margin-top:4px}
.creative-studio-root .cs-brief-actions{margin:12px 0 16px;padding:16px;border:1px dashed var(--cs-border);border-radius:12px}
.creative-studio-root .cs-form{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;margin:0 0 16px}
.creative-studio-root .cs-field{display:grid;gap:4px;min-width:0}
.creative-studio-root .cs-field>label{margin:0;color:var(--cs-muted);font-weight:500}
.creative-studio-root .cs-article-head{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:0 0 8px}
.creative-studio-root .cs-article-head h3{margin:0}
.creative-studio-root .cs-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 8px}
.creative-studio-root .cs-stack{display:flex;flex-direction:column;gap:12px}
.creative-studio-root .cs-workbench{margin-top:16px}
.creative-studio-root .cs-grid{display:grid}
.creative-studio-root .cs-inline-field{display:inline-flex;align-items:center;gap:8px;margin:0;min-height:32px;color:var(--cs-muted)}
.creative-studio-root .cs-tabs{display:flex;flex-wrap:wrap;gap:8px}
.creative-studio-root .cs-pane{min-width:0;padding:12px;border:1px solid var(--cs-border);border-radius:12px;background:var(--cs-surface)}
.creative-studio-root .cs-split{position:relative;align-self:stretch;min-height:240px;cursor:col-resize;touch-action:none;background:transparent}
.creative-studio-root .cs-split::before{content:'';position:absolute;inset:0 6px;background:var(--cs-border);border-radius:8px}
.creative-studio-root .cs-split:focus-visible{outline:2px solid var(--cs-accent);outline-offset:2px}
.creative-studio-root .cs-demo-pane{min-width:0}
.creative-studio-root .cs-steps{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0 0 12px;padding:0}
.creative-studio-root .cs-steps button{display:inline-flex;align-items:center;gap:8px;min-height:32px}
.creative-studio-root .cs-steps button[aria-current='step']{border-color:var(--cs-accent);background:var(--cs-soft);font-weight:600}
.creative-studio-root .cs-step-index{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:10px;background:var(--cs-surface-2);font-size:12px;line-height:16px;color:var(--cs-muted)}
.creative-studio-root .cs-steps button[aria-current='step'] .cs-step-index{background:var(--cs-accent-strong);color:#fff}
.creative-studio-root .cs-stage-body{container-type:inline-size}
.cs-stage-hint{margin:0 0 12px}
.creative-studio-root .cs-block{padding:12px 16px;border:1px solid var(--cs-border);border-radius:12px;background:var(--cs-surface);margin:0 0 12px}
.creative-studio-root .cs-block:last-child{margin-bottom:0}
.creative-studio-root .cs-block>h4{margin:0 0 8px}
.creative-studio-root .cs-pane-scroll{max-height:40vh;overflow:auto}
.creative-studio-root .cs-checks{display:flex;flex-wrap:wrap;gap:8px 16px;margin:0 0 12px}
.creative-studio-root .cs-checks>label{display:inline-flex;align-items:center;gap:8px;margin:0;min-height:24px}
.creative-studio-root .cs-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.creative-studio-root .cs-hint{font-size:var(--cs-text-sm);line-height:20px;color:var(--cs-muted);max-width:65ch}
.creative-studio-root:has(.cs-projects article) .cs-welcome{max-width:none;margin:16px 0}
.creative-studio-root:has(.cs-projects article) .cs-welcome > :is(.cs-eyebrow,h1,.cs-lead,.cs-flow,.cs-empty){display:none}
.creative-studio-root:has(.cs-projects article) .cs-header{padding-bottom:16px}
@media(max-width:900px){.creative-studio-root .cs-grid{grid-template-columns:minmax(0,1fr)!important}.creative-studio-root .cs-split{display:none}.creative-studio-root .cs-demo-pane{position:static!important}.creative-studio-root .cs-inline-field{display:none}}
@media(max-width:900px){.creative-studio-root{padding:20px 16px 16px}.creative-studio-root .cs-flow{grid-template-columns:repeat(3,1fr)}.creative-studio-root .cs-welcome{margin:32px 0 24px}}
@media(prefers-reduced-motion:reduce){.creative-studio-root *{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
`;
