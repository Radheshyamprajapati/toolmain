import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { notifyAllChannels } from "@/lib/notify";

// Only high-signal types also go out over email/SMS/WhatsApp.
const EXTERNAL_CHANNEL_TYPES = new Set([
  "BOOKING_ACCEPTED", "BOOKING_REJECTED", "PAYMENT_RECEIVED", "OUT_FOR_DELIVERY",
  "DELIVERED", "REFUND_ISSUED", "RENTAL_CANCELLED", "PROVIDER_APPROVED", "PROVIDER_REJECTED",
]);

export async function createNotification({
  userId,
  type,
  title,
  message,
  toolId = null,
  rentalId = null,
  dedupeKey = null,
  sendPush = true,
}) {
  try {
    if (!userId || !dedupeKey) return null;

    // Prevent duplicate notifications
    const existing = await prisma.notification.findUnique({
      where: { dedupeKey },
    });
    if (existing) return existing;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        toolId,
        rentalId,
        dedupeKey,
        pushStatus: sendPush ? "PENDING" : "SKIPPED",
      },
    });

    if (sendPush) {
      const result = await sendPushToUser(userId, {
        title,
        body: message,
        data: {
          url: "/notifications",
          notificationId: notification.id,
        },
      });

      await prisma.notification
        .update({
          where: { id: notification.id },
          data: {
            pushStatus: result.delivered > 0 ? "SENT" : "FAILED",
            sentAt: new Date(),
          },
        })
        .catch(() => {});
    }

    if (EXTERNAL_CHANNEL_TYPES.has(type)) {
      prisma.user
        .findUnique({ where: { id: userId }, select: { email: true, phone: true } })
        .then((u) => notifyAllChannels(u, { subject: title, html: `<p>${message}</p>`, smsBody: `${title}: ${message}` }))
        .catch((e) => console.error("External notification failed:", e));
    }

    return notification;
  } catch (error) {
    console.error("createNotification error:", error);
    if (error.code === "P2002") {
      // Duplicate dedupeKey – fetch and return existing
      return prisma.notification.findUnique({ where: { dedupeKey } });
    }
    return null;
  }
}
