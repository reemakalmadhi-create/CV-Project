import { NextResponse, type NextRequest } from "next/server";

/**
 * No login screen. A visitor without a session cookie gets a private guest account
 * (/api/auth/guest) and lands on the page they asked for. /login and /signup now just
 * lead into the site. The cookie's signature is still fully verified on the server
 * in app/(shop)/layout.tsx and in every API route.
 */
const PUBLIC = ["/about"];
const AUTH_PAGES = ["/login", "/signup"];

function to(req: NextRequest, path: string, next?: string) {
  const url = req.nextUrl.clone();   // same host the visitor used (localhost or the tunnel)
  url.pathname = path;
  url.search = next ? `?next=${encodeURIComponent(next)}` : "";
  return NextResponse.redirect(url);
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("fitted_session")?.value);
  if (AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return hasSession ? to(req, "/") : to(req, "/api/auth/guest", "/");
  }
  if (!hasSession && !PUBLIC.some((p) => pathname.startsWith(p))) {
    return to(req, "/api/auth/guest", pathname + search);
  }
  return NextResponse.next();
}

export const config = {
  // everything except API routes, Next internals and static files
  matcher: ["/((?!api|_next/static|_next/image|icon.png|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|json)$).*)"],
};
