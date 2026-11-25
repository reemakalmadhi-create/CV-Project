import { NextResponse } from "next/server";
import { cookieOptions, createSessionToken, currentUser, hashPassword, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { updateUser } from "@/lib/db";
import { fail } from "@/lib/api";
import { passwordProblems } from "@/lib/validation";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);
  const { current = "", next = "", confirm = "" } = await req.json().catch(() => ({}));
  if (!verifyPassword(current, user.password)) return fail("Current password is incorrect.");
  const problems = passwordProblems(next);
  if (problems.length) return fail(`New password needs ${problems.join(", ")}.`);
  if (next !== confirm) return fail("New passwords don't match.");
  const updated = await updateUser(user.email, (u) => { u.password = hashPassword(next); u.tokenVersion += 1; });
  // other devices are signed out (tokenVersion bumped); keep this one signed in
  const { token, maxAge } = createSessionToken(updated, true);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(maxAge));
  return res;
}
