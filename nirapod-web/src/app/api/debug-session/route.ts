import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getToken } from "next-auth/jwt";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  return NextResponse.json({
    session: session
      ? {
          hasAccessToken: !!session.accessToken,
          accessTokenPreview: session.accessToken?.slice(0, 20) + "...",
          role: session.user?.role,
          userId: session.user?.id,
          error: session.error,
        }
      : null,
    token: token
      ? {
          hasAccessToken: !!token.accessToken,
          hasRefreshToken: !!token.refreshToken,
          accessTokenExpires: token.accessTokenExpires,
          isExpired: token.accessTokenExpires
            ? Date.now() > (token.accessTokenExpires as number)
            : null,
          expiresIn: token.accessTokenExpires
            ? Math.round(((token.accessTokenExpires as number) - Date.now()) / 1000) + "s"
            : null,
          error: token.error,
        }
      : null,
  });
}
