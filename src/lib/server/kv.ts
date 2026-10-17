import fs from "node:fs";
import path from "node:path";
import { createClient } from "redis";
import { DATA_DIR } from "./env";

// Storage backends for the off-chain store and the judge's cross-process lock.
//   Redis (REDIS_URL or KV_URL set): serverless hosts like Vercel, where the
//     disk is read-only and every request may land on a different instance.
//   JSON file in DATA_DIR (default): local runs and single-container hosts.

export type Coll = "briefs" | "submissions" | "reports" | "taskMeta" | "names" | "taskTxs" | "tallies";
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
  /** Count a hit in a fixed window; returns the count so far in this window. */
  hit(name: string, windowMs: number): Promise<number>;
  /** Add one to each named counter in a group (e.g. one day's events); the group expires after ttlDays. */
  tally(group: string, fields: string[], ttlDays: number): Promise<void>;
  /** Every counter in a group. */
  tallies(group: string): Promise<Record<string, number>>;
}

// Fixed-window counters for the file backend (single process, so memory is enough).
const counters = new Map<string, { n: number; until: number }>();
function memoryHit(name: string, windowMs: number): number {
  const now = Date.now();
  const c = counters.get(name);
  if (!c || c.until <= now) {
    if (counters.size > 50_000) for (const [k, v] of counters) if (v.until <= now) counters.delete(k);
    counters.set(name, { n: 1, until: now + windowMs });
    return 1;
  }
  c.n++;
  return c.n;
}

// ---------- JSON file

type Shape = Record<Coll, Record<string, unknown>>;
const COLLS: Coll[] = ["briefs", "submissions", "reports", "taskMeta", "names", "taskTxs", "tallies"];
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
    hit: async (name, windowMs) => memoryHit(name, windowMs),
    tally: async (group, fields) =>
      mutate((s) => {
        const g = ((s.tallies[group] as Record<string, number> | undefined) ??= {});
        for (const f of fields) g[f] = (g[f] ?? 0) + 1;
        s.tallies[group] = g;
      }),
    tallies: async (group) => ({ ...((load().tallies[group] as Record<string, number> | undefined) ?? {}) }),
  };
}

// ---------- Redis

const RELEASE = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

// Serverless functions are frozen between requests, and a frozen function's socket can die
// silently. Out of the box the client would queue commands and reconnect forever, so a bad
// connection hung every request until the platform killed it. Instead: give up connecting
// after a few seconds, refuse commands while disconnected, and time-box every command,
// dropping the connection on a timeout so the next request starts a fresh one.
const OP_TIMEOUT_MS = 3_000;
const connect = (url: string) =>
  createClient({
    url,
    disableOfflineQueue: true,
    socket: { connectTimeout: 4_000, reconnectStrategy: (retries) => (retries >= 2 ? false : 150 * (retries + 1)) },
  })
    .on("error", (err: Error) => console.error("redis:", err.message))
    .connect();
type Client = Awaited<ReturnType<typeof connect>>;

function redisBackend(url: string): Backend {
  const prefix = process.env.WUKONG_KV_PREFIX ?? "wukong:";
  // One connection per server instance, reused across requests (and dev reloads).
  const g = globalThis as { __wukongRedis?: Promise<Client>; __wukongRedisDownUntil?: number };
  // After a failure, skip Redis for a while so a dead store costs one slow request, not every request.
  const COOLDOWN_MS = 30_000;
  const reset = () => {
    const stale = g.__wukongRedis;
    g.__wukongRedis = undefined;
    g.__wukongRedisDownUntil = Date.now() + COOLDOWN_MS;
    stale?.then((c) => c.destroy()).catch(() => {});
  };
  const connected = () =>
    (g.__wukongRedis ??= connect(url).catch((err) => {
      g.__wukongRedis = undefined;
      g.__wukongRedisDownUntil = Date.now() + COOLDOWN_MS;
      throw err;
    }));
  const client = async (): Promise<Client> => {
    if (Date.now() < (g.__wukongRedisDownUntil ?? 0)) throw new Error("redis: unreachable a moment ago, skipping");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reset();
        reject(new Error("redis: no connection"));
      }, OP_TIMEOUT_MS);
    });
    try {
      return await Promise.race([connected(), timeout]);
    } finally {
      clearTimeout(timer);
    }
  };
  /** Run one command with a deadline; a command that doesn't answer in time drops the connection. */
  const op = async <T>(fn: (c: Client) => Promise<T>): Promise<T> => {
    const c = await client();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        fn(c),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reset();
            reject(new Error("redis: command timed out"));
          }, OP_TIMEOUT_MS);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };
  const k = (coll: Coll, key?: string) => (key === undefined ? `${prefix}${coll}` : `${prefix}${coll}:${key}`);
  const parse = <T>(v: string | null | undefined) => (v == null ? undefined : (JSON.parse(v) as T));

  return {
    get: async <T>(coll: Coll, key: string) => parse<T>(await op((c) => c.hGet(k(coll), key))),
    async many<T>(coll: Coll, keys: string[]) {
      if (keys.length === 0) return [];
      return (await op((c) => c.hmGet(k(coll), keys))).map((v) => parse<T>(v));
    },
    async all<T>(coll: Coll) {
      const raw = await op((c) => c.hGetAll(k(coll)));
      return Object.fromEntries(Object.entries(raw).map(([key, v]) => [key, JSON.parse(v) as T]));
    },
    set: async <T>(coll: Coll, key: string, value: T) => void (await op((c) => c.hSet(k(coll), key, JSON.stringify(value)))),
    push: async <T>(coll: Coll, key: string, value: T) => void (await op((c) => c.rPush(k(coll, key), JSON.stringify(value)))),
    list: async <T>(coll: Coll, key: string) => (await op((c) => c.lRange(k(coll, key), 0, -1))).map((v) => JSON.parse(v) as T),
    async lock(name, ttlMs) {
      const key = `${prefix}lock:${name}`;
      const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const ok = await op((c) => c.set(key, token, { condition: "NX", expiration: { type: "PX", value: ttlMs } }));
      if (ok !== "OK") return null;
      return async () => void (await op((c) => c.eval(RELEASE, { keys: [key], arguments: [token] })));
    },
    async hit(name, windowMs) {
      const key = `${prefix}rl:${name}`;
      const n = await op((c) => c.incr(key));
      if (n === 1) await op((c) => c.pExpire(key, windowMs));
      return n;
    },
    async tally(group, fields, ttlDays) {
      if (!fields.length) return;
      const key = `${prefix}tally:${group}`;
      await op((c) => {
        const m = c.multi();
        for (const f of fields) m.hIncrBy(key, f, 1);
        m.expire(key, ttlDays * 86_400);
        return m.exec();
      });
    },
    async tallies(group) {
      const raw = await op((c) => c.hGetAll(`${prefix}tally:${group}`));
      return Object.fromEntries(Object.entries(raw).map(([f, v]) => [f, Number(v)]));
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
