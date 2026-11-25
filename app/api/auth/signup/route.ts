import { NextResponse } from "next/server";
import { cookieOptions, createSessionToken, hashPassword, SESSION_COOKIE } from "@/lib/auth";
import { createUser, getUser } from "@/lib/db";
import { fail } from "@/lib/api";
import { toPublic, type UserRecord } from "@/lib/types";
import { emailError, nameError, passwordProblems } from "@/lib/validation";

export async function POST(req: Request) {
  const { name = "", email = "", password = "", confirm = "" } = await req.json().catch(() => ({}));
  const err = nameError(name) || emailError(email);
  if (err) return fail(err);
  const problems = passwordProblems(password);
  if (problems.length) return fail(`Password needs ${problems.join(", ")}.`);
  if (password !== confirm) return fail("Passwords don't match.");
  if (await getUser(email)) return fail("An account with this email already exists. Try logging in.");

  const user: UserRecord = {
    name: name.trim().replace(/\s+/g, " "),
    email: email.trim(),
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
    avatar: null, favorites: [], cart: [], orders: [], tryonHistory: [],
    sizes: { upper_body: null, lower_body: null, dresses: null },
    tokenVersion: 1,
  };
  await createUser(user);
  const { token, maxAge } = createSessionToken(user, false);
  const res = NextResponse.json({ user: toPublic(user) });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(maxAge));
  return res;
}
