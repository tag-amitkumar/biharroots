import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderValidationError } from "@/features/orders/errors";

vi.mock("@/features/orders/repository", () => ({
  createOrder: vi.fn((data) => ({ id: "order-1", orderId: "public-order-1", ...data })),
  findOrdersForUser: vi.fn(),
  findOrderByOrderId: vi.fn(),
  findAllOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  updateOrderCoinsEarned: vi.fn(),
  findRecentOrdersWithProductsForUser: vi.fn(),
}));

vi.mock("@/features/products/repository", () => ({
  findProductsByIds: vi.fn(),
}));

vi.mock("@/features/coupons/repository", () => ({
  findActiveCouponByCode: vi.fn(),
  countRedemptionsForCoupon: vi.fn(),
  countRedemptionsForCouponByUser: vi.fn(),
  createCouponRedemption: vi.fn((data) => ({ id: "redemption-1", ...data })),
}));

vi.mock("@/features/wallet/service", () => ({
  previewRedemption: vi.fn(() => ({ coins: 0, discount: 0, redemptionValue: 0.5 })),
  redeemCoins: vi.fn(),
  earnCoins: vi.fn(),
}));

vi.mock("@/features/loyalty/service", () => ({
  getConfig: vi.fn(() => ({ coinsPerRupee: 0.1 })),
}));

vi.mock("@/features/users/service", () => ({
  incrementLifetimeSpend: vi.fn(),
}));

vi.mock("@/features/membership/service", () => ({
  getMembershipForUser: vi.fn(() => ({ tier: null, nextTier: null, lifetimeSpend: 0, amountToNextTier: 0 })),
}));

import * as orderRepository from "@/features/orders/repository";
import * as productRepository from "@/features/products/repository";
import * as couponRepository from "@/features/coupons/repository";
import * as walletService from "@/features/wallet/service";
import * as userService from "@/features/users/service";
import * as membershipService from "@/features/membership/service";
import { placeOrder, getRecentlyPurchasedProducts } from "@/features/orders/service";

const REAL_PRODUCT = {
  id: "prod-1",
  name: "Organic Avocado",
  price: 40,
  description: "",
  image: "",
  category: "",
  stock: 10,
  images: "",
  specifications: "{}",
  createdAt: new Date(),
  updatedAt: new Date(),
  variants: [] as { id: string; productId: string; label: string; price: number; stock: number }[],
  brand: null as string | null,
  mrp: null as number | null,
  organicCertified: false,
  vegan: false,
  glutenFree: false,
  sugarFree: false,
  ecoFriendly: false,
  countryOfOrigin: null as string | null,
  weight: null as string | null,
  featured: false,
  seoTitle: null as string | null,
  seoMetaDescription: null as string | null,
  detailedDescription: null as string | null,
  highlights: "[]",
  keyBenefits: "[]",
  ingredients: null as string | null,
  usageInstructions: null as string | null,
  storageInstructions: null as string | null,
  faqs: "[]",
  seoKeywords: "[]",
  tags: "[]",
  imageAlt: null as string | null,
};

const VALID_INPUT = {
  customer: "Jane Doe",
  phone: "9999999999",
  email: "jane@example.com",
  address: "1 Main St",
  items: [{ id: "prod-1", quantity: 2 }],
};

beforeEach(() => {
  vi.mocked(productRepository.findProductsByIds).mockReset();
  vi.mocked(orderRepository.createOrder).mockClear();
  vi.mocked(couponRepository.findActiveCouponByCode).mockReset();
  vi.mocked(walletService.earnCoins).mockClear();
  vi.mocked(userService.incrementLifetimeSpend).mockClear();
  vi.mocked(membershipService.getMembershipForUser).mockReset();
  vi.mocked(membershipService.getMembershipForUser).mockResolvedValue({
    tier: null,
    nextTier: null,
    lifetimeSpend: 0,
    amountToNextTier: 0,
  });
});

