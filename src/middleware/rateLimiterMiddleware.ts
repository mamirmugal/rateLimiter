import { CustomRequest, EvaluateRateLimitResult, GetRateLimitReturnType, RateLimitConfigType } from '../types';
import { RedisRateLimitService } from '../services';
import { NextFunction, Response } from 'express';
import { RateLimitResult } from '../types';
import { ConfigManager } from '../config';
import { Logger } from 'pino';

export class RateLimiterMiddleware {
  private redisClient: RedisRateLimitService;
  private config: RateLimitConfigType;
  private configManager: ConfigManager;
  private logger: Logger;
  private readonly TOO_MANY_REQUESTS_STATUS = 429;

  constructor(
    redisClient: RedisRateLimitService,
    configManager: ConfigManager,
    config: RateLimitConfigType,
    logger: Logger
  ) {
    this.redisClient = redisClient;
    this.configManager = configManager;
    this.config = config;
    this.logger = logger;
  }

  async evaluateRateLimit(req: CustomRequest): Promise<EvaluateRateLimitResult> {
    const ip: string | undefined = req.ip;
    const endpoint: string | undefined = req.path;

    if (!ip || !endpoint) throw new Error('Invalid request: IP or endpoint is missing');

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

  // adding response headers
  private setRateLimitHeaders(res: Response, ratelimit: number, remainingRequests: number, resetTime: number) {
    res.setHeader('X-RateLimit-Limit', ratelimit);
    res.setHeader('X-RateLimit-Remaining', remainingRequests);
    res.setHeader('X-RateLimit-Reset', resetTime);
  }

  // middleware to use with express
  middleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      // getting the key for redis and
      // limit allowed for the user
      const { tooManyRequests, retryAfter, ratelimit, remainingRequests, resetTime }: EvaluateRateLimitResult =
        await this.evaluateRateLimit(req);

      if (tooManyRequests) {
        return res.status(this.TOO_MANY_REQUESTS_STATUS).json({
          error: 'Too Many Requests',
          retryAfter: retryAfter,
        });
      }

      // Then in the middleware method:
      this.setRateLimitHeaders(res, ratelimit, remainingRequests, resetTime);

      next();
    } catch (error) {
      this.logger.error('Rate limiter error:', error);
      next(error);
    }
  };
}
