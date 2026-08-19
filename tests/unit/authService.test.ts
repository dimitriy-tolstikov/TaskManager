import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { ConflictError, UnauthorizedError } from "@/lib/errors";
import { authenticateUser, hashPassword, registerUser } from "@/lib/services/authService";

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const findUnique = vi.mocked(db.user.findUnique);
const create = vi.mocked(db.user.create);

const demoUser = {
  id: "user-1",
  email: "demo@example.com",
  name: "Демо",
  passwordHash: "",
  theme: "system",
  createdAt: new Date(),
};

type CreatedUser = Awaited<ReturnType<typeof db.user.create>>;

function asCreatedUser(user: typeof demoUser): CreatedUser {
  return user as unknown as CreatedUser;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hashPassword", () => {
  it("returns a bcrypt hash that matches the original password", async () => {
    const hash = await hashPassword("secret-password");
    expect(hash).not.toBe("secret-password");
    const bcrypt = await import("bcryptjs");
    await expect(bcrypt.compare("secret-password", hash)).resolves.toBe(true);
  });
});

describe("registerUser", () => {
  const input = { name: "Демо", email: "demo@example.com", password: "demo12345" };

  it("creates a user with a hashed password", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue(asCreatedUser(demoUser));

    const user = await registerUser(input);

    expect(user).toEqual({ id: demoUser.id, email: demoUser.email, name: demoUser.name });
    const data = create.mock.calls[0][0].data;
    expect(data.passwordHash).not.toBe(input.password);
  });

  it("throws ConflictError when the email is already taken", async () => {
    findUnique.mockResolvedValue(asCreatedUser(demoUser));

    await expect(registerUser(input)).rejects.toBeInstanceOf(ConflictError);
    expect(create).not.toHaveBeenCalled();
  });
});

describe("authenticateUser", () => {
  it("throws UnauthorizedError for a wrong password", async () => {
    demoUser.passwordHash = await hashPassword("correct-password");
    findUnique.mockResolvedValue(asCreatedUser(demoUser));

    await expect(
      authenticateUser({ email: demoUser.email, password: "wrong-password" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
