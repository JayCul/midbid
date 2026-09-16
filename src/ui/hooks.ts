import { useCallback, useEffect, useState } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'browse' }
  | { page: 'create' }
  | { page: 'me' }
  | { page: 'setup' }
  | { page: 'auction'; address: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0];
  const [head, arg] = path.split('/');
  switch (head) {
    case 'browse':
      return { page: 'browse' };
    case 'create':
      return { page: 'create' };
    case 'me':
      return { page: 'me' };
    case 'setup':
      return { page: 'setup' };
    case 'auction':
      return arg ? { page: 'auction', address: arg.toLowerCase() } : { page: 'browse' };
    default:
      return { page: 'home' };
  }
}

/** Hash routing keeps deep links working on static hosting with no rewrites. */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const go = useCallback((to: string) => {
    window.location.hash = to;
  }, []);
  return { route, go };
}

/** Current time in seconds, ticking. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Runs an async loader, re-running on `deps` and every `pollMs`. Keeps the
 * last good value while a refresh is in flight so the page does not flicker.
 */
export function useLoader<T>(load: () => Promise<T>, deps: unknown[], pollMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    load()
      .then((value) => {
        if (!live) return;
        setData(value);
        setError(null);
      })
      .catch((err) => live && setError(err?.message ?? String(err)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => setTick((t) => t + 1), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
