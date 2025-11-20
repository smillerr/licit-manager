import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID!,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    // ✅ LOGIN CON EMAIL Y CONTRASEÑA
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        // ⛔️ Fix TS: credentials puede ser undefined
        if (!credentials?.email || !credentials.password) {
          throw new Error("Email y contraseña son obligatorios");
        }

        const email = credentials.email;
        const password = credentials.password;


        if (email === "admin@test.com" && password === "123456") {
          return {
            id: "1",
            name: "Administrador",
            email: "admin@test.com",
            role: "admin",
          };
        }

        // ❌ LOGIN FALLIDO
        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (account) token.accessToken = account.access_token;
      if (user) token.user = user;
      return token;
    },

    async session({ session, token }) {
      session.user = token.user as any;
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },

    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
});
