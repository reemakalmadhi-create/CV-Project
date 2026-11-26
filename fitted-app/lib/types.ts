import type { TryOnCategory } from "./catalog";

export interface CartLine { productId: string; size: string; color: string; qty: number }
export interface OrderItem { productId: string; name: string; size: string; color: string; qty: number; price: number }
export interface Order { id: string; createdAt: string; items: OrderItem[]; subtotal: number; shipping: number; total: number; status: string }
/** productId is "" when the garment is one of the user's own uploads (then garmentId is set). */
export interface TryOnEntry { id: string; createdAt: string; productId: string; file: string; garmentId?: string; poseId?: string }
/** A saved photo of the user (768×1024 JPEG), reused for try-ons. */
export interface PoseEntry { id: string; file: string; createdAt: string }
/** A garment photo the user uploaded to "My closet" (e.g. a hoodie saved from the internet). */
export interface GarmentEntry { id: string; name: string; file: string; category: TryOnCategory; createdAt: string }
export type Sizes = Record<TryOnCategory, string | null>;

export interface UserRecord {
  name: string;
  email: string;
  password: { salt: string; hash: string; iterations: number };
  createdAt: string;
  avatar: string | null; // small JPEG data URL
  favorites: string[];
  cart: CartLine[];
  orders: Order[];
  sizes: Sizes;
  tryonHistory: TryOnEntry[];
  poses: PoseEntry[];
  garments: GarmentEntry[];
  tokenVersion: number; // bump to sign out every device
}

/** What the browser is allowed to see. */
export type PublicUser = Omit<UserRecord, "password" | "tokenVersion">;

export function toPublic(u: UserRecord): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, tokenVersion, ...rest } = u;
  return rest;
}
