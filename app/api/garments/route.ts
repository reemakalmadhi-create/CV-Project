/** "My closet": garment photos the user uploaded (e.g. a hoodie saved from the internet). */
import { currentUser } from "@/lib/auth";
import type { TryOnCategory } from "@/lib/catalog";
import { deleteImage, saveImage, updateUser } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { toPublic } from "@/lib/types";
import { MAX_GARMENTS, newId, readUpload } from "@/lib/uploads";

export const runtime = "nodejs";

const CATEGORIES: TryOnCategory[] = ["upper_body", "lower_body", "dresses"];
const cleanName = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, 60);

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);
  if (user.garments.length >= MAX_GARMENTS) return fail(`Your closet holds up to ${MAX_GARMENTS} pieces. Delete one first.`);
  const form = await req.formData().catch(() => null);
  const category = String(form?.get("category") ?? "upper_body") as TryOnCategory;
  if (!CATEGORIES.includes(category)) return fail("Unknown garment category.");
  const up = await readUpload(form?.get("image"));
  if ("error" in up) return fail(up.error);
  const file = await saveImage(up.buf, up.ext);
  const garment = { id: newId(), name: cleanName(form?.get("name")) || "My garment", file, category, createdAt: new Date().toISOString() };
  try {
    const updated = await updateUser(user.email, (u) => { u.garments.unshift(garment); });
    return ok({ user: toPublic(updated), garment });
  } catch (err) {
    await deleteImage(file);
    return fail(err instanceof Error ? err.message : "Something went wrong.");
  }
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);
  const { id = "", name, category } = await req.json().catch(() => ({}));
  if (!user.garments.some((g) => g.id === id)) return fail("Garment not found.", 404);
  if (category !== undefined && !CATEGORIES.includes(category)) return fail("Unknown garment category.");
  const n = name === undefined ? undefined : cleanName(name);
  if (n === "") return fail("Please give the garment a name.");
  const updated = await updateUser(user.email, (u) => {
    const g = u.garments.find((x) => x.id === id)!;
    if (n) g.name = n;
    if (category) g.category = category;
  });
  return ok({ user: toPublic(updated) });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Please log in again.", 401);
  const { id = "" } = await req.json().catch(() => ({}));
  const g = user.garments.find((x) => x.id === id);
  if (!g) return fail("Garment not found.", 404);
  const updated = await updateUser(user.email, (u) => { u.garments = u.garments.filter((x) => x.id !== id); });
  await deleteImage(g.file);
  return ok({ user: toPublic(updated) });
}
