/**
 * تخزين مؤقت (Caching) مع مدة صلاحية TTL
 * يقلل طلبات قاعدة البيانات بتخزين النتائج في localStorage
 */

const CACHE_PREFIX = 'ytdz_cache_';
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 دقائق

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function getKey(key: string): string {
  return CACHE_PREFIX + key;
}

/**
 * قراءة من التخزين المؤقت. يرجع null إذا انتهت الصلاحية أو لا يوجد.
 */
export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(getKey(key));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(getKey(key));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

/**
 * كتابة إلى التخزين المؤقت مع مدة صلاحية (بالمللي ثانية).
 */
export function cacheSet<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs
    };
    localStorage.setItem(getKey(key), JSON.stringify(entry));
  } catch (e) {
    console.warn('Cache set failed:', e);
  }
}

/**
 * حذف مفتاح من التخزين المؤقت.
 */
export function cacheRemove(key: string): void {
  try {
    localStorage.removeItem(getKey(key));
  } catch {}
}

/**
 * مسح كل مفاتيح التخزين المؤقت الخاصة بالتطبيق.
 */
export function cacheClear(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export const CACHE_KEYS = {
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  FEATURED_PRODUCTS: 'featured_products'
} as const;

export const CACHE_TTL_MS = DEFAULT_TTL_MS;
