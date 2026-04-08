import { CacheService } from '@/services/cacheService';

describe('CacheService', () => {
  it('stores and retrieves cache entries', () => {
    const cache = new CacheService();
    cache.set('key1', 'value1', 60); // 60 minutes
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns null for expired entries', () => {
    const cache = new CacheService();
    cache.set('key2', 'value2', 0); // Expired immediately
    expect(cache.get('key2')).toBeNull();
  });
});