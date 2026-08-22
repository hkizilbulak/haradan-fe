import { HttpClient } from '@/services/http';
import type { AdvertComment, CommentListResponse, CreateCommentPayload } from '@/types';
import type { ICommentRepository } from './CommentRepository';

type BeCommentItem = {
  id: string;
  advertId: string;
  userId: string;
  authorName: string;
  content: string;
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
    advertId: string,
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
    advertId: string,
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

  private mapComment(item: BeCommentItem): AdvertComment {
    return {
      id: item.id,
      advertId: item.advertId,
      userId: item.userId,
      authorName: item.authorName || 'Kullanıcı',
      content: item.content,
      createdAt: item.createdAt,
    };
  }
}
