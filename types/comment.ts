export type AdvertComment = {
  id: string;
  advertId: string;
  userId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

export type CreateCommentPayload = {
  content: string;
};

export type CommentListResponse = {
  items: AdvertComment[];
  totalCount: number;
};
