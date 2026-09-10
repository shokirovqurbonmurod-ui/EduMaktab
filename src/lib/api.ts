import { useUIStore } from "@/stores/useUIStore";
import { useState, useCallback, useEffect, useRef } from "react";

/**
 * API facade.
 *
 * In demo mode every read goes through `apiRead`, which adds realistic
 * latency (skeletons) and can simulate a failed request (error states) —
 * controlled from Settings → "Demo holatlari".
 *
 * To connect a real backend, replace the body of `apiRead` with
 * `fetch(\`/api/${resource}\`)` — the call sites do not change.
 */

export async function apiRead<T>(make: () => T): Promise<T> {
  const { latency, forceError } = useUIStore.getState();
  if (latency > 0) await new Promise((r) => setTimeout(r, latency + Math.random() * 200));
  if (forceError) {
    throw new Error("Demo xato rejimi ishlab turibdi — ma'lumotlar manziliga ulanish imkoni bo'lmadi.");
  }
  return make();
}

interface PageData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Generic page-data hook: loading → data/error with retry.
 * All major pages use it, so every page has a proper
 * loading / empty / error lifecycle.
 */
export function usePageData<T>(make: () => T, deps: unknown[] = []): PageData<T> {
  const [state, setState] = useState<PageData<T>>({ data: null, loading: true, error: null, retry: () => {} });
  const seq = useRef(0);

  const load = useCallback(() => {
    const n = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiRead(make)
      .then((data) => {
        if (seq.current === n) setState({ data, loading: false, error: null, retry: load });
      })
      .catch((e: unknown) => {
        if (seq.current === n)
          setState({
            data: null,
            loading: false,
            error: e instanceof Error ? e.message : "Noma'lum xato yuz berdi.",
            retry: load,
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return state;
}
