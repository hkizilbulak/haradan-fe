import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import { HttpNotificationRepository } from './http';

export function createNotificationRepository(): HttpNotificationRepository | null {
  if (!isHttpApiEnabled()) {
    return null;
  }
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl) return null;
  return new HttpNotificationRepository(baseUrl);
}

export const notificationRepository: HttpNotificationRepository | null =
  createNotificationRepository();
