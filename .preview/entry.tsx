// Preview-only entry: mounts the Creative Studio panel with mock data so the
// rendered UI can be audited and screenshotted without a Harness host.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createStudioPanel, type ConnectionState } from '../src/client/app.js';
import { actions } from './mock.js';
import dict from './dict.json';

const t = (key: string): string => (dict as Record<string, string>)[key] ?? key;
const preview = (window as unknown as { __PREVIEW__?: { screen?: string; status?: string } }).__PREVIEW__ ?? {};
const params = new URLSearchParams(location.search);
const screen = preview.screen ?? params.get('screen') ?? 'welcome';
const status = (preview.status ?? params.get('status') ?? 'connected') as ConnectionState['status'];

const state: ConnectionState = status === 'error'
  ? { status: 'error', error: 'Host 连接失败：ECONNREFUSED 127.0.0.1:3080' }
  : { status };
const store = {
  getSnapshot: () => state,
  subscribe: () => () => undefined,
  retry: () => undefined,
};

const Panel = createStudioPanel(store, t, actions);
const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Panel t={t} />);

if (screen === 'workspace') {
  const timer = setInterval(() => {
    const button = document.querySelector<HTMLButtonElement>('.cs-projects nav button');
    if (button) { clearInterval(timer); button.click(); }
  }, 50);
  setTimeout(() => clearInterval(timer), 5000);
}
