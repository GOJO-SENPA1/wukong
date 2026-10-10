import fs from "node:fs";
import path from "node:path";
import { createClient } from "redis";
import { DATA_DIR } from "./env";

// Storage backends for the off-chain store and the judge's cross-process lock.
//   Redis (REDIS_URL or KV_URL set): serverless hosts like Vercel, where the
//     disk is read-only and every request may land on a different instance.
//   JSON file in DATA_DIR (default): local runs and single-container hosts.

export type Coll = "briefs" | "submissions" | "reports" | "taskMeta" | "names" | "taskTxs";
export type Release = () => Promise<void>;

export interface Backend {
  get<T>(coll: Coll, key: string): Promise<T | undefined>;
  many<T>(coll: Coll, keys: string[]): Promise<(T | undefined)[]>;
  all<T>(coll: Coll): Promise<Record<string, T>>;
  set<T>(coll: Coll, key: string, value: T): Promise<void>;
  /** Append to a per-key list (e.g. a task's transactions). */
  push<T>(coll: Coll, key: string, value: T): Promise<void>;
  list<T>(coll: Coll, key: string): Promise<T[]>;
  /** Exclusive lock that expires after ttlMs even if its holder dies. Null if taken. */
  lock(name: string, ttlMs: number): Promise<Release | null>;
}

// ---------- JSON file

type Shape = Record<Coll, Record<string, unknown>>;
const COLLS: Coll[] = ["briefs", "submissions", "reports", "taskMeta", "names", "taskTxs"];
const empty = (): Shape => Object.fromEntries(COLLS.map((c) => [c, {}])) as Shape;

function fileBackend(): Backend {
  const FILE = path.join(DATA_DIR, "store.json");
  let cache: Shape | null = null;
  let cacheMtime = 0;

  const load = (): Shape => {
    try {
      const stat = fs.statSync(FILE);
      if (cache && stat.mtimeMs === cacheMtime) return cache;
      cache = { ...empty(), ...JSON.parse(fs.readFileSync(FILE, "utf8")) } as Shape;
      cacheMtime = stat.mtimeMs;
      return cache;
    } catch {
      cache = cache ?? empty();
      return cache;
    }
  };
  const mutate = (fn: (s: Shape) => void) => {
    const s = load();
    fn(s);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(s, null, 1));
    fs.renameSync(tmp, FILE);
    cache = s;
    cacheMtime = fs.statSync(FILE).mtimeMs;
  };

  return {
    get: async <T>(coll: Coll, key: string) => load()[coll][key] as T | undefined,
    many: async <T>(coll: Coll, keys: string[]) => keys.map((k) => load()[coll][k] as T | undefined),
    all: async <T>(coll: Coll) => ({ ...load()[coll] }) as Record<string, T>,
    set: async <T>(coll: Coll, key: string, value: T) => mutate((s) => void (s[coll][key] = value)),
    push: async <T>(coll: Coll, key: string, value: T) =>
      mutate((s) => void (s[coll][key] = [...((s[coll][key] as T[] | undefined) ?? []), value])),
    list: async <T>(coll: Coll, key: string) => [...((load()[coll][key] as T[] | undefined) ?? [])],
    async lock(name, ttlMs) {
      const dir = path.join(DATA_DIR, "locks");
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${name.replace(/[^\w.-]/g, "_")}.lock`);
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          fs.writeFileSync(file, `${process.pid} ${Date.now()}`, { flag: "wx" });
          return async () => fs.rmSync(file, { force: true });
        } catch {
          const age = Date.now() - (fs.statSync(file, { throwIfNoEntry: false })?.mtimeMs ?? 0);
          if (age < ttlMs) return null;
          fs.rmSync(file, { force: true }); // stale: a crashed holder left it behind
        }
      }
      return null;
    },
  };
}

// ---------- Redis

const RELEASE = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

const connect = (url: string) =>
  createClient({ url })
    .on("error", (err: Error) => console.error("redis:", err.message))
    .connect();
type Client = Awaited<ReturnType<typeof connect>>;

function redisBackend(url: string): Backend {
  const prefix = process.env.WUKONG_KV_PREFIX ?? "wukong:";
  // One connection per server instance, reused across requests (and dev reloads).
  const g = globalThis as { __wukongRedis?: Promise<Client> };
  const client = () =>
    (g.__wukongRedis ??= connect(url).catch((err) => {
      g.__wukongRedis = undefined;
      throw err;
    }));
  const k = (coll: Coll, key?: string) => (key === undefined ? `${prefix}${coll}` : `${prefix}${coll}:${key}`);
  const parse = <T>(v: string | null | undefined) => (v == null ? undefined : (JSON.parse(v) as T));

  return {
    get: async <T>(coll: Coll, key: string) => parse<T>(await (await client()).hGet(k(coll), key)),
    async many<T>(coll: Coll, keys: string[]) {
      if (keys.length === 0) return [];
      return (await (await client()).hmGet(k(coll), keys)).map((v) => parse<T>(v));
    },
    async all<T>(coll: Coll) {
      const raw = await (await client()).hGetAll(k(coll));
      return Object.fromEntries(Object.entries(raw).map(([key, v]) => [key, JSON.parse(v) as T]));
    },
    set: async <T>(coll: Coll, key: string, value: T) => void (await (await client()).hSet(k(coll), key, JSON.stringify(value))),
    push: async <T>(coll: Coll, key: string, value: T) => void (await (await client()).rPush(k(coll, key), JSON.stringify(value))),
    list: async <T>(coll: Coll, key: string) => (await (await client()).lRange(k(coll, key), 0, -1)).map((v) => JSON.parse(v) as T),
    async lock(name, ttlMs) {
      const c = await client();
      const key = `${prefix}lock:${name}`;
      const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const ok = await c.set(key, token, { condition: "NX", expiration: { type: "PX", value: ttlMs } });
      if (ok !== "OK") return null;
      return async () => void (await c.eval(RELEASE, { keys: [key], arguments: [token] }));
    },
  };
}

// ---------- selection

let backend: Backend | null = null;

export function redisUrl(): string | undefined {
  return process.env.REDIS_URL || process.env.KV_URL || undefined;
}

export function kv(): Backend {
  if (backend) return backend;
  const url = redisUrl();
  if (url) backend = redisBackend(url);
  else if (process.env.VERCEL) {
    throw new Error(
      "Wukong on Vercel needs a Redis store for its off-chain content: add one under Storage (e.g. Upstash for Redis) so REDIS_URL or KV_URL is set, then redeploy.",
    );
  } else backend = fileBackend();
  return backend;
}
