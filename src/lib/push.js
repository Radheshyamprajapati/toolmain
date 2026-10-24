import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@toolhive.com";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushToUser(userId, payload) {
  if (!publicKey || !privateKey) {
    return { delivered: 0, failed: 0, skipped: true };
  }

  const tokens = await prisma.pushToken.findMany({ where: { userId } });
  const results = await Promise.allSettled(
    tokens.map(async (token) => {
      const subscription = {
        endpoint: token.endpoint,
        keys: { p256dh: token.p256dh, auth: token.auth },
      };
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    })
  );

  let delivered = 0;
  results.forEach((result, i) => {
    if (result.status === "fulfilled") delivered++;
    else if (result.reason?.statusCode === 404 || result.reason?.statusCode === 410) {
      prisma.pushToken
        .deleteMany({ where: { endpoint: tokens[i].endpoint } })
        .catch(() => {});
    }
  });

  return { delivered, failed: results.length - delivered };
}
