import { mutateUser } from "@/lib/api";
import { placeOrder } from "@/lib/shop";

/** Prototype checkout — records the order, no payment. */
export async function POST() {
  return mutateUser((u) => ({ order: placeOrder(u) }));
}
