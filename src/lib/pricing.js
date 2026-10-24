// Platform commission as a percentage of the rental/sale amount (excludes
// delivery fee and security deposit). Configurable per deployment.
export const PLATFORM_COMMISSION_RATE = Number(process.env.PLATFORM_COMMISSION_RATE || 10) / 100;
export const DELIVERY_FEE_FLAT = 100;

export function calcRentalDaysCeil(start, end) {
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / dayMs));
}

export function commissionOn(amount) {
  return Math.round(amount * PLATFORM_COMMISSION_RATE * 100) / 100;
}
