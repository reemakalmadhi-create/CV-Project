/**
 * User store (server only).
 *
 * Two backends, picked automatically:
 *  - Redis (Upstash / Vercel KV) when its REST env vars exist — needed on Vercel, where
 *    every route runs in its own serverless function with its own temporary disk.
 *    Set by Vercel's Upstash integration: KV_REST_API_URL + KV_REST_API_TOKEN
 *    (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
 *  - Otherwise a JSON file in FITTED_DATA_DIR, else ./.data (local development).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { UserRecord } from "./types";

export const DATA_DIR =
  process.env.FITTED_DATA_DIR || (process.env.VERCEL ? "/tmp/fitted-data" : path.join(process.cwd(), ".data"));
const USERS_FILE = path.join(DATA_DIR, "users.json");
export const TRYON_DIR = path.join(DATA_DIR, "tryon");

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const USING_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);

export const keyFor = (email: string) => (email || "").trim().toLowerCase();

/* ---------------- Redis (REST, no extra package) ---------------- */
async function redis<T = unknown>(...command: (string | number)[]): Promise<T> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const data = (await res.json()) as { result?: T; error?: string };
  if (!res.ok || data.error) throw new Error(`Storage error: ${data.error ?? res.status}`);
  return data.result as T;
}
const userKey = (email: string) => `fitted:user:${keyFor(email)}`;
const imgKey = (file: string) => `fitted:img:${path.basename(file)}`;

/* ---------------- JSON file (local) ---------------- */
type Users = Record<string, UserRecord>;
function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(TRYON_DIR, { recursive: true });
}
function readAll(): Users {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8")) as Users;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      try { fs.renameSync(USERS_FILE, USERS_FILE + ".corrupt"); } catch { /* ignore */ }
    }
    return {};
  }
}
function writeAll(users: Users) {
  ensureDirs();
  const tmp = path.join(DATA_DIR, `.users-${crypto.randomBytes(4).toString("hex")}.json`);
  fs.writeFileSync(tmp, JSON.stringify(users));
  fs.renameSync(tmp, USERS_FILE); // atomic replace
}

/* ---------------- public API ---------------- */
export async function getUser(email: string): Promise<UserRecord | undefined> {
  if (!keyFor(email)) return undefined;
  if (USING_REDIS) {
    const raw = await redis<string | null>("GET", userKey(email));
    return raw ? (JSON.parse(raw) as UserRecord) : undefined;
  }
  return readAll()[keyFor(email)];
}

async function putUser(record: UserRecord) {
  if (USING_REDIS) { await redis("SET", userKey(record.email), JSON.stringify(record)); return; }
  const users = readAll();
  users[keyFor(record.email)] = record;
  writeAll(users);
}

export async function createUser(record: UserRecord) {
  if (USING_REDIS) {
    const created = await redis<string | null>("SET", userKey(record.email), JSON.stringify(record), "NX");
    if (created !== "OK") throw new Error("An account with this email already exists.");
    return;
  }
  const users = readAll();
  const k = keyFor(record.email);
  if (users[k]) throw new Error("An account with this email already exists.");
  users[k] = record;
  writeAll(users);
}

/** Load → mutate → save. Returns the updated record. */
export async function updateUser(email: string, mutate: (u: UserRecord) => void): Promise<UserRecord> {
  const u = await getUser(email);
  if (!u) throw new Error("Account not found.");
  mutate(u);
  await putUser(u);
  return u;
}

export async function renameUser(oldEmail: string, newEmail: string) {
  const from = keyFor(oldEmail), to = keyFor(newEmail);
  const u = await getUser(oldEmail);
  if (!u) throw new Error("Account not found.");
  if (from !== to && (await getUser(newEmail))) throw new Error("Another account already uses this email.");
  const moved = { ...u, email: newEmail.trim() };
  await putUser(moved);
  if (from !== to) {
    if (USING_REDIS) await redis("DEL", userKey(oldEmail));
    else { const users = readAll(); delete users[from]; writeAll(users); }
  }
}

export async function deleteUser(email: string) {
  const u = await getUser(email);
  for (const entry of u?.tryonHistory ?? []) {
    if (USING_REDIS) await redis("DEL", imgKey(entry.file)).catch(() => {});
    else { try { fs.unlinkSync(path.join(TRYON_DIR, path.basename(entry.file))); } catch { /* ignore */ } }
  }
  if (USING_REDIS) { await redis("DEL", userKey(email)); return; }
  const users = readAll();
  delete users[keyFor(email)];
  writeAll(users);
}

export async function saveTryonImage(png: Buffer): Promise<string> {
  const file = `${crypto.randomBytes(8).toString("hex")}.png`;
  if (USING_REDIS) { await redis("SET", imgKey(file), png.toString("base64")); return file; }
  ensureDirs();
  fs.writeFileSync(path.join(TRYON_DIR, file), png);
  return file;
}

export async function readTryonImage(file: string): Promise<Buffer | null> {
  if (USING_REDIS) {
    const raw = await redis<string | null>("GET", imgKey(file)).catch(() => null);
    return raw ? Buffer.from(raw, "base64") : null;
  }
  try { return fs.readFileSync(path.join(TRYON_DIR, path.basename(file))); } catch { return null; }
}
