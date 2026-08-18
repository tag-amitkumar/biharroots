"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Award,
  Banknote,
  Check,
  Coins,
  CreditCard,
  MapPin,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { useWalletStore } from "@/features/wallet/store";
import { SHIPPING_OPTIONS, getShippingCost } from "@/features/orders/shipping";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

const DELIVERY_WINDOW_DAYS: Record<string, [number, number]> = {
  standard: [3, 5],
  express: [1, 2],
};

function formatDeliveryWindow(shippingMethod: string) {
  const [minDays, maxDays] = DELIVERY_WINDOW_DAYS[shippingMethod] || [3, 5];

  const from = new Date();
  from.setDate(from.getDate() + minDays);

  const to = new Date();
  to.setDate(to.getDate() + maxDays);

  const format = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return `${format(from)} - ${format(to)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);

  const [shippingMethod, setShippingMethod] = useState<string>(
    SHIPPING_OPTIONS[0].id
  );
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(
    null
  );

  const walletBalance = useWalletStore((state) => state.balance);
  const setWalletBalance = useWalletStore((state) => state.setBalance);
  const [coinsToRedeem, setCoinsToRedeem] = useState(0);
  const [redemption, setRedemption] = useState<{ coins: number; discount: number } | null>(
    null
  );
  const [applyingCoins, setApplyingCoins] = useState(false);

  const [membershipTier, setMembershipTier] = useState<{
    name: string;
    discountPercent: number;
    freeShipping: boolean;
  } | null>(null);

  useEffect(() => {
    if (!session) return;

    fetch("/api/wallet")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setWalletBalance(data.balance))
      .catch(() => {});

    fetch("/api/membership")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.tier && setMembershipTier(data.tier))
      .catch(() => {});
  }, [session, setWalletBalance]);

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="font-display text-3xl font-bold text-neutral-900 dark:text-white">
          Your Cart Is Empty
        </h1>
      </div>
    );
  }

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity,
    0
  );

  const selectedShipping =
    SHIPPING_OPTIONS.find((option) => option.id === shippingMethod) ??
    SHIPPING_OPTIONS[0];

  const shippingCost = getShippingCost(shippingMethod, subtotal, membershipTier?.freeShipping);

  const discount = coupon?.discount ?? 0;
  const coinDiscount = redemption?.discount ?? 0;
  const membershipDiscount = membershipTier
    ? Math.floor((subtotal * membershipTier.discountPercent) / 100)
    : 0;
  const total = Math.max(0, subtotal - discount - membershipDiscount - coinDiscount) + shippingCost;

  async function applyCoupon() {
    if (!couponInput.trim()) return;

    setApplyingCoupon(true);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });

      const data = await response.json();

      if (data.success) {
        setCoupon({ code: data.code, discount: data.discount });
        toast.success(`Coupon "${data.code}" applied!`);
      } else {
        setCoupon(null);
        toast.error(data.error || "Invalid coupon code");
      }
    } catch {
      toast.error("Could not validate coupon. Please try again.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
  }

  async function applyCoinRedemption() {
    if (coinsToRedeem <= 0) return;

    setApplyingCoins(true);

    try {
      const response = await fetch("/api/wallet/redeem-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coins: coinsToRedeem,
          subtotal: Math.max(0, subtotal - discount - membershipDiscount) + shippingCost,
        }),
      });

      const data = await response.json();

      if (data.coins > 0) {
        setRedemption({ coins: data.coins, discount: data.discount });
        toast.success(`Redeeming ${data.coins} NatureCoins for ₹${data.discount} off`);
      } else {
        setRedemption(null);
        toast.error("Enter at least the minimum redeemable NatureCoins");
      }
    } catch {
      toast.error("Could not preview redemption. Please try again.");
    } finally {
      setApplyingCoins(false);
    }
  }

  function removeCoinRedemption() {
    setRedemption(null);
    setCoinsToRedeem(0);
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();

    setPlacing(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: name,
          phone,
          email,
          address: city ? `${address}, ${city}` : address,
          items: cart,
          couponCode: coupon?.code,
          shippingMethod,
          paymentMethod,
          redeemCoins: redemption?.coins,
        }),
      });

      const data = await response.json();

      if (data.success) {
        clearCart();

        const params = new URLSearchParams({
          orderId: data.order.orderId,
          amount: String(data.order.amount),
        });

        toast.success("Order placed successfully!");
        router.push(`/success?${params.toString()}`);
      } else {
        toast.error(data.error || "Could not place order. Please try again.");
        router.push(
          `/checkout/failed?reason=${encodeURIComponent(
            data.error || "Could not place order"
          )}`
        );
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      router.push("/checkout/failed");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas py-16 dark:bg-canvas-dark">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="mb-10 text-center font-display text-5xl font-extrabold text-neutral-900 dark:text-white">
          Checkout
        </h1>

        <form
          onSubmit={placeOrder}
          className="grid gap-8 lg:grid-cols-3"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8 lg:col-span-2"
          >
            <motion.div
              variants={fadeInUp}
              className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-neutral-900 dark:text-white">
                <MapPin className="h-5 w-5 text-brand-600" /> Delivery Details
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="address">Full Address</Label>
                <textarea
                  id="address"
                  required
                  rows={4}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                />
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-neutral-900 dark:text-white">
                <Truck className="h-5 w-5 text-brand-600" /> Shipping Method
              </h2>

              <div className="space-y-3">
                {SHIPPING_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-colors",
                      shippingMethod === option.id
                        ? "border-brand-600 bg-brand-50 dark:bg-brand-900/10"
                        : "border-neutral-200 dark:border-neutral-700"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border-2",
                          shippingMethod === option.id
                            ? "border-brand-600 bg-brand-600"
                            : "border-neutral-300"
                        )}
                      >
                        {shippingMethod === option.id && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </span>

                      <input
                        type="radio"
                        name="shippingMethod"
                        className="sr-only"
                        checked={shippingMethod === option.id}
                        onChange={() => setShippingMethod(option.id)}
                      />

                      <span>
                        <span className="block font-semibold text-neutral-900 dark:text-white">
                          {option.label}
                        </span>
                        <span className="text-xs text-neutral-500">
                          Arrives {formatDeliveryWindow(option.id)}
                        </span>
                      </span>
                    </span>

                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {option.cost === 0 ? "Free" : `₹${option.cost}`}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-neutral-900 dark:text-white">
                <CreditCard className="h-5 w-5 text-brand-600" /> Payment Method
              </h2>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-brand-600 bg-brand-50 p-4 dark:bg-brand-900/10">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-brand-600 bg-brand-600">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="sr-only"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                  />
                  <Banknote className="h-4 w-4 text-neutral-500" />
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    Cash on Delivery
                  </span>
                </label>

                <label className="flex cursor-not-allowed items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4 text-neutral-400 dark:border-neutral-800">
                  <span className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-neutral-300" />
                    <input type="radio" name="paymentMethod" disabled className="sr-only" />
                    <CreditCard className="h-4 w-4" />
                    Pay Online
                  </span>

                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold dark:bg-neutral-800">
                    Coming Soon
                  </span>
                </label>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={fadeInUp}
            className="h-fit rounded-3xl border border-neutral-200/70 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-24"
          >
            <h2 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-white">
              Order Summary
            </h2>

            <div className="mb-6 max-h-64 space-y-3 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.id + (item.variantId || "")}
                  className="flex justify-between text-sm text-neutral-600 dark:text-neutral-300"
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-6 flex gap-2">
              <Input
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                disabled={!!coupon}
                className="flex-1 uppercase"
              />

              {coupon ? (
                <Button type="button" variant="outline" onClick={removeCoupon} aria-label="Remove coupon">
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={applyCoupon}
                  disabled={applyingCoupon}
                >
                  {applyingCoupon ? "..." : "Apply"}
                </Button>
              )}
            </div>

            {session && walletBalance !== null && walletBalance > 0 && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
                  <Coins className="h-4 w-4" /> Redeem NatureCoins ({walletBalance} available)
                </p>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={walletBalance}
                    placeholder="Coins to redeem"
                    value={coinsToRedeem || ""}
                    onChange={(e) => setCoinsToRedeem(Number(e.target.value))}
                    disabled={!!redemption}
                    className="flex-1"
                  />

                  {redemption ? (
                    <Button type="button" variant="outline" onClick={removeCoinRedemption} aria-label="Remove redemption">
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={applyCoinRedemption}
                      disabled={applyingCoins}
                    >
                      {applyingCoins ? "..." : "Apply"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>

              {coupon && (
                <div className="flex justify-between text-brand-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> Coupon ({coupon.code})
                  </span>
                  <span>-₹{coupon.discount}</span>
                </div>
              )}

              {redemption && redemption.coins > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5" /> {redemption.coins} NatureCoins
                  </span>
                  <span>-₹{redemption.discount}</span>
                </div>
              )}

              {membershipDiscount > 0 && (
                <div className="flex justify-between text-brand-600">
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" /> {membershipTier?.name} member discount
                  </span>
                  <span>-₹{membershipDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                <span>Shipping</span>
                <span>
                  {shippingCost === 0 ? (
                    membershipTier?.freeShipping && selectedShipping.cost > 0 ? (
                      <span className="text-brand-600">Free ({membershipTier.name} member)</span>
                    ) : (
                      "Free"
                    )
                  ) : (
                    `₹${shippingCost}`
                  )}
                </span>
              </div>
            </div>

            <div className="mb-4 mt-4 flex justify-between border-t border-neutral-200 pt-4 text-lg font-bold text-neutral-900 dark:border-neutral-800 dark:text-white">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <button
              type="submit"
              disabled={placing}
              className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 py-4 font-bold text-white shadow-lg shadow-brand-600/20 transition hover:brightness-105 disabled:opacity-60"
            >
              {placing ? "Placing Order..." : "Place Order"}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
