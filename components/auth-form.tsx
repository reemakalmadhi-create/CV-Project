"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LangToggle, useI18n } from "@/components/i18n-provider";
import { Arrow, Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EASE } from "@/lib/motion";
import { emailError, passwordProblems } from "@/lib/validation";
import { cn } from "@/lib/utils";

const inputCls = "h-12 w-full rounded-xl border border-border bg-white/80 px-4 text-sm outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-muted-foreground/60 focus:border-brand-violet focus:shadow-[0_0_0_4px_rgba(184,137,78,.18)]";

const PW_AR: Record<string, string> = { "at least 8 characters": "8 أحرف على الأقل", "a letter": "حرف", "a number": "رقم" };

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Password({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  const { t } = useI18n();
  return (
    <div className="relative">
      <input dir="ltr" type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} className={cn(inputCls, "pe-12 rtl:text-right")} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t("a.hidePw") : t("a.showPw")}
        className="absolute inset-y-0 end-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function Shell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <motion.div initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.08 } } }} className="w-full max-w-[420px]">
      <motion.div variants={{ h: { opacity: 0 }, s: { opacity: 1 } }} className="mb-6 flex justify-end"><LangToggle /></motion.div>
      <motion.p dir="ltr" variants={{ h: { opacity: 0, y: -8 }, s: { opacity: 1, y: 0 } }} className="keep-tracking text-brand mb-10 text-center text-[24px] font-extrabold tracking-[0.38em]">FITTED</motion.p>
      <motion.div variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }} className="mb-8 text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="title mt-2">{title}</h1>
      </motion.div>
      <motion.div variants={{ h: { opacity: 0, y: 16 }, s: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
        className="glass rounded-[28px] border border-border p-6 shadow-[0_40px_100px_-50px_rgba(70,50,25,.7)] sm:p-7">
        {children}
      </motion.div>
      <motion.p variants={{ h: { opacity: 0 }, s: { opacity: 1 } }} className="mt-6 text-center text-[13px]">
        <Link href="/about" className="text-muted-foreground underline-offset-4 transition-colors hover:text-brand-violet hover:underline">{t("a.aboutLink")} →</Link>
      </motion.p>
    </motion.div>
  );
}

function ErrorLine({ error }: { error: string | null }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700" role="alert">{error}</motion.p>
      )}
    </AnimatePresence>
  );
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const { t, err: tr } = useI18n();

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    if (!email.trim() || !password) { setError(t("a.enterBoth")); return; }
    setBusy(true);
    try { await post("/api/auth/login", { email, password, remember }); router.replace("/"); router.refresh(); }
    catch (err) { setError(tr((err as Error).message)); setBusy(false); }
  };

  return (
    <Shell eyebrow={t("a.welcomeBack")} title={t("a.loginTitle")}>
      <form onSubmit={submit} className="space-y-5">
        <Field label={t("a.email")}><input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" className={cn(inputCls, "rtl:text-right")} /></Field>
        <Field label={t("a.password")}><Password value={password} onChange={setPassword} autoComplete="current-password" /></Field>
        <div className="flex items-center justify-between text-[13px]">
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-[#5b4329]" /> {t("a.remember")}</label>
          <button type="button" onClick={() => { setForgot(true); setResetMsg(null); setResetEmail(email); }} className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">{t("a.forgot")}</button>
        </div>
        <ErrorLine error={error} />
        <Button type="submit" full size="lg" disabled={busy}>{busy ? t("a.loggingIn") : <>{t("a.login")} <Arrow /></>}</Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        {t("a.new")} <Link href="/signup" className="font-semibold text-brand-violet underline-offset-4 hover:underline">{t("a.create")}</Link>
      </p>
      <Dialog open={forgot} onClose={() => setForgot(false)} title={t("a.resetTitle")}>
        <Field label={t("a.accountEmail")}><input dir="ltr" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className={inputCls} /></Field>
        <Button full className="mt-4" onClick={() => {
          const err = emailError(resetEmail);
          setResetMsg(err ? tr(err) : t("a.resetInfo"));
        }}>{t("a.sendReset")}</Button>
        {resetMsg && <p className="mt-4 rounded-xl bg-muted p-3 text-[13px] text-muted-foreground">{resetMsg}</p>}
      </Dialog>
    </Shell>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const problems = passwordProblems(f.password);
  const { t, lang, err: tr } = useI18n();

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    setBusy(true);
    try { await post("/api/auth/signup", f); router.replace("/"); router.refresh(); }
    catch (err) { setError(tr((err as Error).message)); setBusy(false); }
  };

  return (
    <Shell eyebrow={t("a.join")} title={t("a.signupTitle")}>
      <form onSubmit={submit} className="space-y-5">
        <Field label={t("a.fullName")}><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" className={inputCls} /></Field>
        <Field label={t("a.email")}><input dir="ltr" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" placeholder="you@example.com" className={cn(inputCls, "rtl:text-right")} /></Field>
        <Field label={t("a.password")} hint={f.password && problems.length ? t("a.pwNeeds", { list: problems.map((x) => (lang === "ar" ? PW_AR[x] ?? x : x)).join(lang === "ar" ? "، " : ", ") }) : t("a.pwRule")}>
          <Password value={f.password} onChange={(v) => setF({ ...f, password: v })} autoComplete="new-password" />
        </Field>
        <Field label={t("a.confirm")} hint={f.confirm && f.confirm !== f.password ? t("a.noMatch") : undefined}>
          <Password value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} autoComplete="new-password" />
        </Field>
        <ErrorLine error={error} />
        <Button type="submit" full size="lg" disabled={busy}>{busy ? t("a.creating") : <>{t("a.createBtn")} <Arrow /></>}</Button>
      </form>
      <p className="mt-6 text-center text-[13px] text-muted-foreground">
        {t("a.have")} <Link href="/login" className="font-semibold text-brand-violet underline-offset-4 hover:underline">{t("a.login")}</Link>
      </p>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">{t("a.hashNote")}</p>
    </Shell>
  );
}
