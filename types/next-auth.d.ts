import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
  
      accessToken?: string | null;
    };
    accessToken?: string | null;
  }

  interface User {
    accessToken?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string | null;
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accessToken?: string | null;
    };
  }
}
