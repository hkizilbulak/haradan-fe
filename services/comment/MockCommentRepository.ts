import type { AdvertComment, CommentListResponse, CreateCommentPayload } from '@/types';
import type { ICommentRepository } from './CommentRepository';

export class MockCommentRepository implements ICommentRepository {
  private comments: AdvertComment[] = [
    {
      id: 'c-1',
      advertId: 'adv-1',
      userId: 'u-1',
      authorName: 'Ahmet K.',
      content: 'Atın soyu ve orijini harika görünüyor. Tayın idman videoları var mı?',
      rating: 5,
      createdAt: '2026-08-15T14:30:00Z',
    },
    {
      id: 'c-2',
      advertId: 'adv-1',
      userId: 'u-2',
      authorName: 'Mehmet Y.',
      content: 'Fiyat performans açısından oldukça makul bir ilan, alıcısına hayırlı olsun.',
      rating: 4,
      createdAt: '2026-08-16T09:15:00Z',
    },
  ];

  async getComments(
    advertId: string,
    limit = 20,
    offset = 0
  ): Promise<CommentListResponse> {
    const filtered = this.comments.filter(
      (c) => c.advertId === advertId || advertId === 'demo-1'
    );
    const paged = filtered.slice(offset, offset + limit);
    return {
      items: paged,
      totalCount: filtered.length,
    };
  }

  async createComment(
    advertId: string,
    payload: CreateCommentPayload,
    _accessToken: string
  ): Promise<AdvertComment> {
    const newComment: AdvertComment = {
      id: `c-${Date.now()}`,
      advertId,
      userId: 'u-me',
      authorName: 'Ben (Siz)',
      content: payload.content,
      rating: payload.rating ?? null,
      createdAt: new Date().toISOString(),
    };
    this.comments.unshift(newComment);
    return newComment;
  }

  async deleteComment(
    _advertId: string,
    commentId: string,
    _accessToken: string
  ): Promise<void> {
    this.comments = this.comments.filter((c) => c.id !== commentId);
  }
}

