import { useEffect, useState } from 'react';
import { tjkRepository, type ITjkRepository } from '@/services/tjk';
import type { TjkHorseSummary } from '@/types/listing';

/**
 * Debounced TJK araması — AbortController ile yarışı iptal eder.
 */
export function useTjkSearch(
  query: string,
  repo: ITjkRepository = tjkRepository
) {
  const [results, setResults] = useState<TjkHorseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      void (async () => {
        try {
          const items = await repo.search(q, ctrl.signal);
          setResults(items);
          setError(null);
        } catch (err) {
          if (ctrl.signal.aborted) return;
          setError(err instanceof Error ? err.message : 'TJK araması başarısız.');
          setResults([]);
        } finally {
          if (!ctrl.signal.aborted) setLoading(false);
        }
      })();
    }, 260);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, repo]);

  return { results, loading, error };
}
