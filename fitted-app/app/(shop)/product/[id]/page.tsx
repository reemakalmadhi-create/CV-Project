import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { ProductGrid } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { getProduct, PRODUCTS } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = getProduct((await params).id);
  return { title: p ? `${p.name} — FITTED` : "FITTED" };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = getProduct((await params).id);
  if (!product) notFound();
  const lang = await getLang();
  const others = PRODUCTS.filter((p) => p.id !== product.id);
  const more = [...others.filter((p) => p.category === product.category), ...others.filter((p) => p.category !== product.category)].slice(0, 4);
  return (
    <>
      <Link href="/closet" className="group mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <span className="rtl-flip inline-block transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1">←</span> {t(lang, "c.backToCloset")}
      </Link>
      <ProductDetail product={product} />
      <hr className="my-20 border-border" />
      <Reveal><p className="eyebrow mb-6">{t(lang, "p.more")}</p></Reveal>
      <ProductGrid products={more} />
    </>
  );
}
