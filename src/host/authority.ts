export interface UserAuthority { readonly kind: 'user' }

/** Called only with the Host's ctx.invocation, never a caller-supplied actor. */
export function requireUserAuthority(invocation: unknown): UserAuthority {
  const principal = isRecord(invocation) && isRecord(invocation.peer) ? invocation.peer.principal : undefined;
  if (!isRecord(principal) || principal.kind !== 'owner') {
    throw Object.assign(new Error('This action requires the local Harness owner connection.'), { code: 'FORBIDDEN' });
  }
  return { kind: 'user' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
