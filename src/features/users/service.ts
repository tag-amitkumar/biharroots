import bcrypt from "bcryptjs";
import * as userRepository from "@/features/users/repository";
import * as notificationService from "@/features/notifications/service";
import { UserValidationError } from "@/features/users/errors";

export function listUsers() {
  return userRepository.findAllUsers();
}

export function updateUserRole(id: string, role: string) {
  if (role !== "user" && role !== "admin") {
    throw new UserValidationError("role must be 'user' or 'admin'");
  }

  return userRepository.updateUserRole(id, role);
}

export function countUsers() {
  return userRepository.countUsers();
}

export function getUserById(id: string) {
  return userRepository.findUserById(id);
}

export function incrementLifetimeSpend(id: string, amount: number) {
  return userRepository.incrementLifetimeSpend(id, amount);
}

export function updateLastLogin(id: string) {
  return userRepository.updateLastLogin(id);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existingUser = await userRepository.findUserByEmail(input.email);

  if (existingUser) {
    throw new UserValidationError("User already exists");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await userRepository.createUser({
    name: input.name,
    email: input.email,
    password: hashedPassword,
  });

  await notificationService.notify(
    user.id,
    `Welcome to Naturecart, ${user.name}! 🌿`
  );

  return user;
}

// Google sign-in: link to an existing account by email (so someone who
// already registered with email/password can also continue with Google),
// or create a new one - a Google-only account has no password, unlike
// registerUser's email/password signup.
export async function findOrCreateGoogleUser(input: {
  email: string;
  name: string;
  image?: string | null;
}) {
  const existingUser = await userRepository.findUserByEmail(input.email);

  if (existingUser) return existingUser;

  const user = await userRepository.createUser({
    name: input.name,
    email: input.email,
    password: null,
    image: input.image ?? null,
  });

  await notificationService.notify(
    user.id,
    `Welcome to Naturecart, ${user.name}! 🌿`
  );

  return user;
}

export async function updateProfile(
  id: string,
  input: { name?: string; phone?: string }
) {
  return userRepository.updateProfile(id, input);
}

export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await userRepository.findUserById(id);

  if (!user) {
    throw new UserValidationError("User not found");
  }

  if (!user.password) {
    throw new UserValidationError(
      "This account signed up with Google and has no password to change"
    );
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    throw new UserValidationError("Current password is incorrect");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new UserValidationError(
      "New password must be at least 6 characters"
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await userRepository.updatePassword(id, hashedPassword);
}
