import { Request, Response, NextFunction } from "express";
import { RedisClient } from "../utils/redisClient";
import { RateLimitConfigInterface } from "../types/types";
import pino from "pino";

export class RateLimiter {
  private redisClient: RedisClient;
  private config: RateLimitConfigInterface;
  private logger;

  constructor(redisClient: RedisClient, config: RateLimitConfigInterface) {
    this.redisClient = redisClient;
    this.config = config;
    this.logger = pino();
  }

  getOverrideEvent = (url: string ): number | null => {
    const currentTime = new Date();

    const event = this.config.override.find(
      (event) =>
        event.url === url &&
        currentTime >= event.startTime &&
        currentTime <= event.endTime
    );

    return event ? event.rateLimit : null;
  };

  calculateLimit = (req: Request): [string, number] => {
    const ip = req.ip;
    const endpoint = req.path;
    const isAuthenticated = req.headers["authorization"] !== undefined;

    let limit = this.config.unauthLimit;
    // auth user
    if (isAuthenticated) {
      limit = this.config.authLimit;
    }

    // change to override event
    const eventLimit = this.getOverrideEvent(endpoint);
    if(eventLimit) limit = eventLimit;

    const key = `limit:${ip}:${endpoint}:${isAuthenticated}`;
    // const key = `limit:${ip}:${isAuthenticated}`;

    this.logger.info(`Unique key per IP: ${key}`);
    this.logger.info(`Limit for this IP: ${limit}`);

    return [key, limit];
  };

  middleware = async (req: Request, res: Response, next: NextFunction) => {
    this.logger.info(`Time:", ${(new Date).toISOString()}`);

    // getting the key for redis and
    // limit allowed for the user
    const [key, limit] = this.calculateLimit(req);

    try {
      const [requests, ttl] = await this.redisClient.incrAndExpire(
        key,
        this.config.ttl // default 1 hour
      );

      const isAllowed = await this.redisClient.isNotAllowed(`${key}-slide`);

      if (isAllowed || requests > limit) {
        return res.status(429).json({
          error: "Too Many Requests",
          retryAfter: Math.ceil(ttl / 1000),
        });
      }

      const remainingRequests = Math.max(0, limit - requests);
      const resetTime = Math.ceil(Date.now() / 1000 + ttl / 1000);

      this.logger.info(`Remaining requests for this IP: ${remainingRequests}`);
      this.logger.info(`Reset limit requests for this IP: ${resetTime}`);

      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", remainingRequests);
      res.setHeader("X-RateLimit-Reset", resetTime);

      next();
    } catch (error) {
      this.logger.error("Rate limiter error:", error);
      next(error);
    }
  };

}
