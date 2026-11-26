/**
 * Passwords: PBKDF2-HMAC-SHA256, 16-byte salt, 210,000 iterations (never stored in plain text).
 * Sessions: an HMAC-signed cookie {email, version, expiry}. "Remember me" = 30-day cookie,
 * otherwise a browser-session cookie. "Sign out everywhere" bumps the user's tokenVersion.
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getUser } from "./db";
import type { UserRecord } from "./types";

export const SESSION_COOKIE = "fitted_session";
export const REMEMBER_DAYS = 30;
const ITERATIONS = 210_000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    console.warn("[FITTED] SESSION_SECRET is not set — using an insecure default. Set it in your environment.");
  }
  return s || "fitted-dev-secret-change-me";
}

export function hashPassword(password: string, salt = crypto.randomBytes(16)) {
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
  return { salt: salt.toString("hex"), hash: hash.toString("hex"), iterations: ITERATIONS };
}

export function verifyPassword(password: string, stored: UserRecord["password"]): boolean {
  try {
    const hash = crypto.pbkdf2Sync(password, Buffer.from(stored.salt, "hex"), stored.iterations, 32, "sha256");
    return crypto.timingSafeEqual(hash, Buffer.from(stored.hash, "hex"));
  } catch {
    return false;
  }
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export function createSessionToken(user: UserRecord, remember: boolean): { token: string; maxAge?: number } {
  const maxAge = remember ? REMEMBER_DAYS * 86400 : undefined;
  const exp = Date.now() + (remember ? REMEMBER_DAYS * 86400_000 : 12 * 3600_000);
  const payload = b64(JSON.stringify({ e: user.email.toLowerCase(), v: user.tokenVersion, x: exp }));
  return { token: `${payload}.${sign(payload)}`, maxAge };
}

export async function userFromToken(token: string | undefined): Promise<UserRecord | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { e, v, x } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { e: string; v: number; x: number };
    if (Date.now() > x) return null;
    const user = await getUser(e);
    return user && user.tokenVersion === v ? user : null;
  } catch {
    return null;
  }
}

/** Current user in Server Components / Route Handlers (null if signed out). */
export async function currentUser(): Promise<UserRecord | null> {
  const store = await cookies();
  return userFromToken(store.get(SESSION_COOKIE)?.value);
}

export const cookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  ...(maxAge ? { maxAge } : {}),
});
