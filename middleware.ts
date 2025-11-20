export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!auth/login|api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
