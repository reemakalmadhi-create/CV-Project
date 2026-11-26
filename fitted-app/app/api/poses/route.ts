/** Saved poses: photos of the user, reused for every try-on. */
import { currentUser } from "@/lib/auth";
import { deleteImage, saveImage, updateUser } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { toPublic } from "@/lib/types";
import { MAX_POSES, newId, readUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);
  if (user.poses.length >= MAX_POSES) return fail(`You can keep up to ${MAX_POSES} poses. Delete one first.`);
  const form = await req.formData().catch(() => null);
  const up = await readUpload(form?.get("image"));
  if ("error" in up) return fail(up.error);
  const file = await saveImage(up.buf, up.ext);
  const pose = { id: newId(), file, createdAt: new Date().toISOString() };
  try {
    const updated = await updateUser(user.email, (u) => { u.poses.unshift(pose); });
    return ok({ user: toPublic(updated), pose });
  } catch (err) {
    await deleteImage(file);
    return fail(err instanceof Error ? err.message : "Something went wrong.");
  }
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);
  const { id = "" } = await req.json().catch(() => ({}));
  const pose = user.poses.find((p) => p.id === id);
  if (!pose) return fail("Pose not found.", 404);
  const updated = await updateUser(user.email, (u) => { u.poses = u.poses.filter((p) => p.id !== id); });
  await deleteImage(pose.file);
  return ok({ user: toPublic(updated) });
}
