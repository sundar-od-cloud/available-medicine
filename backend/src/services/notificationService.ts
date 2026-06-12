export interface Notification {
  userId: string;
  title: string;
  message: string;
  type: 'reservation' | 'pharmacy' | 'system';
  data?: Record<string, unknown>;
  read?: boolean;
  createdAt?: Date;
}

// In-memory store for notifications (use Redis in production)
const notifications: Map<string, Notification[]> = new Map();

export const createNotification = async (notification: Notification): Promise<void> => {
  const userNotifications = notifications.get(notification.userId) || [];
  const enriched: Notification = {
    ...notification,
    read: false,
    createdAt: new Date(),
  };
  userNotifications.unshift(enriched);
  // Keep only last 50 notifications
  if (userNotifications.length > 50) {
    userNotifications.splice(50);
  }
  notifications.set(notification.userId, userNotifications);
  console.log(`[Notification] To: ${notification.userId}, Title: ${notification.title}`);
};

export const getUserNotifications = (userId: string): Notification[] => {
  return notifications.get(userId) || [];
};

export const markNotificationRead = (userId: string, index: number): void => {
  const userNotifications = notifications.get(userId);
  if (userNotifications && userNotifications[index]) {
    userNotifications[index].read = true;
    notifications.set(userId, userNotifications);
  }
};

export const markAllNotificationsRead = (userId: string): void => {
  const userNotifications = notifications.get(userId);
  if (userNotifications) {
    userNotifications.forEach((n) => (n.read = true));
    notifications.set(userId, userNotifications);
  }
};

export const getUnreadCount = (userId: string): number => {
  const userNotifications = notifications.get(userId) || [];
  return userNotifications.filter((n) => !n.read).length;
};

export const notifyReservationStatus = async (
  userId: string,
  reservationId: string,
  status: string,
  medicineName: string
): Promise<void> => {
  const messages: Record<string, string> = {
    confirmed: `Your reservation for ${medicineName} has been confirmed.`,
    ready: `Your ${medicineName} is ready for pickup!`,
    completed: `Your reservation for ${medicineName} has been completed.`,
    cancelled: `Your reservation for ${medicineName} has been cancelled.`,
  };

  await createNotification({
    userId,
    title: 'Reservation Update',
    message: messages[status] || `Reservation status updated to ${status}`,
    type: 'reservation',
    data: { reservationId, status, medicineName },
  });
};

export const notifyPharmacyApproval = async (
  ownerId: string,
  pharmacyName: string,
  approved: boolean
): Promise<void> => {
  await createNotification({
    userId: ownerId,
    title: approved ? 'Pharmacy Approved' : 'Pharmacy Application Update',
    message: approved
      ? `Your pharmacy "${pharmacyName}" has been approved. You can now manage inventory.`
      : `Your pharmacy "${pharmacyName}" application requires attention. Please contact support.`,
    type: 'pharmacy',
    data: { pharmacyName, approved },
  });
};
