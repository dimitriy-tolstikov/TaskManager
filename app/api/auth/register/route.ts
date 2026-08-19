import { NextResponse } from "next/server";

import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { registerUser } from "@/lib/services/authService";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const user = await registerUser(input);
    const token = await createSessionToken({ userId: user.id, email: user.email });
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
