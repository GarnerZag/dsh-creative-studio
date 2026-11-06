import type { ComponentType } from 'react';
import type { TypertClientRemote, TypertDisposer, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';

/** Only the public services consumed by this bundle, not internal UI modules. */
export interface StudioClientContext {
  inject(deps: string[], callback: (ctx: StudioClientContext) => void): unknown;
  effect(setup: () => void | (() => void)): unknown;
  slots: {
    inject(name: string, setup: () => unknown): unknown;
    register<P>(options: { name: string; key?: string; id?: string; order?: number; label?: () => string; locale?: string }, component: ComponentType<P>): unknown;
  };
  locale: {
    register(namespace: string, dictionaries: { zh: Record<string, string>; en: Record<string, string> }): () => void;
    bind(namespace: string): (key: string) => string;
  };
  remote: TypertClientRemote & { $mount(contribution: TypertRemoteContribution): Promise<TypertDisposer> };
}