describe("placeOrder", () => {
  it("rejects a request missing required customer details", async () => {
    await expect(
      placeOrder({ ...VALID_INPUT, customer: "" })
    ).rejects.toThrow(OrderValidationError);
  });

  it("rejects a request with no items", async () => {
    await expect(
      placeOrder({ ...VALID_INPUT, items: [] })
    ).rejects.toThrow(OrderValidationError);
  });

  it("rejects an item referencing a product that doesn't exist", async () => {
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([]);

    await expect(placeOrder(VALID_INPUT)).rejects.toThrow(
      OrderValidationError
    );
  });

  it("prices the order from the real product price, ignoring any client-supplied price", async () => {
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      REAL_PRODUCT,
    ]);

    await placeOrder({
      ...VALID_INPUT,
      items: [
        // @ts-expect-error - simulating a tampered client payload
        { id: "prod-1", price: 1, quantity: 2 },
      ],
    });

    expect(orderRepository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 80, // real price (40) * quantity (2), not the tampered price (1) * 2
        items: {
          create: [
            { productId: "prod-1", name: "Organic Avocado", price: 40, quantity: 2 },
          ],
        },
      })
    );
  });

  it("sums the amount across multiple line items", async () => {
    const secondProduct = { ...REAL_PRODUCT, id: "prod-2", price: 10 };

    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      REAL_PRODUCT,
      secondProduct,
    ]);

    await placeOrder({
      ...VALID_INPUT,
      items: [
        { id: "prod-1", quantity: 2 }, // 40 * 2 = 80
        { id: "prod-2", quantity: 3 }, // 10 * 3 = 30
      ],
    });

    expect(orderRepository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 110 })
    );
  });

  it("prices a variant line item from the variant's own price, not the base product price", async () => {
    const productWithVariant = {
      ...REAL_PRODUCT,
      variants: [
        { id: "variant-1", productId: "prod-1", label: "1kg", price: 70, stock: 5 },
      ],
    };

    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      productWithVariant,
    ]);

    await placeOrder({
      ...VALID_INPUT,
      items: [{ id: "prod-1", variantId: "variant-1", quantity: 2 }],
    });

    expect(orderRepository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 140, // variant price (70) * quantity (2), not the base price (40)
        items: {
          create: [
            { productId: "prod-1", name: "Organic Avocado (1kg)", price: 70, quantity: 2 },
          ],
        },
      })
    );
  });

  it("rejects a variantId that doesn't belong to the product", async () => {
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      REAL_PRODUCT,
    ]);

    await expect(
      placeOrder({
        ...VALID_INPUT,
        items: [{ id: "prod-1", variantId: "nonexistent", quantity: 1 }],
      })
    ).rejects.toThrow(OrderValidationError);
  });

  it("applies the real discount looked up server-side from the coupon code, ignoring any client-supplied discount", async () => {
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      REAL_PRODUCT,
    ]);

    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue({
      id: "coupon-1",
      code: "SAVE10",
      type: "fixed",
      value: 10,
      active: true,
      minOrderAmount: 0,
      expiresAt: null,
      maxRedemptions: null,
      perUserLimit: null,
      createdAt: new Date(),
    });

    await placeOrder({
      ...VALID_INPUT,
      couponCode: "SAVE10",
      items: [{ id: "prod-1", quantity: 2 }],
      // @ts-expect-error - simulating a tampered client payload
      discount: 999999,
    });

    expect(orderRepository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 70, // subtotal (80) - real discount (10), not the tampered 999999
        discount: 10,
        couponCode: "SAVE10",
      })
    );
  });

  it("rejects an invalid or inactive coupon code", async () => {
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      REAL_PRODUCT,
    ]);

    vi.mocked(couponRepository.findActiveCouponByCode).mockResolvedValue(null);

    await expect(
      placeOrder({ ...VALID_INPUT, couponCode: "FAKE" })
    ).rejects.toThrow(OrderValidationError);
  });

  it("adds the real shipping option cost looked up server-side from the shipping method id", async () => {
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      REAL_PRODUCT,
    ]);

    await placeOrder({
      ...VALID_INPUT,
      items: [{ id: "prod-1", quantity: 2 }], // subtotal 80
      shippingMethod: "express",
    });

    expect(orderRepository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 179, // subtotal (80) + express cost (99)
        shippingMethod: "Express Delivery (1-2 days)",
      })
    );
  });

  it("defaults to standard (free) shipping when no shipping method is given", async () => {
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      REAL_PRODUCT,
    ]);

    await placeOrder({
      ...VALID_INPUT,
      items: [{ id: "prod-1", quantity: 2 }],
    });

    expect(orderRepository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 80 })
    );
  });

  it("earns NatureCoins from the final charged amount and updates lifetime spend, only for a signed-in user", async () => {
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      REAL_PRODUCT,
    ]);

    await placeOrder({
      ...VALID_INPUT,
      userId: "user-1",
      items: [{ id: "prod-1", quantity: 2 }], // amount = 80, coinsPerRupee = 0.1 -> 8 coins
    });

    expect(walletService.earnCoins).toHaveBeenCalledWith(
      "user-1",
      8,
      "purchase",
      expect.objectContaining({ orderId: "order-1" })
    );
    expect(userService.incrementLifetimeSpend).toHaveBeenCalledWith("user-1", 80);
  });

  it("does not touch the wallet or lifetime spend for a guest checkout", async () => {
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      REAL_PRODUCT,
    ]);

    await placeOrder({
      ...VALID_INPUT,
      items: [{ id: "prod-1", quantity: 2 }],
    });

    expect(walletService.earnCoins).not.toHaveBeenCalled();
    expect(userService.incrementLifetimeSpend).not.toHaveBeenCalled();
  });

  it("applies the member's tier discount and free shipping, and multiplies coin earning", async () => {
    vi.mocked(productRepository.findProductsByIds).mockResolvedValue([
      REAL_PRODUCT,
    ]);

    vi.mocked(membershipService.getMembershipForUser).mockResolvedValue({
      tier: {
        id: "tier-gold",
        name: "Gold",
        minSpend: 5000,
        coinMultiplier: 1.5,
        discountPercent: 10,
        freeShipping: true,
        earlyAccess: true,
        birthdayBonus: 200,
        sortOrder: 2,
        badgeColor: "#d97706",
        updatedAt: new Date(),
      },
      nextTier: null,
      lifetimeSpend: 6000,
      amountToNextTier: 0,
    });

    // subtotal 80, 10% Gold discount = 8, free shipping overrides express's ₹99
    await placeOrder({
      ...VALID_INPUT,
      userId: "user-1",
      items: [{ id: "prod-1", quantity: 2 }],
      shippingMethod: "express",
    });

    expect(orderRepository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 72, discount: 8 })
    );

    // amount 72 * coinsPerRupee (0.1) * Gold multiplier (1.5) = 10.8 -> floor 10
    expect(walletService.earnCoins).toHaveBeenCalledWith(
      "user-1",
      10,
      "purchase",
      expect.any(Object)
    );
  });
});

