import { HttpClient } from '@/services/http';
import type { AdvertComment, CommentListResponse, CreateCommentPayload } from '@/types'
import type { AdvertId } from '@/types/advertId';
import type { ICommentRepository } from './CommentRepository';

type BeCommentItem = {
  id: string;
  advertId: AdvertId;
  userId: string;
  authorName: string;
  content: string;
  rating?: number | null;
  createdAt: string;
};

type BeCommentListResponse = {
  items: BeCommentItem[];
  totalCount: number;
};

export class HttpCommentRepository implements ICommentRepository {
  private readonly http: HttpClient;

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  async getComments(
    advertId: AdvertId,
    limit = 20,
    offset = 0
  ): Promise<CommentListResponse> {
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    }).toString();

    try {
      const data = await this.http.request<BeCommentListResponse>(
        `/v1/adverts/${encodeURIComponent(advertId)}/comments?${query}`,
        { method: 'GET' }
      );

      return {
        items: (data?.items || []).map((item) => this.mapComment(item)),
        totalCount: data?.totalCount || 0,
      };
    } catch {
      return {
        items: [],
        totalCount: 0,
      };
    }
  }

  async createComment(
    advertId: AdvertId,
    payload: CreateCommentPayload,
    accessToken: string
  ): Promise<AdvertComment> {
    const data = await this.http.request<BeCommentItem>(
      `/v1/adverts/${encodeURIComponent(advertId)}/comments`,
      {
        method: 'POST',
        accessToken,
        body: JSON.stringify(payload),
      }
    );

    return this.mapComment(data);
  }

  async deleteComment(
    advertId: AdvertId,
    commentId: string,
    accessToken: string
  ): Promise<void> {
    await this.http.request<void>(
      `/v1/adverts/${encodeURIComponent(advertId)}/comments/${encodeURIComponent(commentId)}`,
      {
        method: 'DELETE',
        accessToken,
      }
    );
  }

  private mapComment(item: BeCommentItem): AdvertComment {
    return {
      id: item.id,
      advertId: item.advertId,
      userId: item.userId,
      authorName: item.authorName || 'Kullanıcı',
      content: item.content,
      rating: item.rating ?? null,
      createdAt: item.createdAt,
    };
  }
}

