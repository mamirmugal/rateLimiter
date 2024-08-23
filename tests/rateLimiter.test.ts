import { Request } from "express";
import { RedisClient } from "../src/utils/redisClient"; 
import { RateLimitConfigInterface } from "../src/types/types";
import { RateLimiter } from "../src/middleware/rateLimiter";

jest.mock("../src/utils/redisClient");

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;
  let mockRedisClient: jest.Mocked<RedisClient>;
  let mockConfig: RateLimitConfigInterface;

  beforeEach(() => {
    mockRedisClient = new RedisClient("", 0, 0) as jest.Mocked<RedisClient>;
    mockConfig = {
      unauthLimit: 10,
      authLimit: 20,
      ttl: 3600,
      SlidingLog: {
        maxRequests: 2,
        windowSize: 5000,
      },
      override: [
        {
          url: "/special",
          startTime: new Date(Date.now() - 3600000), // 1 hour ago
          endTime: new Date(Date.now() + 3600000), // 1 hour from now
          rateLimit: 30,
        },
      ],
    };
    rateLimiter = new RateLimiter(mockRedisClient, mockConfig);
  });

  describe("calculateLimit", () => {
    it("should return correct limit for unauthenticated user", () => {
      const req = {
        ip: "127.0.0.1",
        path: "/test",
        headers: {},
      } as unknown as Request;

      const [key, limit] = rateLimiter.calculateLimit(req);

      expect(key).toBe("limit:127.0.0.1:/test:false");
      expect(limit).toBe(10); // unauthLimit
    });

    it("should return correct limit for authenticated user", () => {
      const req = {
        ip: "127.0.0.1",
        path: "/test",
        headers: {
          authorization: "Bearer token",
        },
      } as unknown as Request;

      const [key, limit] = rateLimiter.calculateLimit(req);

      expect(key).toBe("limit:127.0.0.1:/test:true");
      expect(limit).toBe(20); // authLimit
    });

    it("should return override limit for special endpoint", () => {
      const req = {
        ip: "127.0.0.1",
        path: "/special",
        headers: {},
      } as unknown as Request;

      const [key, limit] = rateLimiter.calculateLimit(req);

      expect(key).toBe("limit:127.0.0.1:/special:false");
      expect(limit).toBe(30); // overrideLimit
    });

    it("should not apply override limit for expired event", () => {
      mockConfig.override[0].endTime = new Date(Date.now() - 3600000); // 1 hour ago
      rateLimiter = new RateLimiter(mockRedisClient, mockConfig);

      const req = {
        ip: "127.0.0.1",
        path: "/special",
        headers: {},
      } as unknown as Request;

      const [key, limit] = rateLimiter.calculateLimit(req);

      expect(key).toBe("limit:127.0.0.1:/special:false");
      expect(limit).toBe(10); // unauthLimit (no override)
    });
  });
});
