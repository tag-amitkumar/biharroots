import * as addressRepository from "@/features/addresses/repository";
import { AddressValidationError } from "@/features/addresses/errors";

type AddressInput = {
  label?: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  isDefault?: boolean;
};

function validate(input: Partial<AddressInput>) {
  if (!input.line1 || !input.city || !input.state || !input.postalCode || !input.phone) {
    throw new AddressValidationError(
      "line1, city, state, postalCode, and phone are required"
    );
  }
}

export function listAddresses(userId: string) {
  return addressRepository.findAddressesForUser(userId);
}

export async function addAddress(userId: string, input: AddressInput) {
  validate(input);

  if (input.isDefault) {
    await addressRepository.unsetDefaultForUser(userId);
  }

  return addressRepository.createAddress(userId, {
    label: input.label || "Home",
    line1: input.line1,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    phone: input.phone,
    isDefault: Boolean(input.isDefault),
  });
}

export async function editAddress(
  id: string,
  userId: string,
  input: Partial<AddressInput>
) {
  if (input.isDefault) {
    await addressRepository.unsetDefaultForUser(userId);
  }

  await addressRepository.updateAddressForUser(id, userId, input);
}

export function removeAddress(id: string, userId: string) {
  return addressRepository.deleteAddressForUser(id, userId);
}
