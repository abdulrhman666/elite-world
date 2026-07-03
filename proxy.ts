import { NextResponse, type NextRequest } from "next/server";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(CUSTOMER_SESSION_COOKIE)) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*"] };
