import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    error?: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    expiresIn?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    userId?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
