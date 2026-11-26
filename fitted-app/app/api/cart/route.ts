import { mutateUser } from "@/lib/api";
import { addToCart, setQuantity } from "@/lib/shop";

/** Add a line: {productId, size, qty, color} */
export async function POST(req: Request) {
  const { productId, size, qty, color } = await req.json().catch(() => ({}));
  return mutateUser((u) => { addToCart(u, String(productId), size ?? null, Number(qty) || 1, color); });
}

/** Change quantity: {index, qty} (qty 0 removes) */
export async function PATCH(req: Request) {
  const { index, qty } = await req.json().catch(() => ({}));
  return mutateUser((u) => { setQuantity(u, Number(index), Number(qty)); });
}

/** Remove a line: {index} */
export async function DELETE(req: Request) {
  const { index } = await req.json().catch(() => ({}));
  return mutateUser((u) => { setQuantity(u, Number(index), 0); });
}
