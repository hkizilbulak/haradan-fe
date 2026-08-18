import type { AdvertComment, CommentListResponse, CreateCommentPayload } from '@/types';

export interface ICommentRepository {
  getComments(
    advertId: string,
    limit?: number,
    offset?: number
  ): Promise<CommentListResponse>;

  createComment(
    advertId: string,
    payload: CreateCommentPayload,
    accessToken: string
  ): Promise<AdvertComment>;
}
