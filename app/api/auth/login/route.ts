import { NextResponse } from "next/server";

import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { authenticateUser } from "@/lib/services/authService";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await authenticateUser(input);
    const token = await createSessionToken({ userId: user.id, email: user.email });
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
