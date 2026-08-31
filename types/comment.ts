import type { AdvertId } from './advertId';

export type AdvertComment = {
  id: string;
  advertId: AdvertId;
  userId: string;
  authorName: string;
  content: string;
  rating?: number | null;
  createdAt: string;
};

export type CreateCommentPayload = {
  content: string;
  rating?: number | null;
};

export type CommentListResponse = {
  items: AdvertComment[];
  totalCount: number;
};

