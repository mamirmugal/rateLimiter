import { Request, Response, NextFunction } from 'express';
import { RedisClient } from '../utils';
import { CalculateLimitResult, RateLimit, RateLimitConfigInterface } from '../types';
import pino from 'pino';

export class RateLimiter {
  private redisClient: RedisClient;
  private config: RateLimitConfigInterface;
  private logger;

  constructor(redisClient: RedisClient, config: RateLimitConfigInterface) {
    this.redisClient = redisClient;
    this.config = config;
    this.logger = pino();
  }

  getOverrideEvent = (url: string): RateLimit | null => {
    const currentTime = new Date();

    const event = this.config.override.find(
      (event) => event.url === url && currentTime >= event.startTime && currentTime <= event.endTime
    );

    return event ? event.rateLimit : null;
  };

  calculateLimit = async (req: Request): Promise<CalculateLimitResult> => {
    const ip = req.ip;
    const endpoint = req.path;
    // basic auth check
    const isAuthenticated = req.headers['authorization'] !== undefined;

    let ratelimit: RateLimit = this.config.unauthLimit;
    // auth user
    if (isAuthenticated) ratelimit = this.config.authLimit;

    // change to override event
    const eventLimit = this.getOverrideEvent(endpoint);
    if (eventLimit) ratelimit = eventLimit;

    const key = `limit:${ip}:${endpoint}:${isAuthenticated}`;
    // const key = `limit:${ip}:${isAuthenticated}`;

    this.logger.info(`Unique key per IP: ${key}`);
    this.logger.info(`Limit for this IP: ${ratelimit.limit}`);

    const { isNotAllowed, requests, ttl } = await this.redisClient.incrExpireCalcSlidingLog(
      key,
      this.config.ttl,
      ratelimit
    );

    // boolean value to request not allowed
    // either by ratelimit or sliding log
    const tooManyRequests = isNotAllowed || requests > ratelimit.limit;

    // calculating remaining requests, which will be send back to the user
    const remainingRequests = Math.max(0, ratelimit.limit - requests);
    // calculate reset value, which will also be send back to the user
    const resetTime = Math.ceil(Date.now() / 1000 + ttl / 1000);

    this.logger.info(`Remaining requests for this IP: ${remainingRequests}`);

    return {
      tooManyRequests,
      retryAfter: Math.ceil(ttl / 1000),
      ratelimit: ratelimit.limit,
      remainingRequests,
      resetTime,
    };
  };

  middleware = async (req: Request, res: Response, next: NextFunction) => {
    this.logger.info(`Time:", ${new Date().toISOString()}`);

    try {
      // getting the key for redis and
      // limit allowed for the user
      const { tooManyRequests, retryAfter, ratelimit, remainingRequests, resetTime } = await this.calculateLimit(req);

      if (tooManyRequests) {
        return res.status(429).json({
          error: 'Too Many Requests',
          retryAfter: retryAfter,
        });
      }

      // adding required headers
      res.setHeader('X-RateLimit-Limit', ratelimit);
      res.setHeader('X-RateLimit-Remaining', remainingRequests);
      res.setHeader('X-RateLimit-Reset', resetTime);

      next();
    } catch (error) {
      this.logger.error('Rate limiter error:', error);
      next(error);
    }
  };
}
