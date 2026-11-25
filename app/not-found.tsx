import Link from "next/link";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export default async function NotFound() {
  const lang = await getLang();
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-brand text-6xl font-extrabold">404</p>
      <h1 className="title">{t(lang, "nf.title")}</h1>
      <Link href="/closet" className="mt-4 inline-flex h-11 items-center rounded-full bg-brand px-6 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white">{t(lang, "nf.back")}</Link>
    </main>
  );
}
