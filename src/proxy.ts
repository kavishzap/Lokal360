import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // 0 (or unset) keeps the office open. 1 sends every page to /maintenance.
  if (process.env.MAINTENANCE_MODE !== "1") return NextResponse.next();
  if (request.nextUrl.pathname === "/maintenance") return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
