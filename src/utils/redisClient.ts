import Redis from 'ioredis';

export class RedisClient {
  private client: Redis;
  private windowSizeMs: number;
  private maxRequests: number;

  constructor(redisUrl: string, windowSizeMs: number, maxRequests: number) {
    this.client = new Redis(redisUrl);
    this.windowSizeMs = windowSizeMs;
    this.maxRequests = maxRequests;
  }

  async removeKey(key: string){
    await this.client.del(key);
  }

  async incrAndExpire(key: string, windowMs: number): Promise<[number, number]> {
    // this.removeKey(key)

    const multi = this.client.multi();
    multi.incr(key);
    multi.pttl(key);
    const result = await multi.exec();

    if (!result || result.length !== 2 || result[0][0] || result[1][0]) {
      throw new Error('Unexpected result from Redis');
    }
  
    const count = result[0][1] as number;
    const ttl = result[1][1] as number;

    if (ttl && ttl === -1) {
      await this.client.pexpire(key, windowMs);
      return [count, windowMs];
    }

    return [count, ttl];
  }

  // sliding log allowed or not
  async isNotAllowed(key: string): Promise<boolean> {
    const now = Date.now();

    const windowStart = now - this.windowSizeMs;

    // Start a Redis transaction
    const multi = this.client.multi();

    // Remove timestamps outside the current window
    multi.zremrangebyscore(key, 0, windowStart);

    // Count requests within the current window
    multi.zcard(key);

    // Add current timestamp to the sorted set
    multi.zadd(key, now.toString(), now.toString());

    // Set expiration for the key
    multi.pexpire(key, this.windowSizeMs);

    // Execute the transaction
    const results = await multi.exec();

    if (!results) {
      throw new Error('Redis transaction failed');
    }

    // The count is the second command's result (zcard)
    const count = results[1][1] as number;

    return count >= this.maxRequests;
  }

}