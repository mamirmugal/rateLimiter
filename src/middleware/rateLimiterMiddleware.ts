import { NextFunction, Request, Response } from 'express';
import pino, { Logger } from 'pino';
import { RedisRateLimitService } from '../services';
import { CustomRequest, EvaluateRateLimitResult, GetRateLimitReturnType, RateLimitConfigType } from '../types';
import { RateLimitResult } from '../types';
import { ConfigManager } from '../config';

export class RateLimiterMiddleware {
  private redisClient: RedisRateLimitService;
  private config: RateLimitConfigType;
  private configManager: ConfigManager;
  private logger: Logger;

  constructor(redisClient: RedisRateLimitService, configManager: ConfigManager, config: RateLimitConfigType) {
    this.redisClient = redisClient;
    this.configManager = configManager;
    this.config = config;
    this.logger = pino();
  }

  async evaluateRateLimit(req: CustomRequest): Promise<EvaluateRateLimitResult> {
    const ip: string | undefined = req.ip;
    const endpoint: string | undefined = req.path;

    // basic auth check
    const isAuthenticated: boolean = req.headers['authorization'] !== undefined;

    // getting the rate limit from the configManager
    const limitObj: GetRateLimitReturnType = this.configManager.getRateLimit(endpoint, isAuthenticated);

    // setting overrider in request
    if (limitObj.isOverrideEvent) req.overrider = true;

    const key: string = `limit:${ip}:${endpoint}:${isAuthenticated}`;

    this.logger.info(`Unique key per IP: ${key}`);
    this.logger.info(`Limit for this IP: ${limitObj.ratelimit.limit}`);

    const { isNotAllowed, requests, ttl }: RateLimitResult = await this.redisClient.incrExpireCalcSlidingLog(
      key,
      this.config.ttl,
      limitObj.ratelimit
    );

    // boolean value to request not allowed
    // either by ratelimit or sliding log
    const tooManyRequests: boolean = isNotAllowed || requests > limitObj.ratelimit.limit;
    // calculating remaining requests, which will be send back to the user
    const remainingRequests: number = Math.max(0, limitObj.ratelimit.limit - requests);
    // calculate reset value, which will also be send back to the user
    const resetTime: number = Math.ceil(Date.now() / 1000 + ttl / 1000);

    this.logger.info(`Remaining requests for this IP: ${remainingRequests}`);

    return {
      tooManyRequests,
      retryAfter: Math.ceil(ttl / 1000),
      ratelimit: limitObj.ratelimit.limit,
      remainingRequests,
      resetTime,
    };
  }

  // middle ware to use with express 
  middleware = async (req: Request, res: Response, next: NextFunction) => {
    this.logger.info(`Time:", ${new Date().toISOString()}`);

    try {
      // getting the key for redis and
      // limit allowed for the user
      const { tooManyRequests, retryAfter, ratelimit, remainingRequests, resetTime }: EvaluateRateLimitResult =
        await this.evaluateRateLimit(req);

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
