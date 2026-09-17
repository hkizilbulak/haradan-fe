export type NotificationEventType = 
  | 'PRICE_DROP' 
  | 'MESSAGE_RECEIVED' 
  | 'SYSTEM_ALERT';

export interface MyNotificationView {
  id: string;
  eventType: NotificationEventType;
  title: string;
  body: string;
  payload: Record<string, any>;
  createdAt: string;
  readAt?: string | null;
}

export interface MyNotificationPage {
  items: MyNotificationView[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface NotificationUnreadCount {
  unreadCount: number;
}

export interface MarkAllNotificationsReadResponse {
  updatedCount: number;
}
