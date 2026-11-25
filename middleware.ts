import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast gate: no session cookie -> send to /login (the cookie's signature is fully
 * verified on the server in app/(shop)/layout.tsx and in every API route).
 */
const PUBLIC = ["/login", "/signup", "/about"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("fitted_session")?.value);
  const isPublic = PUBLIC.some((p) => pathname.startsWith(p));
  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // everything except API routes, Next internals and static files
  matcher: ["/((?!api|_next/static|_next/image|icon.png|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|json)$).*)"],
};
