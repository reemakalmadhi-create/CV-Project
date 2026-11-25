"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, MonitorSmartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LottieIcon } from "@/components/lottie";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/user-context";
import { getProduct, PRODUCTS, SIZES, type TryOnCategory } from "@/lib/catalog";
import type { Key } from "@/lib/i18n";
import { EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

const PRODUCT_BY_NAME = (name: string) => PRODUCTS.find((p) => p.name === name);

const TABS = [["profile", "pr.tab.profile"], ["sizes", "pr.tab.sizes"], ["history", "pr.tab.history"], ["orders", "pr.tab.orders"], ["settings", "pr.tab.settings"]] as const;
type Tab = (typeof TABS)[number][0];

const date = (iso: string, lang: "en" | "ar" = "en") => new Date(iso).toLocaleDateString(lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="eyebrow mb-2 block">{label}</span>{children}</label>;
}
const inputCls = "glass h-11 w-full rounded-xl border border-border px-3.5 text-sm outline-none transition-colors focus:border-brand-violet";

async function squareThumb(file: File, size = 256): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement("canvas"); c.width = c.height = size;
    c.getContext("2d")!.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
    return c.toDataURL("image/jpeg", 0.88);
  } finally { URL.revokeObjectURL(url); }
}

export function ProfileView({ initialTab }: { initialTab?: string }) {
  const { user, updateProfile } = useUser();
  const { t, sar, err, p: loc, lang } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>((TABS.find(([k]) => k === initialTab)?.[0] ?? "profile") as Tab);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [sizes, setSizes] = useState(user.sizes);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [del, setDel] = useState("");
  const initials = user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try { await fn(); toast(done); } catch (e) { toast(err((e as Error).message), "error"); }
  };
  const post = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
  };

  return (
    <>
      {/* header */}
      <div className="flex items-center gap-4 pb-10 pt-10 sm:gap-6">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={SPRING} onClick={() => fileRef.current?.click()}
          className="group relative size-20 shrink-0 overflow-hidden rounded-full bg-brand p-[2px] shadow-[0_10px_40px_-12px_rgba(184,137,78,.8)] sm:size-24" aria-label={t("pr.changeImage")}>
          {user.avatar ? <img src={user.avatar} alt="" className="size-full rounded-full object-cover" /> : <span className="flex size-full items-center justify-center rounded-full bg-[#fffdf8] text-2xl font-medium text-[#2e2217]">{initials}</span>}
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100"><Camera className="size-5" /></span>
        </motion.button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = "";
          if (!f) return;
          if (f.size > 8 * 1024 * 1024) { toast(t("t.imageTooBig"), "error"); return; }
          await run(async () => updateProfile({ avatar: await squareThumb(f) }), t("t.imageUpdated"));
        }} />
        <div className="min-w-0">
          <p className="eyebrow">{t("pr.eyebrow")}</p>
          <h1 className="title mt-1">{user.name}</h1>
          <p className="mt-1 break-all text-xs text-muted-foreground">{user.email} · {t("pr.since", { date: date(user.createdAt, lang) })}</p>
        </div>
      </div>

      {/* tabs with a sliding underline */}
      <div className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto border-b border-border px-5 sm:mx-0 sm:px-0">
        {TABS.map(([k, key]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("relative whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold uppercase tracking-[0.16em] transition-colors", tab === k ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t(key as Key)}
            {tab === k && <motion.span layoutId="profile-tab" transition={SPRING} className="absolute inset-x-4 -bottom-px h-[2px] rounded-full bg-brand" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EASE }} className="pt-8">
          {tab === "profile" && (
            <form className="max-w-md space-y-5" onSubmit={(e: FormEvent) => { e.preventDefault(); run(() => updateProfile({ name, email }), t("t.profileUpdated")); }}>
              <Field label={t("pr.name")}><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label={t("pr.email")}><input dir="ltr" className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">{t("c.saveChanges")}</Button>
                {user.avatar && <Button type="button" variant="ghost" onClick={() => run(() => updateProfile({ avatar: null }), t("t.imageRemoved"))}>{t("pr.removeImage")}</Button>}
              </div>
            </form>
          )}

          {tab === "sizes" && (
            <div className="max-w-2xl">
              <p className="mb-6 text-sm text-muted-foreground">{t("pr.sizesHelp")}</p>
              {([["upper_body", "pr.tops"], ["lower_body", "pr.bottoms"], ["dresses", "pr.dresses"]] as [TryOnCategory, Key][]).map(([k, label]) => (
                <div key={k} className="mb-6">
                  <p className="eyebrow mb-2.5">{t(label)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[null, ...SIZES].map((s) => (
                      <button key={s ?? "none"} onClick={() => setSizes((x) => ({ ...x, [k]: s }))}
                        className={cn("relative h-10 min-w-12 rounded-xl border px-3 text-[13px] font-semibold transition-colors", sizes[k] === s ? "border-transparent text-white" : "glass border-border hover:border-brand-violet")}>
                        {sizes[k] === s && <motion.span layoutId={`size-${k}`} transition={SPRING} className="absolute inset-0 rounded-xl bg-brand" />}
                        <span className="relative">{s ?? t("pr.notSet")}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={() => run(() => updateProfile({ sizes }), t("t.sizesSaved"))}>{t("pr.saveSizes")}</Button>
            </div>
          )}

          {tab === "history" && (user.tryonHistory.length ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {user.tryonHistory.map((h) => (
                <div key={h.id}>
                  <img src={`/api/media/${h.file}`} alt="" loading="lazy" className="showroom aspect-[3/4] w-full rounded-2xl object-contain" />
                  <p className="mt-2 text-xs text-muted-foreground">{(() => {
                    if (h.garmentId || !h.productId) return user.garments.find((g) => g.id === h.garmentId)?.name ?? t("mc.myGarment");
                    const gp = getProduct(h.productId); return gp ? loc(gp).name : h.productId;
                  })()} · {date(h.createdAt, lang)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <LottieIcon name="empty_favorites" size={120} />
              <h3 className="mt-2 text-lg font-medium">{t("pr.noHistoryT")}</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("pr.noHistory")}</p>
            </div>
          ))}

          {tab === "orders" && (user.orders.length ? (
            <ul className="glass divide-y divide-border rounded-[24px] border border-border px-5">
              {user.orders.map((o) => (
                <li key={o.id} className="py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{o.id}</p>
                    <p className="text-sm">{sar(o.total)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{date(o.createdAt, lang)} · {o.status}</p>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {o.items.map((i, n) => { const gp = PRODUCT_BY_NAME(i.name); return <li key={n}>{t("pr.orderLine", { name: gp ? loc(gp).name : i.name, size: i.size, qty: i.qty, amount: sar(i.price * i.qty) })}</li>; })}
                  </ul>
                </li>
              ))}
            </ul>
          ) : <p className="py-10 text-center text-sm text-muted-foreground">{t("pr.noOrders")}</p>)}

          {tab === "settings" && (
            <div className="grid gap-12 md:grid-cols-2">
              <form className="max-w-md space-y-4" onSubmit={(e) => {
                e.preventDefault();
                run(async () => { await post("/api/me/password", "POST", pw); setPw({ current: "", next: "", confirm: "" }); }, t("t.pwUpdated"));
              }}>
                <p className="font-semibold">{t("pr.changePw")}</p>
                <Field label={t("pr.currentPw")}><input type="password" className={inputCls} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></Field>
                <Field label={t("pr.newPw")}><input type="password" className={inputCls} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></Field>
                <Field label={t("pr.confirmPw")}><input type="password" className={inputCls} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></Field>
                <Button type="submit">{t("pr.updatePw")}</Button>
                <div className="pt-4">
                  <Button type="button" variant="secondary" onClick={() => run(async () => { await post("/api/me/sessions", "DELETE"); router.replace("/login"); router.refresh(); }, t("t.signedOutAll"))}>
                    <MonitorSmartphone className="size-4" /> {t("pr.signOutAll")}
                  </Button>
                </div>
              </form>
              <div className="max-w-md rounded-[24px] border border-red-200 bg-red-50/70 p-5">
                <p className="font-semibold text-red-700">{t("pr.delete")}</p>
                <p className="mb-3 mt-1 text-sm text-muted-foreground">{t("pr.deleteText")}</p>
                <Field label={t("pr.typeDelete")}><input dir="ltr" className={cn(inputCls, "mt-1")} value={del} onChange={(e) => setDel(e.target.value)} /></Field>
                <Button className="mt-4" style={{ background: "linear-gradient(120deg,#dc2626,#e11d48)" }} disabled={del.trim() !== "DELETE"}
                  onClick={() => run(async () => { await post("/api/me", "DELETE", { confirm: "DELETE" }); router.replace("/signup"); router.refresh(); }, t("t.deleted"))}>
                  {t("pr.deleteBtn")}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
