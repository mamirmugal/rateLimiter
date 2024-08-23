import request from "supertest";
import express from "express";
import { RedisClient } from "../src/utils/redisClient";
import { RateLimiter } from "../src/middleware/rateLimiter";
import { RateLimitConfigInterface } from "../src/types/types";
import { convertToMs, nextTime, prevTime } from "../src/utils/helper";

jest.mock("../src/utils/redisClient");

describe("RateLimiter", () => {
  let app: express.Application;
  let mockRedisClient: jest.Mocked<RedisClient>;
  let config: RateLimitConfigInterface;

  beforeEach(() => {
    mockRedisClient = new RedisClient("", 0, 0) as jest.Mocked<RedisClient>;
    config = {
      ttl: convertToMs(1, "min"),
      unauthLimit: 10,
      authLimit: 20,
      SlidingLog: {
        maxRequests: 2,
        windowSize: 5000,
      },
      override: [
        {
          url: "/sale",
          startTime: prevTime(1),
          endTime: nextTime(1),
          rateLimit: 12, // Increased limit during the sale
        },
      ],
    };

    app = express();
    const rateLimiter = new RateLimiter(mockRedisClient, config);
    app.use(rateLimiter.middleware);
    app.get("/", (req, res) => res.sendStatus(200));
  });

  it("should allow requests within the limit", async () => {
    mockRedisClient.incrAndExpire.mockResolvedValue([10, 1800000]);

    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.header["x-ratelimit-limit"]).toBe("10");
    expect(response.header["x-ratelimit-remaining"]).toBe("0");
  });

  it("should block requests exceeding the limit", async () => {
    mockRedisClient.incrAndExpire.mockResolvedValue([11, 1800000]);

    const response = await request(app).get("/");
    expect(response.status).toBe(429);
    expect(response.body.error).toBe("Too Many Requests");
  });

  it("should apply different limits for authenticated users", async () => {
    mockRedisClient.incrAndExpire.mockResolvedValue([15, 1800000]);

    const response = await request(app)
      .get("/")
      .set("Authorization", "Bearer token");
    expect(response.status).toBe(200);
    expect(response.header["x-ratelimit-limit"]).toBe("20");
    expect(response.header["x-ratelimit-remaining"]).toBe("5");
  });

  it("sliding log is allowed", async () => {
    mockRedisClient.incrAndExpire.mockResolvedValue([10, 1800000]);
    mockRedisClient.isNotAllowed.mockResolvedValue(false);

    const response = await request(app).get("/");

    expect(response.status).toBe(200);

  });

  it("sliding log is not allowed", async () => {
    mockRedisClient.incrAndExpire.mockResolvedValue([10, 1800000]);
    mockRedisClient.isNotAllowed.mockResolvedValue(true);

    const response = await request(app).get("/");

    expect(response.status).toBe(429);
    expect(response.body.error).toBe("Too Many Requests");
  });
});
