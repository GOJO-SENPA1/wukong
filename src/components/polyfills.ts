// Browsers have no Node `Buffer`, and Next.js doesn't add one. Privy's Solana
// wallet code calls the global `Buffer` when it connects the embedded wallet at
// sign-in and whenever it signs, and throws "Buffer is not defined" without it.
// Imported first by PrivyWrapper, so it runs before Privy does.
import { Buffer } from "buffer";

const g = globalThis as { Buffer?: typeof Buffer };
if (typeof window !== "undefined" && !g.Buffer) g.Buffer = Buffer;

export {};
