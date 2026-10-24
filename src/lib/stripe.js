import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // Fail loudly at startup rather than crashing confusingly mid-checkout later.
  console.warn(
    "STRIPE_SECRET_KEY is not set. Payment routes will fail until it's added to .env"
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});
