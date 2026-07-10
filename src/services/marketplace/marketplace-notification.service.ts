import ProviderNotification from '../../models/ProviderNotification';

export async function createProviderNotification(input: {
  providerId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return ProviderNotification.create({
    providerId: input.providerId,
    type: input.type,
    title: input.title,
    message: input.message,
    read: false,
    metadata: input.metadata,
    createdAt: new Date(),
  });
}

export async function listProviderNotifications(providerId: string) {
  return ProviderNotification.find({ providerId })
    .sort({ createdAt: -1 })
    .limit(100);
}

export async function markProviderNotificationRead(
  providerId: string,
  notificationId: string
) {
  return ProviderNotification.findOneAndUpdate(
    { _id: notificationId, providerId },
    { $set: { read: true } },
    { new: true }
  );
}
