import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookieOptions, createSessionToken, hashPassword, SESSION_COOKIE } from "@/lib/auth";
import { createUser, getUser, readImage, saveImage, sniffImage } from "@/lib/db";
import type { UserRecord } from "@/lib/types";

/**
 * No login screen: each new visitor gets a private guest account (own poses, closet and history)
 * and a 30-day session cookie, then goes back to the page they asked for.
 */
export async function GET(req: Request) {
  const next = new URL(req.url).searchParams.get("next") || "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/api/auth") ? next : "/";

  const id = crypto.randomBytes(6).toString("hex");
  const user: UserRecord = {
    name: "Guest",
    email: `guest-${id}@guest.fitted.local`,
    password: hashPassword(crypto.randomBytes(24).toString("hex")),
    createdAt: new Date().toISOString(),
    avatar: null, favorites: [], cart: [], orders: [], tryonHistory: [], poses: [], garments: [],
    sizes: { upper_body: null, lower_body: null, dresses: null },
    tokenVersion: 1,
  };
  await copyDemoItems(user);
  await createUser(user);
  const { token, maxAge } = createSessionToken(user, true);
  // relative Location so it works on localhost and behind the public tunnel
  const res = new NextResponse(null, { status: 303, headers: { Location: safeNext } });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(maxAge));
  return res;
}

/** Start every guest with the demo account's poses and closet (own copies, so deleting one is safe). */
async function copyDemoItems(user: UserRecord) {
  const demoEmail = process.env.DEMO_EMAIL;
  const demo = demoEmail ? await getUser(demoEmail) : undefined;
  if (!demo) return;
  const copy = async (file: string) => {
    const buf = await readImage(file);
    const ext = buf && sniffImage(buf);
    return buf && ext ? saveImage(buf, ext) : null;
  };
  for (const p of demo.poses) {
    const file = await copy(p.file);
    if (file) user.poses.push({ ...p, file });
  }
  for (const g of demo.garments) {
    const file = await copy(g.file);
    if (file) user.garments.push({ ...g, file });
  }
}
