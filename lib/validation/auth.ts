import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Введите имя").max(100),
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
