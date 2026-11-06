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
        <div className="cs-brand"><span className="cs-logo"><StudioIcon size={26}/></span><div><strong>{t('title')}</strong><small>CREATIVE STUDIO</small></div></div>
        <div className={`cs-connection cs-connection-${connection.status}`} role="status"><span/>{t(connection.status)}</div>
      </header>
      <section className="cs-welcome">
        <span className="cs-eyebrow">{t('eyebrow')}</span>
        <h1>{t('headline')}</h1>
        <p className="cs-lead">{t('description')}</p>
        <div className="cs-flow" aria-label={t('flow')}>
          {['idea', 'requirements', 'research', 'architecture', 'demo', 'handoff'].map((key, index) => <div className="cs-stage" key={key}><span className="cs-stage-number">{String(index + 1).padStart(2, '0')}</span><strong>{t(key)}</strong></div>)}
        </div>
        {connection.status === 'connected' && <ProjectWorkspace api={projects} t={t}/>}
        <section className="cs-empty"><span className="cs-empty-icon"><StudioIcon size={32}/></span><h2>{t('readyTitle')}</h2><p>{t('initialStage')}</p><button type="button" onClick={store.retry} disabled={connection.status === 'connecting'}>{t('retry')}</button>{connection.error && <p role="alert" className="cs-error">{connection.error}</p>}</section>
      </section>
      <footer className="cs-footer"><span>{t('draftRule')}</span><span>v0.1.0 · {t('native')}</span></footer>
    </main>;
  };
}

const styles = `
.creative-studio-root{box-sizing:border-box;min-height:100%;width:100%;overflow:auto;padding:28px 38px 20px;color:inherit;font:inherit;--cs-border:color-mix(in srgb,currentColor 12%,transparent);--cs-muted:color-mix(in srgb,currentColor 64%,transparent);--cs-accent:#168b75;--cs-soft:color-mix(in srgb,var(--cs-accent) 7%,transparent)}
.creative-studio-root *{box-sizing:border-box}.creative-studio-root .cs-header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding-bottom:22px;border-bottom:1px solid var(--cs-border)}
.creative-studio-root .cs-brand{display:flex;align-items:center;gap:12px}.creative-studio-root .cs-logo{display:grid;place-items:center;width:44px;height:44px;background:var(--cs-soft);color:var(--cs-accent);border:1px solid color-mix(in srgb,var(--cs-accent) 20%,transparent);border-radius:13px}.creative-studio-root .cs-brand strong{font-size:19px;letter-spacing:.04em}.creative-studio-root .cs-brand small{display:block;font-size:9px;letter-spacing:.18em;color:var(--cs-muted);margin-top:4px}
.creative-studio-root .cs-connection{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--cs-muted)}.creative-studio-root .cs-connection>span{width:7px;height:7px;border-radius:50%;background:currentColor}.creative-studio-root .cs-connection-connected{color:var(--cs-accent)}.creative-studio-root .cs-connection-error{color:#c2554b}
.creative-studio-root .cs-welcome{max-width:1100px;margin:46px auto 28px}.creative-studio-root .cs-eyebrow{color:var(--cs-accent);font-size:12px;letter-spacing:.1em}.creative-studio-root h1{font-size:clamp(25px,3vw,36px);line-height:1.45;font-weight:650;letter-spacing:-.02em;margin:12px 0}.creative-studio-root .cs-lead{max-width:660px;color:var(--cs-muted);font-size:14px;line-height:1.9}.creative-studio-root .cs-flow{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:32px 0}.creative-studio-root .cs-stage{border:1px solid var(--cs-border);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:20px}.creative-studio-root .cs-stage-number{font-size:10px;color:var(--cs-accent);font-family:monospace}.creative-studio-root .cs-stage strong{font-size:12px;font-weight:550}
.creative-studio-root .cs-empty{border:1px dashed var(--cs-border);border-radius:16px;text-align:center;padding:32px 24px;background:var(--cs-soft)}.creative-studio-root .cs-empty-icon{color:var(--cs-accent)}.creative-studio-root h2{font-size:17px;margin:14px 0 8px}.creative-studio-root .cs-empty p{font-size:13px;color:var(--cs-muted);line-height:1.8}.creative-studio-root button{font:inherit;font-size:12px;border:1px solid var(--cs-border);border-radius:8px;padding:9px 15px;background:transparent;color:inherit;cursor:pointer;margin-top:10px}.creative-studio-root button:hover{background:color-mix(in srgb,currentColor 6%,transparent)}.creative-studio-root button:focus-visible{outline:2px solid var(--cs-accent);outline-offset:3px}.creative-studio-root button:disabled{opacity:.5;cursor:wait}.creative-studio-root .cs-error{color:#c2554b;overflow-wrap:anywhere}.creative-studio-root .cs-footer{display:flex;justify-content:space-between;gap:20px;color:var(--cs-muted);font-size:11px;max-width:1100px;margin:0 auto;padding-top:8px}
@media(max-width:900px){.creative-studio-root{padding:22px}.creative-studio-root .cs-flow{grid-template-columns:repeat(3,1fr)}}
`;
