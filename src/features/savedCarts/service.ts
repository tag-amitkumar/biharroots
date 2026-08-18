import * as savedCartRepository from "@/features/savedCarts/repository";
import { SavedCartValidationError } from "@/features/savedCarts/errors";

type CartItemInput = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
};

export function listSavedCarts(userId: string) {
  return savedCartRepository.findSavedCartsForUser(userId);
}

export function saveCart(userId: string, name: string, items: CartItemInput[]) {
  if (!name.trim()) {
    throw new SavedCartValidationError("Please give this cart a name");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new SavedCartValidationError("Cannot save an empty cart");
  }

  return savedCartRepository.createSavedCart(
    userId,
    name.trim(),
    JSON.stringify(items)
  );
}

export function removeSavedCart(id: string, userId: string) {
  return savedCartRepository.deleteSavedCart(id, userId);
}
