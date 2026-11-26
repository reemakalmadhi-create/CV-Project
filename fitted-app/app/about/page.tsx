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
const COPY = (m: typeof MODEL, connected: boolean) => ({
  en: {
    eyebrow: "About the model",
    title: `Meet ${m.SHORT_NAME}.`,
    lead: `FITTED's virtual try-on runs ${m.SHORT_NAME} — "${m.FULL_NAME}" (${m.AUTHORS}, ${m.VENUE}). It is a diffusion model: given a photo of a person and a photo of a garment, it generates a new image of that person wearing that garment, keeping the garment's colour, print and texture.`,
    note: "We use the authors' pretrained model. Our team then fine-tuned its attention layers on the VITON-HD training photos, using the masks our own pipeline builds.",
    howT: "How it works",
    how: [
      ["Mask the old top", "Your photo is split into body parts (face, hair, arms, clothes). The old top, arms and neck are masked out. Face, hair, hands and trousers are protected."],
      ["Photo and garment side by side", "The masked photo and the garment photo are stacked into one image. The model's self-attention copies the garment's colour, print and shape into the masked area. No separate warping network or text prompt is needed."],
      ["Generate", "A Stable Diffusion 1.5 inpainting network removes noise step by step and paints the garment onto you. The original photo is pasted back outside the mask, so your face and background stay the same."],
    ],
    tryT: "Try it — for students",
    tryList: [
      "Create an account (or log in).",
      "Open My closet and upload a garment photo, for example a hoodie you saved from a shop website. Or pick a piece from the shop.",
      "Add one or more poses: front-facing photos of yourself, well lit, arms a little away from the body, plain background.",
      "Open Try-on, choose your poses and a garment, and press Generate. Each pose takes about a minute.",
      "Compare before / after for every pose and download the ones you like.",
    ],
    ioT: "Inputs & outputs",
    io: [
      ["Pose", `JPG, PNG or WEBP up to 10 MB, prepared at ${m.INPUT_SIZE}`],
      ["Garment", "A shop piece, or your own garment photo (a plain product photo works best)"],
      ["Category", "Upper body works best — the model was fine-tuned on tops"],
      ["Output", "One generated image per pose"],
    ],
    limitsT: "Good to know",
    limits: [
      "Results depend on the photo: crowded backgrounds, crossed arms or strong shadows reduce quality.",
      "Garment photos with a person wearing them, or with busy backgrounds, work worse than plain product photos.",
      "A garment much shorter than the top you are wearing, or a raised arm, can come out blurry.",
      "It is an image model — it does not measure your body or predict size. Use the size guide for fit.",
      "Generated images can look real but are synthetic; please don't use other people's photos without consent.",
    ],
    privacyT: "Your photos",
    privacy: "Poses and garment photos you upload are saved to your account so you can reuse them. Only you can see them. Delete any of them from My closet, or delete your account to remove everything.",
    statusT: "Status",
    status: connected
      ? "The model runs on our own machine (not a cloud GPU), so each try-on takes about a minute and requests wait in line."
      : "The try-on service is not connected right now, so no try-on image can be generated. The site never shows a fake result.",
    links: "Read more", paper: "Paper (arXiv)", code: "Model weights",
    cta: "Start trying on", ctaGuest: "Create an account to try",
  },
  ar: {
    eyebrow: "عن الموديل",
    title: `تعرّف على ${m.SHORT_NAME}.`,
    lead: `التجربة الافتراضية في FITTED تشتغل بـ ${m.SHORT_NAME} — "${m.FULL_NAME}" (${m.AUTHORS}، ${m.VENUE}). هو موديل انتشار (Diffusion): تعطيه صورة شخص وصورة قطعة، ويولّد صورة جديدة للشخص لابس القطعة، مع الحفاظ على اللون والطبعة والخامة.`,
    note: "نستخدم الموديل المدرّب مسبقاً من أصحابه. بعدها فريقنا درّب طبقات الانتباه فيه (Fine-tuning) على صور تدريب VITON-HD، باستخدام الأقنعة اللي يسويها نظامنا.",
    howT: "كيف يشتغل",
    how: [
      ["يغطّي القطعة القديمة", "تنقسم صورتك لأجزاء الجسم (الوجه، الشعر، اليدين، الملابس). تنغطّى القطعة العلوية القديمة والذراعين والرقبة، ويبقى الوجه والشعر والكفّين والبنطلون مثل ما هي."],
      ["الصورة والقطعة جنب بعض", "الصورة المغطّاة وصورة القطعة تنحط في صورة وحدة. طبقات الانتباه في الموديل تنقل لون القطعة وطبعتها وشكلها للمنطقة المغطّاة، بدون شبكة تشويه منفصلة وبدون وصف نصّي."],
      ["يولّد الصورة", "شبكة Stable Diffusion 1.5 للتعبئة تشيل التشويش خطوة بخطوة وترسم القطعة عليك. وبعدها ترجع الصورة الأصلية برّا المنطقة المغطّاة، فوجهك والخلفية يبقون نفسهم."],
    ],
    tryT: "جرّبه — للطلاب",
    tryList: [
      "أنشئ حساب (أو سجّل دخول).",
      "افتح «خزانتي» وارفع صورة قطعة، مثلاً هودي حفظت صورته من موقع متجر. أو اختر قطعة من المتجر.",
      "أضف صورة أو أكثر لك: من الأمام، إضاءتها زينة، اليدين بعيدة شوي عن الجسم، وخلفية سادة.",
      "افتح «التجربة الافتراضية»، اختر صورك والقطعة، واضغط «ولّد». كل صورة تاخذ تقريباً دقيقة.",
      "قارن قبل / بعد لكل صورة، ونزّل اللي يعجبك.",
    ],
    ioT: "المدخلات والمخرجات",
    io: [
      ["صورتك", `JPG أو PNG أو WEBP لين 10 ميجا، تتجهّز بمقاس ${m.INPUT_SIZE}`],
      ["القطعة", "قطعة من المتجر، أو صورة قطعتك (صورة المنتج على خلفية سادة أفضل)"],
      ["التصنيف", "الجزء العلوي أفضل — الموديل متدرّب على القطع العلوية"],
      ["المخرج", "صورة مولّدة لكل وضعية"],
    ],
    limitsT: "حلو تعرف",
    limits: [
      "النتيجة تعتمد على الصورة: الخلفية الزحمة، أو اليدين المتشابكة، أو الظل القوي تنزّل الجودة.",
      "صور القطع اللي فيها شخص لابسها أو خلفيتها زحمة تطلع أسوأ من صور المنتج السادة.",
      "القطعة اللي أقصر بكثير من اللي لابسها، أو اليد المرفوعة، ممكن تطلع مغبّشة.",
      "هو موديل صور — ما يقيس جسمك ولا يتوقّع مقاسك. استخدم دليل المقاسات.",
      "الصور المولّدة ممكن تبان حقيقية بس هي مصطنعة؛ لا تستخدم صور ناس ثانيين بدون إذنهم.",
    ],
    privacyT: "صورك",
    privacy: "الصور والقطع اللي ترفعها تنحفظ في حسابك عشان تستخدمها مرة ثانية، وما يشوفها غيرك. تقدر تحذف أي وحدة من «خزانتي»، أو تحذف حسابك وينشال كل شي.",
    statusT: "الحالة",
    status: connected
      ? "الموديل يشتغل على جهازنا (مو سيرفر GPU)، فكل تجربة تاخذ تقريباً دقيقة والطلبات تنتظر دورها."
      : "خدمة التجربة مو متصلة الحين، فما نقدر نولّد صور. والموقع ما يعرض نتيجة مزيّفة أبد.",
    links: "اقرأ أكثر", paper: "الورقة العلمية (arXiv)", code: "أوزان الموديل",
    cta: "ابدأ التجربة", ctaGuest: "أنشئ حساب وجرّب",
  },
});

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass rounded-[26px] border border-border p-6 sm:p-8 ${className}`}>{children}</div>;
}

export default async function AboutPage() {
  const lang: Lang = await getLang();
  const user = await currentUser();
  const connected = Boolean(process.env.TRYON_API_URL);
  const c = COPY(MODEL, connected)[lang];

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
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{c.note}</p>
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
