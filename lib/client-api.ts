"use client";
/** Browser calls for poses and own garments. Each returns the updated public user. */
import type { TryOnCategory } from "./catalog";
import { dataUrlToBlob } from "./image-checks";
import type { GarmentEntry, PoseEntry, PublicUser } from "./types";

async function send<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { window.location.href = "/login"; throw new Error("Please log in again."); }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data as T;
}
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const mediaUrl = (file: string) => `/api/media/${file}`;

export function savePose(dataUrl: string) {
  const form = new FormData();
  form.set("image", dataUrlToBlob(dataUrl), "pose.jpg");
  return send<{ user: PublicUser; pose: PoseEntry }>("/api/poses", { method: "POST", body: form });
}
export const deletePose = (id: string) => send<{ user: PublicUser }>("/api/poses", json("DELETE", { id }));

export function saveGarment(dataUrl: string, name: string, category: TryOnCategory) {
  const form = new FormData();
  form.set("image", dataUrlToBlob(dataUrl), "garment.jpg");
  form.set("name", name);
  form.set("category", category);
  return send<{ user: PublicUser; garment: GarmentEntry }>("/api/garments", { method: "POST", body: form });
}
export const renameGarment = (id: string, name: string) => send<{ user: PublicUser }>("/api/garments", json("PATCH", { id, name }));
export const deleteGarment = (id: string) => send<{ user: PublicUser }>("/api/garments", json("DELETE", { id }));
