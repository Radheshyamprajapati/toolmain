import { prisma } from "@/lib/prisma";

/**
 * Delivery-partner integration layer.
 *
 * In production you would swap the body of `createShipmentWithPartner` and
 * `pollPartnerStatus` for real HTTP calls to a courier's API (Shiprocket,
 * Porter, Dunzo, Shadowfax, etc.), and `receivePartnerWebhook` would be the
 * handler that partner calls back into. The rest of the app (rental status
 * machine, notifications, the tracking UI) is written against the `Delivery`
 * model, so plugging in a real courier later only means rewriting the two
 * functions below — nothing else changes.
 */

const PARTNERS = [
  { code: "SHADOWFAX", name: "Shadowfax Logistics" },
  { code: "PORTER", name: "Porter Express" },
  { code: "DUNZO", name: "Dunzo Same-Day" },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTrackingNumber(partnerCode) {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${partnerCode}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

/**
 * Simulates calling out to a real delivery partner's "create shipment" API.
 * Returns the same shape a real adapter would: tracking number, assigned
 * driver, and an ETA.
 */
async function createShipmentWithPartner({ pickupAddress, dropAddress }) {
  const partner = pick(PARTNERS);
  const trackingNumber = generateTrackingNumber(partner.code);
  const etaMinutes = 45 + Math.floor(Math.random() * 90); // 45–135 min, like a real local courier

  // Simulate network latency of a real API call.
  await new Promise((r) => setTimeout(r, 50));

  return {
    partnerCode: partner.code,
    partnerName: partner.name,
    trackingNumber,
    trackingUrl: `https://track.example-logistics.com/${trackingNumber}`,
    driverName: pick(["Ramesh K.", "Suresh P.", "Anita D.", "Vikram S.", "Priya M."]),
    driverPhone: `+91-9${Math.floor(100000000 + Math.random() * 899999999)}`,
    vehicleNumber: `MH-${10 + Math.floor(Math.random() * 40)}-${pick(["AB", "CD", "EF", "GH"])}-${1000 + Math.floor(Math.random() * 8999)}`,
    estimatedPickupAt: new Date(Date.now() + 20 * 60 * 1000),
    estimatedDeliveryAt: new Date(Date.now() + etaMinutes * 60 * 1000),
    pickupAddress,
    dropAddress,
  };
}

/**
 * Creates (or returns the existing) Delivery record for a rental and hands
 * the shipment off to a delivery partner. Called when the owner marks a
 * rental READY for dispatch (moves it to OUT_FOR_DELIVERY).
 */
export async function assignDeliveryPartner(rental) {
  const existing = await prisma.delivery.findUnique({ where: { rentalId: rental.id } });
  if (existing) return existing;

  const shipment = await createShipmentWithPartner({
    pickupAddress: rental.tool?.location || "Owner location",
    dropAddress: rental.deliveryAddress || "Customer address",
  });

  const delivery = await prisma.delivery.create({
    data: {
      rentalId: rental.id,
      partnerName: shipment.partnerName,
      partnerCode: shipment.partnerCode,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      driverName: shipment.driverName,
      driverPhone: shipment.driverPhone,
      vehicleNumber: shipment.vehicleNumber,
      pickupAddress: shipment.pickupAddress,
      dropAddress: shipment.dropAddress,
      estimatedPickupAt: shipment.estimatedPickupAt,
      estimatedDeliveryAt: shipment.estimatedDeliveryAt,
      status: "ASSIGNED",
      events: [
        {
          status: "ASSIGNED",
          at: new Date().toISOString(),
          note: `Shipment created with ${shipment.partnerName}`,
        },
      ],
    },
  });

  return delivery;
}

const PROGRESSION = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];

/**
 * Simulates the delivery partner's webhook progressing the shipment forward
 * in real time, the way a real integration would call back into
 * /api/delivery/webhook as the courier moves through pickup -> transit ->
 * drop-off. Invoked by the delivery-sync cron/poller.
 */
export function nextSimulatedStatus(delivery) {
  const idx = PROGRESSION.indexOf(delivery.status);
  if (idx === -1 || idx === PROGRESSION.length - 1) return null;

  const minutesSinceUpdate = (Date.now() - new Date(delivery.updatedAt).getTime()) / 60000;
  // Advance one stage roughly every 2 minutes of elapsed demo time so a
  // live demo can watch the shipment move without waiting hours.
  if (minutesSinceUpdate < 2) return null;

  return PROGRESSION[idx + 1];
}

export async function appendDeliveryEvent(deliveryId, status, note) {
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) return null;

  const events = Array.isArray(delivery.events) ? delivery.events : [];
  events.unshift({ status, at: new Date().toISOString(), note });

  const data = {
    status,
    events,
    updatedAt: new Date(),
  };
  if (status === "PICKED_UP") data.pickedUpAt = new Date();
  if (status === "DELIVERED") data.deliveredAt = new Date();

  return prisma.delivery.update({ where: { id: deliveryId }, data });
}
