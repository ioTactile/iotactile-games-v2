import { QueryClient } from '@tanstack/react-query';

/** Default QueryClient options (cache, retry, stale). */
const defaultOptions = {
  queries: {
    staleTime: 60 * 1000, // 1 min
    retry: 1,
    refetchOnWindowFocus: false,
  },
};

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions,
  });
}
