import { describe, it, expect } from "vitest";
import { getShippingCost, FREE_EXPRESS_SHIPPING_THRESHOLD } from "@/features/orders/shipping";

describe("getShippingCost", () => {
  it("charges the express fee below the free-shipping threshold", () => {
    expect(getShippingCost("express", FREE_EXPRESS_SHIPPING_THRESHOLD - 1)).toBe(99);
  });

  it("makes express free once the subtotal reaches the threshold", () => {
    expect(getShippingCost("express", FREE_EXPRESS_SHIPPING_THRESHOLD)).toBe(0);
    expect(getShippingCost("express", FREE_EXPRESS_SHIPPING_THRESHOLD + 500)).toBe(0);
  });

  it("standard shipping is always free regardless of subtotal", () => {
    expect(getShippingCost("standard", 0)).toBe(0);
    expect(getShippingCost("standard", 5000)).toBe(0);
  });

  it("a membership free-shipping override always wins, even below the threshold", () => {
    expect(getShippingCost("express", 10, true)).toBe(0);
  });

  it("defaults to the standard option for an unknown/missing shipping method", () => {
    expect(getShippingCost(undefined, 10)).toBe(0);
    expect(getShippingCost("bogus", 10)).toBe(0);
  });
});
