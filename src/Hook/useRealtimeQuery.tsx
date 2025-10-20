/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query"

/**
 * Custom hook for real-time data queries in restaurant management system
 *
 * Features:
 * - Always fetch fresh data (staleTime: 0)
 * - Refetch on component mount (refetchOnMount: "always")
 * - Refetch when window regains focus (refetchOnWindowFocus: true)
 * - Optional auto-refetch interval
 * - No memory cache (gcTime: 0)
 *
 * Use Cases:
 * - Table sessions (frequently changing)
 * - Order items (real-time updates)
 * - Invoice details (payment updates)
 * - Table status (occupancy changes)
 *
 * @param queryKey - Unique identifier for the query
 * @param queryFn - Function that fetches the data
 * @param options - Additional query options
 * @returns Query result with data, loading, error states
 *
 * @example
 * // Basic usage - always fresh data
 * const { data, isLoading } = useRealtimeQuery(
 *   ["tableSession", tableId],
 *   () => fetchTableSession(tableId)
 * )
 *
 * @example
 * // With auto-refetch every 15 seconds
 * const { data } = useRealtimeQuery(
 *   ["orders", sessionId],
 *   () => fetchOrders(sessionId),
 *   { refetchInterval: 15000 }
 * )
 *
 * @example
 * // Conditional refetch based on data
 * const { data } = useRealtimeQuery(
 *   ["invoice", invoiceId],
 *   () => fetchInvoice(invoiceId),
 *   {
 *     refetchInterval: (data) => {
 *       // Only refetch if invoice is not paid
 *       return data?.status !== 'paid' ? 20000 : false
 *     }
 *   }
 * )
 */
export function useRealtimeQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: {
    /**
     * Auto refetch interval in milliseconds
     * Set to false to disable
     * Can be a function that returns interval based on data
     */
    refetchInterval?: number | false | ((data: TData | undefined) => number | false)

    /**
     * Enable/disable the query
     * Default: true
     */
    enabled?: boolean

    /**
     * Number of retry attempts on error
     * Default: 0 (no retry)
     */
    retry?: number

    /**
     * Custom error handler
     */
    onError?: (error: TError) => void

    /**
     * Custom success handler
     */
    onSuccess?: (data: TData) => void
  }
) {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey,
    queryFn,

    // Cache configuration for real-time data
    staleTime: 0, // Always consider data stale - fetch on every access
    gcTime: 0, // Don't keep unused data in memory (was cacheTime in v4)

    // Refetch configuration
    refetchOnMount: "always", // Always refetch when component mounts
    // refetchOnWindowFocus: true, // Refetch when user returns to the tab
    refetchOnReconnect: true, // Refetch when network reconnects

    // Optional configurations from options
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled ?? true,
    retry: options?.retry ?? 0,

    // Callbacks
    ...((options?.onError || options?.onSuccess) && {
      onError: options?.onError,
      onSuccess: options?.onSuccess
    })
  } as UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>)
}

/**
 * Hook to detect if page is visible (for pausing polling)
 *
 * @returns true if page is visible, false if hidden
 *
 * @example
 * const isVisible = usePageVisibility()
 * const { data } = useRealtimeQuery(
 *   ["orders"],
 *   fetchOrders,
 *   { refetchInterval: isVisible ? 15000 : false }
 * )
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = React.useState(!document.hidden)

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return isVisible
}

// Add React import for useEffect and useState
import React from "react"
