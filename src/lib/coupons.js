import { prisma } from "@/lib/prisma";

export async function validateCoupon(code, orderAmount, db = prisma) {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.active) return { ok: false, error: "Invalid or inactive coupon code" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { ok: false, error: "This coupon has expired" };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "This coupon has reached its usage limit" };
  }
  if (orderAmount < coupon.minOrderAmount) {
    return { ok: false, error: `This coupon requires a minimum order of Rs ${coupon.minOrderAmount}` };
  }
  return { ok: true, coupon };
}

export function computeDiscount(coupon, orderAmount) {
  let discount = coupon.type === "PERCENT" ? (orderAmount * coupon.value) / 100 : coupon.value;
  if (coupon.type === "PERCENT" && coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  return Math.round(Math.min(discount, orderAmount) * 100) / 100;
}
