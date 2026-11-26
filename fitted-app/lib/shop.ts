/** Favorites, cart, orders, sizes, try-on history — pure functions on a user record. */
import crypto from "node:crypto";
import { SIZES, getProduct, shippingFor } from "./catalog";
import type { CartLine, Order, Sizes, UserRecord } from "./types";

export const MAX_QTY = 10;

export function toggleFavorite(u: UserRecord, productId: string): boolean {
  if (!getProduct(productId)) throw new Error("Unknown product.");
  const i = u.favorites.indexOf(productId);
  if (i >= 0) { u.favorites.splice(i, 1); return false; }
  u.favorites.unshift(productId);
  return true;
}

export function addToCart(u: UserRecord, productId: string, size: string | null, qty = 1, color?: string) {
  const p = getProduct(productId);
  if (!p) throw new Error("This product is no longer available.");
  if (!size || !(SIZES as readonly string[]).includes(size)) throw new Error("Please select a size.");
  const q = Math.max(1, Math.min(MAX_QTY, Math.floor(qty || 1)));
  const c = color || p.colors[0]?.name || "";
  const line = u.cart.find((l) => l.productId === productId && l.size === size && l.color === c);
  if (line) line.qty = Math.min(MAX_QTY, line.qty + q);
  else u.cart.push({ productId, size, color: c, qty: q });
}

export function setQuantity(u: UserRecord, index: number, qty: number) {
  if (index < 0 || index >= u.cart.length) return;
  if (qty <= 0) u.cart.splice(index, 1);
  else u.cart[index].qty = Math.min(MAX_QTY, Math.floor(qty));
}

export function pricedLines(cart: CartLine[]) {
  return cart.flatMap((line, index) => {
    const product = getProduct(line.productId);
    return product ? [{ ...line, index, product, lineTotal: product.price_sar * line.qty }] : [];
  });
}

export function totals(cart: CartLine[]) {
  const lines = pricedLines(cart);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shipping = shippingFor(subtotal);
  return { subtotal, shipping, total: subtotal + shipping, count: lines.reduce((s, l) => s + l.qty, 0) };
}

/** Prototype checkout: records the order and empties the cart. No payment. */
export function placeOrder(u: UserRecord): Order {
  const lines = pricedLines(u.cart);
  if (!lines.length) throw new Error("Your bag is empty.");
  const t = totals(u.cart);
  const order: Order = {
    id: "FT-" + crypto.randomBytes(3).toString("hex").toUpperCase(),
    createdAt: new Date().toISOString(),
    items: lines.map((l) => ({ productId: l.productId, name: l.product.name, size: l.size, color: l.color, qty: l.qty, price: l.product.price_sar })),
    subtotal: t.subtotal, shipping: t.shipping, total: t.total,
    status: "Placed (prototype — no payment taken)",
  };
  u.orders.unshift(order);
  u.cart = [];
  return order;
}

export function saveSizes(u: UserRecord, sizes: Partial<Sizes>) {
  for (const [k, v] of Object.entries(sizes)) {
    (u.sizes as Record<string, string | null>)[k] = v && (SIZES as readonly string[]).includes(v) ? v : null;
  }
}
