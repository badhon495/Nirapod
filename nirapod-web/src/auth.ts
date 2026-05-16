import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await axios.post(`${API_URL}/api/v1/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });
          const data = res.data;
          return {
            id: data.userId,
            name: data.name,
            email: credentials.email as string,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            role: data.role,
            expiresIn: data.expiresIn,
          };
        } catch {
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.userId = user.id;
        token.accessTokenExpires = Date.now() + ((user as any).expiresIn ?? 900) * 1000;
      }

      if (account?.provider === "google" && account.id_token) {
        try {
          const res = await axios.post(`${API_URL}/api/v1/auth/google`, {
            idToken: account.id_token,
          });
          const data = res.data;
          token.accessToken = data.accessToken;
          token.refreshToken = data.refreshToken;
          token.role = data.role;
          token.userId = data.userId;
          token.accessTokenExpires = Date.now() + data.expiresIn * 1000;
        } catch {
          token.error = "GoogleAuthError";
        }
      }

      if (token.accessToken && token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Refresh access token using stored refresh token (server-side — no cookies available)
      try {
        const res = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          {
            headers: token.refreshToken
              ? { Cookie: `refresh_token=${token.refreshToken}` }
              : {},
          }
        );
        const data = res.data;
        return {
          ...token,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? token.refreshToken,
          accessTokenExpires: Date.now() + data.expiresIn * 1000,
        };
      } catch {
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.role = token.role as string;
      session.user.id = token.userId as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },
});
