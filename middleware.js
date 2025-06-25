import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/loginpages",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/categories/:path*",
    "/expenses/:path*",
    "/budget/:path*",
    "/analytics/:path*",
  ],
};