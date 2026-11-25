"use client";
import dynamic from "next/dynamic";
import emptyCart from "./lottie/empty_cart.json";
import emptyFavorites from "./lottie/empty_favorites.json";
import error from "./lottie/error.json";
import processing from "./lottie/processing.json";
import success from "./lottie/success.json";
import upload from "./lottie/upload.json";

const Player = dynamic(() => import("lottie-react"), { ssr: false });
const DATA = { empty_cart: emptyCart, empty_favorites: emptyFavorites, error, processing, success, upload };
export type LottieName = keyof typeof DATA;

/** Minimal monochrome Lottie animations (assets in components/lottie/). */
export function LottieIcon({ name, size = 140, loop = true, className }: { name: LottieName; size?: number; loop?: boolean; className?: string }) {
  return (
    <div className={className} style={{ width: size, height: size }} aria-hidden>
      <Player animationData={DATA[name]} loop={loop} autoplay />
    </div>
  );
}
