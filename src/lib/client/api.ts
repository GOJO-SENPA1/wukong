"use client";

import { Transaction, type PublicKey, type VersionedTransaction } from "@solana/web3.js";

export interface ClientSigner {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
}

export async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data as T;
}

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data as T;
}

/** POST and consume a newline-delimited JSON event stream. */
export async function streamEvents<E>(url: string, body: unknown, onEvent: (e: E) => void): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) onEvent(JSON.parse(line) as E);
    }
  }
  if (buf.trim()) onEvent(JSON.parse(buf) as E);
}

export type ActionKind = "create_task" | "submit" | "close" | "settle_pick" | "cancel";
const TX_KIND: Record<ActionKind, string> = {
  create_task: "create",
  submit: "submit",
  close: "close",
  settle_pick: "settle",
  cancel: "cancel",
};

/** Server builds the transaction, the persona/wallet signs, the server relays. */
export async function runAction(
  signer: ClientSigner,
  action: { kind: ActionKind } & Record<string, unknown>,
): Promise<{ sig: string; task?: string }> {
  const built = await postJSON<{ tx: string; task?: string; label: string }>("/api/tx/build", {
    ...action,
    signer: signer.publicKey.toBase58(),
  });
  const tx = Transaction.from(Buffer.from(built.tx, "base64"));
  const signed = await signer.signTransaction(tx);
  const { sig } = await postJSON<{ sig: string }>("/api/tx/send", {
    tx: Buffer.from(signed.serialize()).toString("base64"),
    task: built.task,
    kind: TX_KIND[action.kind],
    label: built.label,
  });
  return { sig, task: built.task };
}
