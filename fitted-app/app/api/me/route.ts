import { NextResponse } from "next/server";
import { cookieOptions, createSessionToken, currentUser, SESSION_COOKIE } from "@/lib/auth";
import { deleteUser, getUser, renameUser, updateUser } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { saveSizes } from "@/lib/shop";
import { toPublic } from "@/lib/types";
import { emailError, nameError } from "@/lib/validation";

export async function GET() {
  const user = await currentUser();
  return user ? ok({ user: toPublic(user) }) : fail("Not signed in.", 401);
}

/** Update name / email / avatar / saved sizes. */
export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);
  const body = await req.json().catch(() => ({}));
  let email = user.email;
  try {
    if (typeof body.email === "string" && body.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const err = emailError(body.email);
      if (err) return fail(err);
      if (await getUser(body.email)) return fail("Another account already uses this email.");
      await renameUser(user.email, body.email);
      email = body.email.trim();
    }
    const updated = await updateUser(email, (u) => {
      if (typeof body.name === "string") {
        const err = nameError(body.name);
        if (err) throw new Error(err);
        u.name = body.name.trim().replace(/\s+/g, " ");
      }
      if (body.avatar === null) u.avatar = null;
      else if (typeof body.avatar === "string") {
        if (!body.avatar.startsWith("data:image/") || body.avatar.length > 400_000) throw new Error("That image is too large.");
        u.avatar = body.avatar;
      }
      if (body.sizes) saveSizes(u, body.sizes);
    });
    const res = NextResponse.json({ user: toPublic(updated) });
    if (email !== user.email) {
      // the session cookie carries the email -> reissue it
      const { token, maxAge } = createSessionToken(updated, true);
      res.cookies.set(SESSION_COOKIE, token, cookieOptions(maxAge));
    }
    return res;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save.");
  }
}

/** Permanently delete the account. */
export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);
  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== "DELETE") return fail('Type DELETE to confirm.');
  await deleteUser(user.email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
