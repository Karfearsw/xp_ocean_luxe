const cacheStore = new Map<string, { expiresAt: number; value: unknown }>();

export async function withCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const current = cacheStore.get(key);
  if (current && current.expiresAt > Date.now()) {
    return current.value as T;
  }

  const value = await loader();
  cacheStore.set(key, { expiresAt: Date.now() + ttlMs, value });
  return value;
}
