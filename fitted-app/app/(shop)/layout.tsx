import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { UserProvider } from "@/components/user-context";
import { currentUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n-server";
import { toPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/api/auth/guest?next=/");
  const lang = await getLang();
  return (
    <UserProvider initialUser={toPublic(user)}>
      <Navbar />
      <main className="mx-auto min-h-[70vh] max-w-[1240px] px-5 pb-24 md:px-8">{children}</main>
      <Footer lang={lang} />
    </UserProvider>
  );
}
