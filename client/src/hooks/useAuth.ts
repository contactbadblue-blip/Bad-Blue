// Authentication hook
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { User } from "@shared/schema";
import { markPerformance } from "@/lib/performance";

export function useAuth() {
  const { data: user, isLoading, isFetched, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Optimize auth query with caching
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache (gcTime replaces cacheTime in v5)
    refetchOnMount: false, // Don't refetch if we have cached data
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnReconnect: false, // Disable refetch on reconnect
    // Only fetch if we're on a page that needs auth
    enabled: typeof window !== 'undefined',
  });

  // Performance monitoring for auth state changes
  useEffect(() => {
    if (isFetched && !isLoading) {
      if (error) {
        markPerformance('auth:error');
        console.log('[Performance] Auth check failed:', error);
      } else {
        markPerformance(user ? 'auth:user-loaded' : 'auth:no-user');
      }
    }
  }, [isFetched, isLoading, user, error]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
