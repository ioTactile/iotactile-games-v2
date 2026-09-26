'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

import { makeQueryClient } from '@/lib/query/query-client';

/**
 * Provides the QueryClient to the app (Next.js App Router).
 * One QueryClient instance per client tree, created stably.
 * Shows React Query Devtools.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
