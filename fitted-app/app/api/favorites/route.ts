import { mutateUser } from "@/lib/api";
import { toggleFavorite } from "@/lib/shop";

export async function POST(req: Request) {
  const { productId } = await req.json().catch(() => ({}));
  return mutateUser((u) => ({ favorite: toggleFavorite(u, String(productId)) }));
}
