import * as orderRepository from "@/features/orders/repository";
import * as productRepository from "@/features/products/repository";
import * as notificationService from "@/features/notifications/service";
import * as couponService from "@/features/coupons/service";
import * as walletService from "@/features/wallet/service";
import * as loyaltyService from "@/features/loyalty/service";
import * as userService from "@/features/users/service";
import * as membershipService from "@/features/membership/service";
import { OrderValidationError } from "@/features/orders/errors";
import { CouponValidationError } from "@/features/coupons/errors";
import { findShippingOption, getShippingCost } from "@/features/orders/shipping";

export function getOrdersForUser(userId: string, email: string) {
  return orderRepository.findOrdersForUser(userId, email);
}

// "Buy It Again": distinct products from a customer's real order history,
// most-recently-purchased first. Items whose product was later deleted
// (OrderItem.productId is nullable for exactly this reason) are skipped
// rather than shown as a broken link.
export async function getRecentlyPurchasedProducts(userId: string, limit = 8) {
  const orders = await orderRepository.findRecentOrdersWithProductsForUser(userId, limit * 3);

  const seen = new Set<string>();
  const products = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.product || seen.has(item.product.id)) continue;

      seen.add(item.product.id);
      products.push(item.product);

      if (products.length >= limit) return products;
    }
  }

  return products;
}

export function getAllOrders() {
  return orderRepository.findAllOrders();
}

export function getOrderByOrderId(orderId: string) {
  return orderRepository.findOrderByOrderId(orderId);
}

type PlaceOrderInput = {
  customer: string;
  phone: string;
  email: string;
  address: string;
  userId?: string;
  couponCode?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  redeemCoins?: number;
  items: { id: string; quantity: number; variantId?: string }[];
};

export async function placeOrder(input: PlaceOrderInput) {
  if (
    !input.customer ||
    !input.phone ||
    !input.email ||
    !input.address ||
    !Array.isArray(input.items) ||
    input.items.length === 0
  ) {
    throw new OrderValidationError("Missing required order details");
  }

  const products = await productRepository.findProductsByIds(
    input.items.map((item) => item.id)
  );

  const productById = new Map(products.map((product) => [product.id, product]));

  const hasUnknownProduct = input.items.some(
    (item) => !productById.has(item.id)
  );

  if (hasUnknownProduct) {
    throw new OrderValidationError("One or more products no longer exist");
  }

  const hasUnknownVariant = input.items.some((item) => {
    if (!item.variantId) return false;
    const product = productById.get(item.id)!;
    return !product.variants.some((variant) => variant.id === item.variantId);
  });

  if (hasUnknownVariant) {
    throw new OrderValidationError("One or more product variants no longer exist");
  }

  // Price and name come from the DB (product or, if selected, its variant),
  // not the client, so a tampered request can't under-report the amount owed.
  const orderItems: { productId: string; name: string; price: number; quantity: number }[] =
    input.items.map((item) => {
      const product = productById.get(item.id)!;
      const quantity = Number(item.quantity) || 0;

      if (item.variantId) {
        const variant = product.variants.find(
          (v) => v.id === item.variantId
        )!;

        return {
          productId: product.id,
          name: `${product.name} (${variant.label})`,
          price: variant.price,
          quantity,
        };
      }

      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
      };
    });

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // NatureClub membership benefits (tier discount, coin multiplier, free
  // shipping) are derived from the user's real lifetimeSpend server-side —
  // there's no client input for any of this, so nothing to validate against
  // a tampered request here.
  const membership = input.userId
    ? await membershipService.getMembershipForUser(input.userId)
    : null;

  const membershipDiscount = membership?.tier
    ? Math.floor((subtotal * membership.tier.discountPercent) / 100)
    : 0;

  // Discount and shipping cost are always recomputed from the coupon code
  // and shipping option id server-side — never trust a client-supplied
  // discount or shipping cost, same rule as product/variant pricing above.
  let couponDiscount = 0;
  let appliedCouponId: string | null = null;

  if (input.couponCode) {
    try {
      const result = await couponService.validateCoupon(
        input.couponCode,
        subtotal,
        input.userId
      );

      couponDiscount = result.discount;
      appliedCouponId = result.id;
    } catch (error) {
      if (error instanceof CouponValidationError) {
        throw new OrderValidationError(error.message);
      }

      throw error;
    }
  }

  const shippingOption = findShippingOption(input.shippingMethod);
  const shippingCost = getShippingCost(
    input.shippingMethod,
    subtotal,
    Boolean(membership?.tier?.freeShipping)
  );

  // NatureCoin redemption: same rule as everything above — the requested
  // coin count is only ever a hint. The real, safe discount (capped by
  // wallet balance, the configured minimum, and the remaining payable
  // amount) is always recomputed server-side, never trusted from the client.
  let coinsRedeemed = 0;
  let redemptionDiscount = 0;

  if (input.userId && input.redeemCoins && input.redeemCoins > 0) {
    const remainingAfterOtherDiscounts =
      Math.max(0, subtotal - couponDiscount - membershipDiscount) + shippingCost;

    const preview = await walletService.previewRedemption(
      input.userId,
      input.redeemCoins,
      remainingAfterOtherDiscounts
    );

    coinsRedeemed = preview.coins;
    redemptionDiscount = preview.discount;
  }

  const amount = Math.max(
    0,
    subtotal - couponDiscount - membershipDiscount - redemptionDiscount + shippingCost
  );

  const order = await orderRepository.createOrder({
    customer: input.customer,
    phone: input.phone,
    email: input.email,
    address: input.address,
    amount,
    discount: couponDiscount + membershipDiscount + redemptionDiscount,
    coinsRedeemed,
    couponCode: input.couponCode || null,
    shippingMethod: shippingOption.label,
    paymentId: "COD",
    orderId: crypto.randomUUID(),
    status: "Pending",

    ...(input.userId ? { user: { connect: { id: input.userId } } } : {}),

    items: {
      create: orderItems,
    },
  });

  if (appliedCouponId) {
    await couponService.recordCouponRedemption(appliedCouponId, input.userId ?? null, order.id);
  }

  if (input.userId) {
    if (coinsRedeemed > 0) {
      await walletService.redeemCoins(input.userId, coinsRedeemed, order.id);
    }

    const config = await loyaltyService.getConfig();
    const coinMultiplier = membership?.tier?.coinMultiplier ?? 1;
    const coinsEarned = Math.floor(amount * config.coinsPerRupee * coinMultiplier);

    if (coinsEarned > 0) {
      await walletService.earnCoins(input.userId, coinsEarned, "purchase", {
        note: `Order #${order.orderId}`,
        orderId: order.id,
      });

      // Return the caller an order that actually reflects coinsEarned —
      // the `order` object above was captured before this update, so
      // returning it as-is would silently report 0 coins earned even
      // though the wallet (and the DB row) both have the real amount.
      const updatedOrder = await orderRepository.updateOrderCoinsEarned(order.id, coinsEarned);
      await userService.incrementLifetimeSpend(input.userId, amount);

      return updatedOrder;
    }

    await userService.incrementLifetimeSpend(input.userId, amount);
  }

  return order;
}

export async function setOrderStatus(id: string, status: string) {
  const existing = await orderRepository.findOrderById(id);

  const order = await orderRepository.updateOrderStatus(id, status);

  if (existing?.userId) {
    await notificationService.notify(
      existing.userId,
      `Your order #${existing.orderId} is now ${status}.`
    );
  }

  return order;
}
