import Link from "next/link";
import { Footer } from "@/components/footer";
import { LangToggle } from "@/components/i18n-provider";
import { ModelStatus } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { currentUser } from "@/lib/auth";
import type { Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { MODEL } from "@/lib/model-info";

export const dynamic = "force-dynamic";
export const metadata = { title: "About the model — FITTED" };

/** Public page for students: what the try-on model is, how it works and how to try it. */
const COPY = (m: typeof MODEL) => ({
  en: {
    eyebrow: "About the model",
    title: `Meet ${m.NAME}.`,
    lead: `FITTED's virtual try-on is built around ${m.NAME} — "${m.FULL_NAME}" (${m.AUTHORS}, ${m.VENUE}). It is a diffusion model: given a photo of a person and a photo of a garment, it generates a new image of that person wearing that garment, keeping the garment's logo, print and texture.`,
    note: "The model choice is still provisional — this page will be updated if it changes.",
    howT: "How it works",
    how: [
      ["Understand the person", "The photo is analysed to find the body pose (DensePose) and the clothing regions (human parsing). The area to be replaced is masked out."],
      ["Read the garment twice", "A high-level encoder (an image prompt adapter) captures what the garment is — its style and colour. A second network (GarmentNet, a parallel UNet) keeps the low-level detail — patterns, text and seams."],
      ["Generate", "A diffusion UNet starts from noise inside the masked area and, step by step, paints the garment onto the person, guided by both garment signals and a detailed text description."],
    ],
    tryT: "Try it — for students",
    tryList: [
      "Create an account (or log in) and open the Closet.",
      "Pick any piece and press Try on — the garment comes with you.",
      "Upload a photo: front-facing, well lit, full or upper body, arms slightly away from the body, plain background.",
      "FITTED checks the photo (format, size, light, focus) and prepares it at 768 × 1024.",
      "Press Generate try-on and compare before / after.",
    ],
    ioT: "Inputs & outputs",
    io: [
      ["Person photo", "JPG, PNG or WEBP up to 10 MB, resized to 768 × 1024"],
      ["Garment", "A product photo from the closet"],
      ["Category", "Upper body · Lower body · Dresses"],
      ["Output", "One generated image, 768 × 1024"],
    ],
    limitsT: "Good to know",
    limits: [
      "Results depend on the photo: crowded backgrounds, crossed arms or strong shadows reduce quality.",
      "It is an image model — it does not measure your body or predict size. Use the size guide for fit.",
      "Generated images can look real but are synthetic; please don't use other people's photos without consent.",
    ],
    privacyT: "Your photo",
    privacy: "Your photo is sent only for the try-on request and is not stored. Only real generated results are saved, to your own try-on history, and you can delete your account at any time.",
    statusT: "Status",
    status: `${m.NAME} integration is pending: the site, the checks and the request pipeline are ready, and the model service will be connected in the next phase. Until then no try-on image is generated — the site never shows a fake result.`,
    links: "Read more", paper: "Paper (arXiv)", code: "Official code",
    cta: "Start trying on", ctaGuest: "Create an account to try",
  },
  ar: {
    eyebrow: "عن الموديل",
    title: `تعرّف على ${m.NAME}.`,
    lead: `التجربة الافتراضية في FITTED مبنية على ${m.NAME} — "${m.FULL_NAME}" (${m.AUTHORS}، ${m.VENUE}). هو موديل انتشار (Diffusion): تعطيه صورة شخص وصورة قطعة، ويولّد صورة جديدة للشخص لابس القطعة، مع الحفاظ على الشعار والطبعة والخامة.`,
    note: "اختيار الموديل للحين مبدئي — بنحدّث هالصفحة لو تغيّر.",
    howT: "كيف يشتغل",
    how: [
      ["يفهم الشخص", "تنحلّل الصورة عشان يعرف وضعية الجسم (DensePose) ومناطق الملابس (Human parsing)، وتنغطّى المنطقة اللي بتتبدّل."],
      ["يقرأ القطعة مرتين", "مشفّر عالي المستوى (IP-Adapter) يفهم وش القطعة — ستايلها ولونها. وشبكة ثانية (GarmentNet، UNet موازية) تحفظ التفاصيل الدقيقة — النقشات والكتابة والخياطة."],
      ["يولّد الصورة", "شبكة UNet تبدأ من تشويش داخل المنطقة المغطّاة، وخطوة بخطوة ترسم القطعة على الشخص، بتوجيه من إشارتين القطعة ووصف نصّي مفصّل."],
    ],
    tryT: "جرّبه — للطلاب",
    tryList: [
      "أنشئ حساب (أو سجّل دخول) وافتح الخزانة.",
      "اختر أي قطعة واضغط «جرّبها» — القطعة تنتقل معك.",
      "ارفع صورة: من الأمام، إضاءتها زينة، كامل الجسم أو نصّه العلوي، اليدين بعيدة شوي عن الجسم، وخلفية سادة.",
      "FITTED يفحص الصورة (الصيغة، الحجم، الإضاءة، الوضوح) ويجهّزها بمقاس 768 × 1024.",
      "اضغط «ولّد التجربة» وقارن قبل / بعد.",
    ],
    ioT: "المدخلات والمخرجات",
    io: [
      ["صورة الشخص", "JPG أو PNG أو WEBP لين 10 ميجا، تتحوّل لـ 768 × 1024"],
      ["القطعة", "صورة المنتج من الخزانة"],
      ["التصنيف", "الجزء العلوي · الجزء السفلي · فساتين"],
      ["المخرج", "صورة وحدة مولّدة، 768 × 1024"],
    ],
    limitsT: "حلو تعرف",
    limits: [
      "النتيجة تعتمد على الصورة: الخلفية الزحمة، أو اليدين المتشابكة، أو الظل القوي تنزّل الجودة.",
      "هو موديل صور — ما يقيس جسمك ولا يتوقّع مقاسك. استخدم دليل المقاسات.",
      "الصور المولّدة ممكن تبان حقيقية بس هي مصطنعة؛ لا تستخدم صور ناس ثانيين بدون إذنهم.",
    ],
    privacyT: "صورتك",
    privacy: "صورتك تنرسل بس لطلب التجربة وما تنحفظ. النتائج الحقيقية المولّدة بس هي اللي تنحفظ في سجل تجاربك، وتقدر تحذف حسابك أي وقت.",
    statusT: "الحالة",
    status: `ربط ${m.NAME} للحين قيد التجهيز: الموقع والفحوصات ومسار الطلب جاهزين، والموديل بينربط في المرحلة الجاية. لين ذاك الوقت ما تتولّد أي صورة — والموقع ما يعرض نتيجة مزيّفة أبد.`,
    links: "اقرأ أكثر", paper: "الورقة العلمية (arXiv)", code: "الكود الرسمي",
    cta: "ابدأ التجربة", ctaGuest: "أنشئ حساب وجرّب",
  },
});

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass rounded-[26px] border border-border p-6 sm:p-8 ${className}`}>{children}</div>;
}

export default async function AboutPage() {
  const lang: Lang = await getLang();
  const user = await currentUser();
  const c = COPY(MODEL)[lang];
  const connected = Boolean(process.env.TRYON_API_URL);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-5 md:px-8">
          <Link href={user ? "/" : "/login"} dir="ltr" className="keep-tracking text-brand text-[18px] font-extrabold tracking-[0.34em]">FITTED</Link>
          <div className="flex items-center gap-2">
            <LangToggle />
            <Link href={user ? "/try-on" : "/signup"} className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_10px_30px_-14px_rgba(70,50,25,.9)] sm:px-5">
              {user ? c.cta : c.ctaGuest}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5 pb-24 md:px-8">
        <section className="pb-12 pt-14">
          <p className="eyebrow">{c.eyebrow}</p>
          <h1 className="display mt-3 text-[clamp(2.2rem,5vw,4rem)]"><span className="text-brand">{c.title}</span></h1>
          <p className="mt-6 max-w-3xl text-[15.5px] leading-relaxed text-muted-foreground">{c.lead}</p>
          <p className="mt-3 text-xs text-amber-700">{c.note}</p>
          <ModelStatus connected={connected} model={MODEL.NAME} />
        </section>

        <Reveal>
          <h2 className="title mb-6">{c.howT}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {c.how.map(([h, p], i) => (
              <Card key={h}>
                <span className="keep-tracking flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p}</p>
              </Card>
            ))}
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <Card className="h-full">
              <h2 className="title mb-5">{c.tryT}</h2>
              <ol className="space-y-3">
                {c.tryList.map((step, i) => (
                  <li key={i} className="flex gap-3 text-[14.5px] leading-relaxed">
                    <span className="keep-tracking mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-brand-violet/60 text-[11px] font-bold text-brand-violet">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full">
              <h2 className="title mb-5">{c.ioT}</h2>
              <dl className="divide-y divide-border">
                {c.io.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[110px_1fr] gap-3 py-3 text-sm sm:grid-cols-[130px_1fr]">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="text-muted-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Reveal>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Reveal>
            <Card className="h-full">
              <h2 className="text-xl font-semibold">{c.limitsT}</h2>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                {c.limits.map((l) => <li key={l} className="flex gap-2"><span className="text-brand-violet">•</span>{l}</li>)}
              </ul>
            </Card>
          </Reveal>
          <Reveal>
            <Card className="h-full">
              <h2 className="text-xl font-semibold">{c.privacyT}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.privacy}</p>
              <h2 className="mt-7 text-xl font-semibold">{c.statusT}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.status}</p>
            </Card>
          </Reveal>
        </div>

        <Reveal>
          <div className="mt-14 flex flex-wrap items-center gap-3">
            <span className="eyebrow me-2">{c.links}</span>
            <a href={MODEL.PAPER_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm transition-colors hover:border-brand-violet">{c.paper} ↗</a>
            <a href={MODEL.CODE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm transition-colors hover:border-brand-violet">{c.code} ↗</a>
          </div>
        </Reveal>
      </main>
      <Footer lang={lang} />
    </>
  );
}
