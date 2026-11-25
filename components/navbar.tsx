"use client";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Heart, Info, LogOut, Menu, Settings, ShoppingBag, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LangToggle, useI18n } from "@/components/i18n-provider";
import { useUser } from "@/components/user-context";
import { EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", key: "nav.home" },
  { href: "/closet", key: "nav.closet" },
  { href: "/profile", key: "nav.profile" },
  { href: "/favorites", key: "nav.favorites" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/closet") return pathname.startsWith("/closet") || pathname.startsWith("/product");
  return pathname.startsWith(href);
}

/** Pops when the number changes (bag / favorites counters). */
function Count({ n }: { n: number }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {n > 0 && (
        <motion.span
          key={n}
          initial={{ scale: 0.4, opacity: 0, y: -4 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.4, opacity: 0 }}
          transition={SPRING}
          className="ms-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold tracking-normal text-white"
        >
          {n}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, cartCount, logout } = useUser();
  const { t } = useI18n();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // hide while scrolling down, reappear when scrolling up
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 8);
    setHidden(y > 140 && y > prev && !menu && !mobile);
  });

  useEffect(() => { setMenu(false); setMobile(false); }, [pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menu]);

  const first = user.name.split(" ")[0];
  const initials = user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <motion.header
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-500",
        scrolled ? "border-border bg-background/70 shadow-[0_10px_40px_-24px_rgba(70,50,25,.35)]" : "border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-5 md:px-8">
        <Link href="/" dir="ltr" className="keep-tracking group relative text-[19px] font-bold tracking-[0.34em] text-foreground">
          FITTED
          <span className="absolute -bottom-1 left-0 h-px w-0 bg-brand transition-all duration-500 group-hover:w-[calc(100%-.34em)]" />
        </Link>

        {/* desktop links with a shared animated underline (layoutId) */}
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "relative flex items-center px-3.5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(l.key)}
                  {l.href === "/favorites" && <Count n={user.favorites.length} />}
                  {active && <motion.span layoutId="nav-active" transition={SPRING} className="absolute inset-x-3.5 -bottom-px h-[2px] rounded-full bg-brand" />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/bag"
            aria-label={t("nav.bagAria")}
            className={cn(
              "relative flex items-center px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300",
              pathname.startsWith("/bag") ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ShoppingBag className="me-2 size-4" strokeWidth={1.8} />
            <span className="hidden sm:inline">{t("nav.bag")}</span>
            <Count n={cartCount} />
            {pathname.startsWith("/bag") && <motion.span layoutId="nav-active" transition={SPRING} className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-brand" />}
          </Link>

          <LangToggle className="hidden sm:inline-flex" />

          {/* account menu */}
          <div ref={menuRef} className="relative hidden md:block">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              className="glass flex h-10 items-center gap-2.5 rounded-full border border-border ps-1.5 pe-3.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] transition-colors hover:border-brand-violet"
            >
              {user.avatar
                ? <img src={user.avatar} alt="" className="size-7 rounded-full object-cover" />
                : <span className="flex size-7 items-center justify-center rounded-full bg-brand text-[10px] tracking-normal text-white">{initials}</span>}
              {first}
              <motion.span animate={{ rotate: menu ? 180 : 0 }} transition={SPRING} className="text-[9px]">▾</motion.span>
            </motion.button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="absolute end-0 top-12 w-64 origin-top border border-border bg-[#fffdf8]/97 p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,.8)] backdrop-blur-xl"
                >
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  {[
                    { href: "/profile", label: t("nav.settings"), Icon: Settings },
                    { href: "/try-on", label: t("nav.tryon"), Icon: Sparkles },
                    { href: "/favorites", label: t("nav.favorites"), Icon: Heart },
                    { href: "/about", label: t("nav.about"), Icon: Info },
                  ].map(({ href, label, Icon }) => (
                    <Link key={href} href={href} className="group flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <Icon className="size-4" strokeWidth={1.8} />
                      <span className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">{label}</span>
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-border" />
                  <button onClick={logout} className="group flex w-full items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <LogOut className="size-4" strokeWidth={1.8} />
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">{t("nav.logout")}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="p-2 md:hidden" aria-label={t("nav.menu")} onClick={() => setMobile((m) => !m)}>
            {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* mobile menu */}
      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="px-5 py-4">
              {[...LINKS, { href: "/try-on", key: "nav.tryon" } as const, { href: "/about", key: "nav.about" } as const].map((l) => (
                <motion.li key={l.href} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                  <Link href={l.href} className={cn("block py-3 text-sm font-semibold uppercase tracking-[0.2em]", isActive(pathname, l.href) ? "text-foreground" : "text-muted-foreground")}>
                    {t(l.key)}
                  </Link>
                </motion.li>
              ))}
              <motion.li variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                <button onClick={logout} className="py-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t("nav.logout")}</button>
              </motion.li>
              <motion.li variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="pt-2"><LangToggle /></motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
