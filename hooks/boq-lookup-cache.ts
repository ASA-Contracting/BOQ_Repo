import type {
  BoqLookupCategory,
  BoqLookupOptionDto,
} from "@/application/dto/boq/boqLookupOptionDto";

type CacheEntry = {
  items: BoqLookupOptionDto[];
  fetchedAt: number;
  inflight: Promise<BoqLookupOptionDto[]> | null;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<BoqLookupCategory, CacheEntry>();
const listeners = new Map<BoqLookupCategory, Set<() => void>>();

function notify(category: BoqLookupCategory) {
  const subs = listeners.get(category);
  if (!subs) return;
  for (const cb of subs) {
    cb();
  }
}

function getEntry(category: BoqLookupCategory): CacheEntry {
  let entry = cache.get(category);
  if (!entry) {
    entry = { items: [], fetchedAt: 0, inflight: null };
    cache.set(category, entry);
  }
  return entry;
}

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

async function fetchCategory(category: BoqLookupCategory): Promise<BoqLookupOptionDto[]> {
  const response = await fetch(`/api/boq/lookups?category=${encodeURIComponent(category)}`);
  const raw = await response.text();
  let json: ApiEnvelope<BoqLookupOptionDto[]> | null = null;
  if (raw.trim()) {
    json = JSON.parse(raw) as ApiEnvelope<BoqLookupOptionDto[]>;
  }
  if (!response.ok || !json?.success || !json.data) {
    throw new Error(json?.message ?? "Failed to load BOQ settings");
  }
  return json.data;
}

export function subscribeBoqLookupCache(
  category: BoqLookupCategory,
  listener: () => void,
): () => void {
  let subs = listeners.get(category);
  if (!subs) {
    subs = new Set();
    listeners.set(category, subs);
  }
  subs.add(listener);
  return () => {
    subs?.delete(listener);
    if (subs?.size === 0) listeners.delete(category);
  };
}

export function getCachedBoqLookupOptions(category: BoqLookupCategory): BoqLookupOptionDto[] {
  return getEntry(category).items;
}

export function isBoqLookupCacheFresh(category: BoqLookupCategory): boolean {
  const entry = getEntry(category);
  return entry.items.length > 0 && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

export async function loadBoqLookupOptions(
  category: BoqLookupCategory,
  { force = false }: { force?: boolean } = {},
): Promise<BoqLookupOptionDto[]> {
  const entry = getEntry(category);

  if (!force && isBoqLookupCacheFresh(category)) {
    return entry.items;
  }

  if (entry.inflight) {
    return entry.inflight;
  }

  entry.inflight = fetchCategory(category)
    .then((items) => {
      entry.items = items;
      entry.fetchedAt = Date.now();
      entry.inflight = null;
      notify(category);
      return items;
    })
    .catch((error) => {
      entry.inflight = null;
      throw error;
    });

  return entry.inflight;
}

export function invalidateBoqLookupCache(category?: BoqLookupCategory) {
  if (category) {
    const entry = getEntry(category);
    entry.fetchedAt = 0;
    notify(category);
    return;
  }
  for (const key of cache.keys()) {
    const entry = getEntry(key);
    entry.fetchedAt = 0;
    notify(key);
  }
}

export function setCachedBoqLookupOptions(
  category: BoqLookupCategory,
  items: BoqLookupOptionDto[],
) {
  const entry = getEntry(category);
  entry.items = items;
  entry.fetchedAt = Date.now();
  notify(category);
}
