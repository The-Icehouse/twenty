// Icehouse fork: shared status registry for avatar image URLs.
//
// Upstream probed every avatar URL with a fresh `new Image()` per mounted Avatar and kept
// the outcome in component-local state. In a virtualised table that meant a URL which
// 404s (twenty-icons.com has no logo for most of our company domains) was fetched by
// every row showing it, again on every re-render, and again whenever a pooled row was
// recycled onto another record. Here each URL gets exactly one probe, shared by every
// Avatar that shows it, the verdict is kept for the session, and twenty-icons.com misses
// are persisted so a later visit never requests them at all.

export type AvatarImageStatus = 'pending' | 'loaded' | 'failed';

const FAILED_AVATAR_URLS_STORAGE_KEY = 'icehouse.failedAvatarUrls';
const FAILED_AVATAR_URLS_MAX_ENTRIES = 2000;
const FAILED_AVATAR_URLS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Only misses from this host are persisted: the URL is content-addressed by domain and
// the service itself caches its 404s for months. Any other avatar URL (a signed file
// URL, a data: URI) can legitimately recover, so its failure is remembered for the
// session only.
const PERSISTED_FAILURE_URL_PREFIX = 'https://twenty-icons.com/';

type PersistedFailureEntry = [url: string, failedAt: number];

const statusByUrl = new Map<string, AvatarImageStatus>();
const listenersByUrl = new Map<string, Set<() => void>>();
const probeByUrl = new Map<string, HTMLImageElement>();
// Insertion-ordered oldest first, so trimming from the front drops the oldest misses.
const persistedFailedAtByUrl = new Map<string, number>();

let hasHydratedFromStorage = false;
let isPersistScheduled = false;

const isPersistedFailureEntry = (
  value: unknown,
): value is PersistedFailureEntry =>
  Array.isArray(value) &&
  typeof value[0] === 'string' &&
  typeof value[1] === 'number';

const hydrateFromStorage = () => {
  if (hasHydratedFromStorage) {
    return;
  }

  hasHydratedFromStorage = true;

  try {
    const raw = window.localStorage.getItem(FAILED_AVATAR_URLS_STORAGE_KEY);

    if (raw === null) {
      return;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return;
    }

    const now = Date.now();

    for (const entry of parsed) {
      if (!isPersistedFailureEntry(entry)) {
        continue;
      }

      const [url, failedAt] = entry;

      if (now - failedAt > FAILED_AVATAR_URLS_TTL_MS) {
        continue;
      }

      persistedFailedAtByUrl.set(url, failedAt);
      statusByUrl.set(url, 'failed');
    }
  } catch {
    // Storage unavailable (private mode, disabled, no window) or holding garbage:
    // the cache is then session-only.
  }
};

const persistToStorage = () => {
  isPersistScheduled = false;

  try {
    while (persistedFailedAtByUrl.size > FAILED_AVATAR_URLS_MAX_ENTRIES) {
      const oldestUrl = persistedFailedAtByUrl.keys().next().value;

      if (oldestUrl === undefined) {
        break;
      }

      persistedFailedAtByUrl.delete(oldestUrl);
    }

    window.localStorage.setItem(
      FAILED_AVATAR_URLS_STORAGE_KEY,
      JSON.stringify([...persistedFailedAtByUrl.entries()]),
    );
  } catch {
    // Quota exceeded or storage disabled: the in-memory cache still works.
  }
};

const schedulePersist = () => {
  if (isPersistScheduled) {
    return;
  }

  isPersistScheduled = true;

  // Coalesce the burst of misses from one table paint into a single write.
  setTimeout(persistToStorage, 0);
};

const notifyListeners = (url: string) => {
  listenersByUrl.get(url)?.forEach((listener) => listener());
};

const settleProbe = (url: string, status: AvatarImageStatus) => {
  probeByUrl.delete(url);
  statusByUrl.set(url, status);

  if (status === 'failed' && url.startsWith(PERSISTED_FAILURE_URL_PREFIX)) {
    persistedFailedAtByUrl.set(url, Date.now());
    schedulePersist();
  }

  notifyListeners(url);
};

const startProbeIfNeeded = (url: string) => {
  if (
    statusByUrl.has(url) ||
    probeByUrl.has(url) ||
    typeof Image === 'undefined'
  ) {
    return;
  }

  const probe = new Image();

  probe.onload = () => settleProbe(url, 'loaded');
  probe.onerror = () => settleProbe(url, 'failed');
  probe.src = url;

  probeByUrl.set(url, probe);
};

export const getAvatarImageStatus = (url: string): AvatarImageStatus => {
  hydrateFromStorage();

  return statusByUrl.get(url) ?? 'pending';
};

export const subscribeToAvatarImageStatus = (
  url: string,
  listener: () => void,
): (() => void) => {
  hydrateFromStorage();

  const listeners = listenersByUrl.get(url) ?? new Set<() => void>();

  listenersByUrl.set(url, listeners);
  listeners.add(listener);

  startProbeIfNeeded(url);

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      listenersByUrl.delete(url);
    }
  };
};
