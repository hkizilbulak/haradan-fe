import { HttpClient } from '@/services/http';
import type { 
  MyNotificationPage, 
  NotificationUnreadCount, 
  MarkAllNotificationsReadResponse 
} from '@/types/notification';

export class HttpNotificationRepository {
  private readonly http: HttpClient;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  async list(accessToken: string, cursor?: string, limit?: number): Promise<MyNotificationPage> {
    const q = new URLSearchParams();
    if (cursor) q.set('cursor', cursor);
    if (limit) q.set('limit', String(limit));
    return this.http.request<MyNotificationPage>(`/v1/me/notifications?${q.toString()}`, {
      method: 'GET',
      accessToken,
    });
  }

  async getUnreadCount(accessToken: string): Promise<NotificationUnreadCount> {
    return this.http.request<NotificationUnreadCount>(`/v1/me/notifications/unread-count`, {
      method: 'GET',
      accessToken,
    });
  }

  async markAllRead(accessToken: string): Promise<MarkAllNotificationsReadResponse> {
    return this.http.request<MarkAllNotificationsReadResponse>(`/v1/me/notifications/read-all`, {
      method: 'PUT',
      accessToken,
    });
  }

  async markRead(notificationId: string, accessToken: string): Promise<void> {
    return this.http.request<void>(`/v1/me/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'PUT',
      accessToken,
    });
  }

  async delete(notificationId: string, accessToken: string): Promise<void> {
    return this.http.request<void>(`/v1/me/notifications/${encodeURIComponent(notificationId)}`, {
      method: 'DELETE',
      accessToken,
    });
  }

  async deleteAll(accessToken: string): Promise<void> {
    return this.http.request<void>(`/v1/me/notifications`, {
      method: 'DELETE',
      accessToken,
    });
  }
}
