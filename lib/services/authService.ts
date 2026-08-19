import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { ConflictError, UnauthorizedError } from "@/lib/errors";
import type { LoginInput, RegisterInput } from "@/lib/validation/auth";

const PASSWORD_SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("Пользователь с таким email уже существует");
  }
  const passwordHash = await hashPassword(input.password);
  const user = await db.user.create({
    data: { email: input.email, name: input.name, passwordHash },
  });
  return { id: user.id, email: user.email, name: user.name };
}

export async function authenticateUser(input: LoginInput): Promise<AuthUser> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError("Неверный email или пароль");
  }
  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Неверный email или пароль");
  }
  return { id: user.id, email: user.email, name: user.name };
}