describe("getRecentlyPurchasedProducts", () => {
  it("returns distinct products, most-recently-purchased first", async () => {
    vi.mocked(orderRepository.findRecentOrdersWithProductsForUser).mockResolvedValue([
      {
        id: "order-2",
        items: [
          { id: "item-2", product: { id: "prod-2", name: "Second" } },
        ],
      },
      {
        id: "order-1",
        items: [
          { id: "item-1", product: { id: "prod-1", name: "First" } },
        ],
      },
    ] as never);

    const result = await getRecentlyPurchasedProducts("user-1");

    expect(result.map((p) => p.id)).toEqual(["prod-2", "prod-1"]);
  });

  it("deduplicates a product bought in multiple orders, keeping only the most recent", async () => {
    vi.mocked(orderRepository.findRecentOrdersWithProductsForUser).mockResolvedValue([
      { id: "order-2", items: [{ id: "item-2", product: { id: "prod-1", name: "First" } }] },
      { id: "order-1", items: [{ id: "item-1", product: { id: "prod-1", name: "First" } }] },
    ] as never);

    const result = await getRecentlyPurchasedProducts("user-1");

    expect(result).toHaveLength(1);
  });

  it("skips order items whose product was later deleted", async () => {
    vi.mocked(orderRepository.findRecentOrdersWithProductsForUser).mockResolvedValue([
      {
        id: "order-1",
        items: [
          { id: "item-1", product: null },
          { id: "item-2", product: { id: "prod-1", name: "Still exists" } },
        ],
      },
    ] as never);

    const result = await getRecentlyPurchasedProducts("user-1");

    expect(result.map((p) => p.id)).toEqual(["prod-1"]);
  });
});
