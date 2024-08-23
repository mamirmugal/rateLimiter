import express, { Application } from "express";
import { defaultConfig } from "./config/config";
import { RateLimiter } from "./middleware/rateLimiter";
import { RedisClient } from "./utils/redisClient";
import pino from "pino";

const app: Application = express();
const logger = pino();
const port = 3002;

const redisClient = new RedisClient(
  "redis://localhost:6379",
  defaultConfig.SlidingLog.windowSize,
  defaultConfig.SlidingLog.maxRequests
);

const rateLimiter = new RateLimiter(redisClient, defaultConfig);

app.use(rateLimiter.middleware);

app.get("/", (req, res) => {
  res.send("Public");
});

app.get("/sale", (req, res) => {
  res.send("Sale!!!");
});

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}`);
});
