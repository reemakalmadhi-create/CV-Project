import { NextResponse } from "next/server";
import { cookieOptions, createSessionToken, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { getUser } from "@/lib/db";
import { fail } from "@/lib/api";
import { toPublic } from "@/lib/types";

export async function POST(req: Request) {
  const { email = "", password = "", remember = false } = await req.json().catch(() => ({}));
  if (!email.trim() || !password) return fail("Please enter your email and password.");
  const user = await getUser(email);
  // Same message for unknown email and wrong password (no account probing).
  if (!user || !verifyPassword(password, user.password)) return fail("Incorrect email or password.", 401);
  const { token, maxAge } = createSessionToken(user, Boolean(remember));
  const res = NextResponse.json({ user: toPublic(user) });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(maxAge));
  return res;
}
