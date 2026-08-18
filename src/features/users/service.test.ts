import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserValidationError } from "@/features/users/errors";

vi.mock("@/features/users/repository", () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn((data) => ({ id: "user-1", ...data })),
  updateUserRole: vi.fn((id, role) => ({ id, role })),
  findAllUsers: vi.fn(),
  countUsers: vi.fn(),
  findUserById: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock("@/features/notifications/service", () => ({
  notify: vi.fn(),
}));

import * as userRepository from "@/features/users/repository";
import * as notificationService from "@/features/notifications/service";
import {
  registerUser,
  updateUserRole,
  findOrCreateGoogleUser,
  changePassword,
} from "@/features/users/service";

function realUser(overrides: Partial<{ id: string; password: string | null }> = {}) {
  return {
    id: "existing-user",
    name: "Existing",
    email: "jane@example.com",
    password: "hashed",
    role: "user",
    image: null,
    phone: null,
    birthday: null,
    lifetimeSpend: 0,
    referralCode: null,
    wishlistShareToken: null,
    lastLoginAt: null,
    lastLoginBonusAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(userRepository.findUserByEmail).mockReset();
  vi.mocked(userRepository.createUser).mockClear();
  vi.mocked(userRepository.updateUserRole).mockClear();
  vi.mocked(userRepository.findUserById).mockReset();
  vi.mocked(userRepository.updatePassword).mockReset();
  vi.mocked(notificationService.notify).mockClear();
});

describe("updateUserRole", () => {
  it("rejects a role that isn't 'user' or 'admin'", () => {
    expect(() => updateUserRole("user-1", "superadmin")).toThrow(
      UserValidationError
    );
  });

  it("accepts 'admin'", () => {
    updateUserRole("user-1", "admin");

    expect(userRepository.updateUserRole).toHaveBeenCalledWith(
      "user-1",
      "admin"
    );
  });
});

describe("registerUser", () => {
  it("rejects registration when the email is already taken", async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue({
      id: "existing-user",
      name: "Existing",
      email: "jane@example.com",
      password: "hashed",
      role: "user",
      image: null,
      phone: null,
      birthday: null,
      lifetimeSpend: 0,
      referralCode: null,
      wishlistShareToken: null,
      lastLoginAt: null,
      lastLoginBonusAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      registerUser({
        name: "Jane",
        email: "jane@example.com",
        password: "secret123",
      })
    ).rejects.toThrow(UserValidationError);

    expect(userRepository.createUser).not.toHaveBeenCalled();
  });

  it("stores a hashed password, never the plaintext one", async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

    await registerUser({
      name: "Jane",
      email: "jane@example.com",
      password: "secret123",
    });

    expect(userRepository.createUser).toHaveBeenCalledTimes(1);

    const createdData = vi.mocked(userRepository.createUser).mock
      .calls[0][0];

    expect(createdData.password).not.toBe("secret123");
    expect(createdData.password!.length).toBeGreaterThan(0);
  });

  it("sends a welcome notification to the new user", async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

    await registerUser({
      name: "Jane",
      email: "jane@example.com",
      password: "secret123",
    });

    expect(notificationService.notify).toHaveBeenCalledWith(
      "user-1",
      expect.stringContaining("Jane")
    );
  });
});

describe("findOrCreateGoogleUser", () => {
  it("links to an existing account by email instead of creating a duplicate", async () => {
    const existing = realUser();
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(existing);

    const result = await findOrCreateGoogleUser({
      email: "jane@example.com",
      name: "Jane From Google",
      image: "https://lh3.googleusercontent.com/pic.jpg",
    });

    expect(result).toBe(existing);
    expect(userRepository.createUser).not.toHaveBeenCalled();
    expect(notificationService.notify).not.toHaveBeenCalled();
  });

  it("creates a new password-less account when no user exists for that email", async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

    await findOrCreateGoogleUser({
      email: "new@example.com",
      name: "New Googler",
      image: "https://lh3.googleusercontent.com/pic.jpg",
    });

    expect(userRepository.createUser).toHaveBeenCalledWith({
      name: "New Googler",
      email: "new@example.com",
      password: null,
      image: "https://lh3.googleusercontent.com/pic.jpg",
    });
  });

  it("sends the same welcome notification a fresh email/password signup gets", async () => {
    vi.mocked(userRepository.findUserByEmail).mockResolvedValue(null);

    await findOrCreateGoogleUser({ email: "new@example.com", name: "New Googler" });

    expect(notificationService.notify).toHaveBeenCalledWith(
      "user-1",
      expect.stringContaining("New Googler")
    );
  });
});

describe("changePassword", () => {
  it("rejects with a clear message for a Google-only account that has no password", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue(realUser({ password: null }));

    await expect(changePassword("existing-user", "anything", "newpassword123")).rejects.toThrow(
      /Google/
    );
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("rejects an incorrect current password", async () => {
    vi.mocked(userRepository.findUserById).mockResolvedValue(realUser());

    await expect(
      changePassword("existing-user", "wrong-password", "newpassword123")
    ).rejects.toThrow(UserValidationError);
  });
});
