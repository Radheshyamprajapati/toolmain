# ToolHive — Deployment & Demo Guide

This build fixes the booking/payment/approval flow end-to-end and adds:
tool **rental or outright purchase**, a **duplicate-booking-safe** checkout
flow, **owner/provider approval**, an **authorised-provider registration**
process with admin review, and a **delivery-partner integration** (mocked
but structured like a real courier API) with live tracking.

## 1. What changed (short version)

- Fixed several crash-causing bugs left over from a prior edit (duplicate
  Prisma fields, a duplicated route handler, dead code referencing
  undefined variables, a missing `/api/auth/register` route, wrong field
  names in a couple of queries).
- **Booking overlap protection** is now two layers deep: a transactional
  check at booking time, plus an automatic cleanup in the Stripe webhook
  that cancels (and refunds — nothing, since they hadn't paid yet) any
  other still-unpaid booking for the same tool/date-range the instant one
  of them gets paid.
- **Buy vs Rent** is a first-class `transactionType` on every booking, with
  its own pricing, its own conflict rule (a purchase blocks itself, not
  by date), and a shorter status pipeline (no return leg).
- **Payments**: Stripe Checkout, card **and** UPI (native Stripe UPI, not
  a fake QR code), server-recomputed totals (the client can't tamper with
  the amount), webhook idempotency, and automatic refunds when a booking
  is cancelled or a provider declines it.
- **Provider registration**: anyone can sign up as a "Tool/Equipment
  Provider"; they can sign in immediately but can't list anything until an
  admin approves them from `/admin/providers`. Rejected/suspended
  providers have their listings hidden automatically.
- **Owner approval flow**: paid bookings sit as `PENDING_VENDOR_ACCEPTANCE`
  until the provider approves or declines them (decline auto-refunds).
- **Delivery-partner integration**: dispatching a booking assigns a
  (simulated) courier — tracking number, driver, vehicle, ETA — and a
  cron endpoint simulates the courier's webhook moving the shipment
  through pickup → transit → delivered in real time, the same shape a
  real Shiprocket/Porter/Dunzo integration would use. Swapping in a real
  courier later only means rewriting `src/lib/delivery.js`.
- Handover (both drop-off and return) is confirmed with a 4-digit OTP the
  customer is shown in the app and shares with the provider/courier in
  person — a lightweight anti-fraud check on top of Stripe's payment
  confirmation.

## 2. Set up Neon (database)

1. Create a project at https://neon.tech.
2. From the Neon dashboard, copy **two** connection strings:
   - The **pooled** one (has `-pooler` in the hostname) → `DATABASE_URL`
   - The **direct** one (no `-pooler`) → `DIRECT_URL`
   If your plan only gives you one string, use the same value for both —
   migrations will just run a bit slower.
3. Copy `.env.example` to `.env` and fill in both.

## 3. Set up Stripe

1. Create a Stripe account (test mode is fine for a demo) and grab your
   secret key → `STRIPE_SECRET_KEY`.
2. Install the Stripe CLI for local testing, or add a webhook endpoint in
   the Stripe dashboard pointing at `https://<your-domain>/api/webhooks/stripe`
   listening for: `checkout.session.completed`, `checkout.session.expired`,
   `charge.refunded`. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
   - Local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
     prints a `whsec_...` value — use that.
3. UPI as a Checkout payment method only works on **India-based** Stripe
   accounts. If yours isn't, set `STRIPE_ENABLE_UPI=false` and card-only
   checkout will still work fine.

## 4. Install, migrate, seed

```bash
npm install
npx prisma migrate dev --name init      # creates tables on Neon
npx prisma db seed                      # demo accounts + listings
npm run dev
```

Demo accounts (password `demo1234` for all):

| Role                       | Email             | Notes                              |
|-----------------------------|-------------------|-------------------------------------|
| Admin                       | admin@demo.com    | approves providers at `/admin/providers` |
| Approved provider            | john@demo.com     | can list tools immediately          |
| Approved provider            | sarah@demo.com    | can list tools immediately          |
| Pending provider             | priya@demo.com    | waiting on approval — demo the queue |
| Customer                    | tom@demo.com      | books/buys                          |

## 5. Deploying (Vercel)

`vercel.json` is already set up with:
- Build/install commands
- Two cron jobs: `/api/cron/notifications` (expiry reminders, every 15
  min) and `/api/cron/delivery-sync` (advances simulated shipments, every
  2 min)

Set all the `.env.example` variables in the Vercel project settings,
including `CRON_SECRET` (Vercel signs cron requests with it automatically
once it's set), then point the Stripe webhook at your production URL.

## 6. Suggested live demo script

1. **Register as a provider** at `/register` → choose "Equipment/Tool
   Provider", fill in a business name → you're signed in immediately but
   see "Application under review" on the owner dashboard.
2. **Log in as admin** (`admin@demo.com`) → `/admin/providers` → approve
   the new provider. (Also point out `priya@demo.com`, seeded as a
   pending application, for a second example.)
3. **Log back in as the new provider** → list a tool, e.g. a piece of
   heavy machinery, with both a daily rental price and a sale price.
4. **Log in as a customer** (`tom@demo.com`, or a new signup) → open that
   tool → choose **Rent** (pick dates) or **Buy** → choose delivery →
   pay via the Stripe Checkout page (test card `4242 4242 4242 4242`,
   any future expiry/CVC — or the UPI tab if enabled).
5. Back on `/rentals`, the customer sees "Awaiting provider approval"
   and their **handover OTP**.
6. **Switch to the provider** → `/rentals` → "As Provider" tab → Approve
   → Mark preparing → Mark ready → **Dispatch with courier** — this is
   where `assignDeliveryPartner()` fires and a tracking number/driver/ETA
   appear on both sides immediately.
7. Hit `/api/cron/delivery-sync` a couple of times (or wait — it advances
   automatically every ~2 minutes) and refresh `/rentals` to watch the
   shipment move: Assigned → Picked up → In transit → Out for delivery →
   Delivered.
8. **Provider** enters the customer's OTP to confirm handover → rental
   goes **Active**. For a rental, the customer can then **Request
   return**; the provider confirms the return OTP → inspects → completes.
   For a purchase, the provider just marks the sale **Completed** once
   delivered.
9. To show the double-booking protection: open the same date range for
   the same rental item as two different customers in two tabs, pay in
   one — the other rental auto-cancels itself with a clear "another
   customer paid first, you were not charged" notification. To show
   refunds: as the provider, **decline** a paid booking and point out the
   Stripe refund goes through automatically.

## 7. Notes / things a real production launch would still need

- Real courier integration: swap `src/lib/delivery.js`'s two functions
  for actual HTTP calls to your courier partner, and add a
  `/api/delivery/webhook` receiver for their callbacks (the `Delivery`
  model, tracking UI, and rest of the flow are already written against
  this contract, so nothing else changes).
- Identity/KYC verification for providers beyond the admin's manual
  review (e.g. document upload) if you need stronger trust guarantees.
- Security-deposit capture/release as a separate Stripe charge if you
  want deposits authorised-but-not-charged up front rather than bundled
  into the total.
- Rate limiting / bot protection on `/api/auth/register` and the booking
  endpoints before going live publicly.

## 8. Round-2 additions

Apply the schema change after pulling this version: `npx prisma db push` (or `migrate dev`).

- **Calendar blocked dates**: providers block dates on their own listing; the calendar shows booked and blocked days; bookings and extensions respect both.
- **Platform commission**: `PLATFORM_COMMISSION_RATE` (percent of the rental/sale amount) replaces the old flat fee.
- **Coupons**: `Coupon` table plus `/api/coupons/validate`; `couponCode` is accepted on booking creation. Create coupons with SQL for now (admin screen is next).
- **Extensions**: customer extends an ACTIVE rental, pays only the extra days; the webhook moves `endDate` once paid.
- **Security deposit**: refunded automatically (partial Stripe refund of just the deposit) when the provider completes inspection, or withheld with a reason.
- **GST invoice**: `/api/rentals/:id/invoice` prints to PDF from the browser.
- **Notifications**: email (SMTP), SMS and WhatsApp (Twilio) fire for key events once credentials are set; unset channels only log.
- **Access rule**: ADMIN cannot create, edit or delete listings, block dates, or change rental status.
