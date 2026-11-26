import { NextResponse } from "next/server";
import { currentUser, SESSION_COOKIE } from "@/lib/auth";
import { updateUser } from "@/lib/db";
import { fail } from "@/lib/api";

/** Sign out of every device (including this one). */
export async function DELETE() {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);
  await updateUser(user.email, (u) => { u.tokenVersion += 1; });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
