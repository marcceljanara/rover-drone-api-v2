/* eslint-disable import/no-extraneous-dependencies */
import { createClient } from 'redis';
import CacheService from '../CacheService.js';

// --- Mock seluruh modul redis ---
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('CacheService', () => {
  let mockRedisClient;

  beforeEach(() => {
    // Mock semua method milik redis client
    mockRedisClient = {
      connect: jest.fn(),
      on: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    createClient.mockReturnValue(mockRedisClient);
    process.env.REDIS_SERVER = '127.0.0.1';

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create redis client and connect', () => {
      // eslint-disable-next-line no-new
      new CacheService();

      expect(createClient).toHaveBeenCalledWith({
        socket: { host: '127.0.0.1' },
      });
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should call redis.set with key, value, and expiration', async () => {
      const cacheService = new CacheService();

      await cacheService.set('user:1', 'John', 300);

      expect(mockRedisClient.set).toHaveBeenCalledWith('user:1', 'John', {
        EX: 300,
      });
    });

    it('should use default expiration if not provided', async () => {
      const cacheService = new CacheService();

      await cacheService.set('key', 'value');

      expect(mockRedisClient.set).toHaveBeenCalledWith('key', 'value', {
        EX: 1800,
      });
    });
  });

  describe('get', () => {
    it('should return cached value if exists', async () => {
      const cacheService = new CacheService();
      mockRedisClient.get.mockResolvedValue('cached-data');

      const result = await cacheService.get('key1');

      expect(mockRedisClient.get).toHaveBeenCalledWith('key1');
      expect(result).toBe('cached-data');
    });

    it('should throw error if cache not found', async () => {
      const cacheService = new CacheService();
      mockRedisClient.get.mockResolvedValue(null);

      await expect(cacheService.get('missing')).rejects.toThrow('Cache not found');
    });
  });

  describe('delete', () => {
    it('should call redis.del with key', async () => {
      const cacheService = new CacheService();

      await cacheService.delete('key1');

      expect(mockRedisClient.del).toHaveBeenCalledWith('key1');
    });
  });
});
