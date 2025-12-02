// eslint-disable-next-line import/no-extraneous-dependencies
import { createClient } from 'redis';

class CacheService {
  constructor() {
    this._client = createClient({
      socket: {
        host: process.env.REDIS_URL,
      },
    });
    this._client.on('error', (err) => console.log('Redis Client Error', err));
    this._client.connect();
  }

  async set(key, value, expirationInSeconds = 1800) {
    await this._client.set(key, value, {
      EX: expirationInSeconds,
    });
  }

  async get(key) {
    const result = await this._client.get(key);
    if (result === null) {
      throw new Error('Cache not found');
    }
    return result;
  }

  async delete(key) {
    return this._client.del(key);
  }
}

export default CacheService;
