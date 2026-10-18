"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

export type ResourceState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: ApiError };

/**
 * Tiny loading/success/error wrapper around a GET call, built from plain
 * useState/useEffect. `fetcher` must be referentially stable (module-level
 * function or useCallback) or the request will re-run on every render.
 */
export function useApiResource<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<ResourceState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ status: "success", data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          error:
            error instanceof ApiError
              ? error
              : new ApiError(0, "Something unexpected went wrong. Please try again."),
        });
      });

    // Ignore a slow response that arrives after unmount or a retry.
    return () => {
      cancelled = true;
    };
  }, [fetcher, attempt]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((current) => current + 1);
  }, []);

  return { state, reload };
}
