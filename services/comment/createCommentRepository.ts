import { isHttpApiEnabled, resolveApiBaseUrl } from '@/services/http';
import type { ICommentRepository } from './CommentRepository';
import { HttpCommentRepository } from './HttpCommentRepository';
import { MockCommentRepository } from './MockCommentRepository';

export function createCommentRepository(): ICommentRepository {
  if (isHttpApiEnabled(process.env.EXPO_PUBLIC_USE_MOCK_COMMENT)) {
    const baseUrl = resolveApiBaseUrl();
    if (baseUrl) return new HttpCommentRepository(baseUrl);
  }
  return new MockCommentRepository();
}
