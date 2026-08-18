import * as notificationRepository from "@/features/notifications/repository";

export function getNotificationsForUser(userId: string) {
  return notificationRepository.findNotificationsForUser(userId);
}

export function notify(userId: string, message: string) {
  return notificationRepository.createNotification(userId, message);
}

export function markAsRead(id: string, userId: string) {
  return notificationRepository.markAsRead(id, userId);
}

export function markAllAsRead(userId: string) {
  return notificationRepository.markAllAsRead(userId);
}
