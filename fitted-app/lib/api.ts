import { NextResponse } from "next/server";
import { currentUser } from "./auth";
import { updateUser } from "./db";
import { toPublic, type UserRecord } from "./types";

export const ok = (data: object = {}) => NextResponse.json(data);
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** Run a mutation on the signed-in user and reply with the updated public user. */
export async function mutateUser(fn: (u: UserRecord) => object | void) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);
  try {
    let extra: object | void = {};
    const updated = await updateUser(user.email, (u) => { extra = fn(u); });
    return ok({ user: toPublic(updated), ...(extra || {}) });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Something went wrong.");
  }
}
