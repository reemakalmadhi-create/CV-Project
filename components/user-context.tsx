"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Order, PublicUser, Sizes } from "@/lib/types";

async function call<T = { user: PublicUser }>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { window.location.href = "/login"; throw new Error("Please log in again."); }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data as T;
}

interface UserApi {
  user: PublicUser;
  setUser: (u: PublicUser) => void;
  cartCount: number;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<boolean>;
  addToCart: (productId: string, size: string | null, qty?: number, color?: string) => Promise<void>;
  setQty: (index: number, qty: number) => Promise<void>;
  removeLine: (index: number) => Promise<void>;
  checkout: () => Promise<Order>;
  updateProfile: (patch: { name?: string; email?: string; avatar?: string | null; sizes?: Partial<Sizes> }) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<UserApi | null>(null);

export function useUser(): UserApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUser must be used inside <UserProvider>");
  return v;
}

export function UserProvider({ initialUser, children }: { initialUser: PublicUser; children: ReactNode }) {
  const [user, setUser] = useState(initialUser);
  const router = useRouter();

  const toggleFavorite = useCallback(async (id: string) => {
    const before = user.favorites;
    const now = !before.includes(id);
    setUser((u) => ({ ...u, favorites: now ? [id, ...u.favorites] : u.favorites.filter((f) => f !== id) })); // optimistic
    try {
      const data = await call<{ user: PublicUser; favorite: boolean }>("/api/favorites", "POST", { productId: id });
      setUser(data.user);
      return data.favorite;
    } catch (e) {
      setUser((u) => ({ ...u, favorites: before }));
      throw e;
    }
  }, [user.favorites]);

  const api: UserApi = {
    user,
    setUser,
    cartCount: user.cart.reduce((s, l) => s + l.qty, 0),
    isFavorite: (id) => user.favorites.includes(id),
    toggleFavorite,
    addToCart: async (productId, size, qty = 1, color) => {
      const data = await call("/api/cart", "POST", { productId, size, qty, color });
      setUser(data.user);
    },
    setQty: async (index, qty) => setUser((await call("/api/cart", "PATCH", { index, qty })).user),
    removeLine: async (index) => setUser((await call("/api/cart", "DELETE", { index })).user),
    checkout: async () => {
      const data = await call<{ user: PublicUser; order: Order }>("/api/orders", "POST");
      setUser(data.user);
      return data.order;
    },
    updateProfile: async (patch) => setUser((await call("/api/me", "PATCH", patch)).user),
    logout: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    },
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
