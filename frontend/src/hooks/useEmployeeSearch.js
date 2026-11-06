import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage, isCanceled, searchEmployees } from '../services/api.js';
import { useDebouncedValue } from './useDebouncedValue.js';

const PAGE_SIZE = 20;

/**
 * Encapsulates debounced search, request cancellation, pagination and status.
 * status: 'loading' | 'success' | 'error'
 */
export function useEmployeeSearch({ delay = 350, pageSize = PAGE_SIZE } = {}) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), delay);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  const controllerRef = useRef(null);

  const fetchPage = useCallback(
    async (offset, append) => {
      controllerRef.current?.abort(); // cancel any stale in-flight request
      const controller = new AbortController();
      controllerRef.current = controller;

      if (append) {
        setLoadingMore(true);
        setLoadMoreError(null);
      } else {
        setStatus('loading'); // previous results stay visible (no flicker)
        setError(null);
        setLoadMoreError(null);
        setLoadingMore(false);
      }

      try {
        const data = await searchEmployees(
          { q: debouncedQuery, limit: pageSize, offset },
          controller.signal,
        );
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setStatus('success');
        setLoadingMore(false);
      } catch (err) {
        if (isCanceled(err)) return; // superseded by a newer request
        if (append) {
          setLoadMoreError(getErrorMessage(err));
        } else {
          setItems([]);
          setTotal(0);
          setError(getErrorMessage(err));
          setStatus('error');
        }
        setLoadingMore(false);
      }
    },
    [debouncedQuery, pageSize],
  );

  // New (debounced) query or manual retry => fresh first page.
  useEffect(() => {
    fetchPage(0, false);
    return () => controllerRef.current?.abort();
  }, [fetchPage, retryTick]);

  const loadMore = useCallback(() => fetchPage(items.length, true), [fetchPage, items.length]);
  const retry = useCallback(() => setRetryTick((t) => t + 1), []);

  return {
    query,
    setQuery,
    items,
    total,
    status,
    error,
    isRefreshing: status === 'loading' && items.length > 0,
    hasMore: items.length < total,
    loadingMore,
    loadMoreError,
    loadMore,
    retry,
  };
}
