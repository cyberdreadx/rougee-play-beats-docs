// Polyfills for browser environment to support Node-style globals used by some web3 libs
import { Buffer } from 'buffer';

// Ensure global Buffer exists (required by some dependencies)
declare global {
  // Allow attaching Buffer to globalThis
  // eslint-disable-next-line no-var
  var Buffer: typeof Buffer | undefined;
}

if (typeof globalThis !== 'undefined') {
  // @ts-ignore - augmenting globalThis at runtime
  if (!globalThis.Buffer) globalThis.Buffer = Buffer;
  // Some libs expect `global` to exist in browser
  // @ts-ignore - augmenting globalThis at runtime
  if (!globalThis.global) globalThis.global = globalThis;
}
