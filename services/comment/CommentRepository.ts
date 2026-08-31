import type { AdvertComment, CommentListResponse, CreateCommentPayload } from '@/types'
import type { AdvertId } from '@/types/advertId';

export interface ICommentRepository {
  getComments(
    advertId: AdvertId,
    limit?: number,
    offset?: number
  ): Promise<CommentListResponse>;

  createComment(
    advertId: AdvertId,
    payload: CreateCommentPayload,
    accessToken: string
  ): Promise<AdvertComment>;

  deleteComment(
    advertId: AdvertId,
    commentId: string,
    accessToken: string
  ): Promise<void>;
}
