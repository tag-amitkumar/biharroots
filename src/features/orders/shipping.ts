export const SHIPPING_OPTIONS = [
  { id: "standard", label: "Standard Delivery (3-5 days)", cost: 0 },
  { id: "express", label: "Express Delivery (1-2 days)", cost: 99 },
] as const;

export type ShippingOptionId = (typeof SHIPPING_OPTIONS)[number]["id"];

// Spend enough and Express upgrades to free, same incentive as the classic
// "free shipping over ₹X" banner - Standard is already free, so this is the
// only threshold that matters.
export const FREE_EXPRESS_SHIPPING_THRESHOLD = 999;

export function findShippingOption(id: string | undefined) {
  return SHIPPING_OPTIONS.find((option) => option.id === id) ?? SHIPPING_OPTIONS[0];
}

// Single source of truth for what shipping actually costs, so the cart's
// progress-bar preview, the checkout display, and the server-side order
// total (never trusting a client-supplied cost) all agree with each other.
export function getShippingCost(
  id: string | undefined,
  subtotal: number,
  freeShippingOverride = false
) {
  if (freeShippingOverride) return 0;

  const option = findShippingOption(id);

  if (option.id === "express" && subtotal >= FREE_EXPRESS_SHIPPING_THRESHOLD) {
    return 0;
  }

  return option.cost;
}
