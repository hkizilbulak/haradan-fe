import { useCallback, useEffect, useState } from 'react';
import type { AdvertComment } from '@/types';
import { createCommentRepository } from '@/services/comment';
import { ApiError } from '@/services/http';

export function useAdvertComments(advertId: string | null) {
  const [comments, setComments] = useState<AdvertComment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!advertId) return;
    setIsLoading(true);
    setError(null);
    try {
      const repo = createCommentRepository();
      const res = await repo.getComments(advertId, 50, 0);
      setComments(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Yorumlar yüklenirken bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [advertId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const postComment = useCallback(
    async (content: string, accessToken: string): Promise<AdvertComment> => {
      if (!advertId) {
        throw new Error('Geçersiz ilan ID');
      }
      setIsSubmitting(true);
      setError(null);
      try {
        const repo = createCommentRepository();
        const created = await repo.createComment(advertId, { content }, accessToken);
        setComments((prev) => [created, ...prev]);
        setTotalCount((prev) => prev + 1);
        return created;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Yorum gönderilemedi.';
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [advertId]
  );

  return {
    comments,
    totalCount,
    isLoading,
    isSubmitting,
    error,
    refetch: fetchComments,
    postComment,
  };
}
