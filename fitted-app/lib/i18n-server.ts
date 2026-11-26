import { cookies, headers } from "next/headers";
import { LANG_COOKIE, type Lang } from "./i18n";

/** Language for this request: the saved choice, else the browser's preference. */
export async function getLang(): Promise<Lang> {
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  if (saved === "ar" || saved === "en") return saved;
  const accept = (await headers()).get("accept-language") || "";
  return accept.toLowerCase().startsWith("ar") ? "ar" : "en";
}
