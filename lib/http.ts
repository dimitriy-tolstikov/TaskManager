import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";

/** 401 shorthand for route handlers: request without a valid session. */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
}

/** Maps domain/validation errors to HTTP responses in a single place. */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 },
    );
  }
  if (error instanceof ValidationError || error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  console.error(error);
  return NextResponse.json({ error: "Что-то пошло не так" }, { status: 500 });
}
