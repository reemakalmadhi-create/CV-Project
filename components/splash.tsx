"use client";
import { useEffect, useState } from "react";

/**
 * Splash: the brand aura fills the screen, FITTED writes in, then we "zoom through"
 * the logo while the image blurs into the site's own backdrop (components/backdrop.tsx),
 * so the hand-off is seamless. Once per visit (sessionStorage); the inline script in
 * <head> decides before first paint, so nothing flashes.
 */
export const SPLASH_HEAD_SCRIPT = `try{if(sessionStorage.getItem("fitted-splash")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.splash="off";else document.documentElement.dataset.splash="on"}catch(e){document.documentElement.dataset.splash="off"}`;

const LETTERS = "FITTED".split("");

export function Splash({ tagline = "Your style, your fit, your way." }: { tagline?: string }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (document.documentElement.dataset.splash === "off") { setGone(true); return; }
    try { sessionStorage.setItem("fitted-splash", "1"); } catch { /* private mode */ }
    const t = setTimeout(() => { setGone(true); document.documentElement.dataset.splash = "off"; }, 3700);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="ft-splash" aria-hidden>
      <div className="sp-img" />
      <div className="sp-vignette" />
      <div className="sp-brand">
        <div className="sp-logo keep-tracking">
          {LETTERS.map((c, i) => <span key={i} style={{ animationDelay: `${0.25 + i * 0.09}s` }}>{c}</span>)}
        </div>
        <div className="sp-line"><span /></div>
        <div className="sp-tag">{tagline}</div>
      </div>
    </div>
  );
}
