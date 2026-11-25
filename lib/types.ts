import type { TryOnCategory } from "./catalog";

export interface CartLine { productId: string; size: string; color: string; qty: number }
export interface OrderItem { productId: string; name: string; size: string; color: string; qty: number; price: number }
export interface Order { id: string; createdAt: string; items: OrderItem[]; subtotal: number; shipping: number; total: number; status: string }
export interface TryOnEntry { id: string; createdAt: string; productId: string; file: string }
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
  tokenVersion: number; // bump to sign out every device
}

/** What the browser is allowed to see. */
export type PublicUser = Omit<UserRecord, "password" | "tokenVersion">;

export function toPublic(u: UserRecord): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, tokenVersion, ...rest } = u;
  return rest;
}
