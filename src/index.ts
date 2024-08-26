import express, { Application } from 'express';
import pino, { Logger } from 'pino';
import { rateLimitConfig, PORT, REDIS_URI, ConfigManager } from './config';
import { RateLimiterMiddleware } from './middleware';
import router from './routers';
import { RedisRateLimitService } from './services';

const app: Application = express();
const logger: Logger = pino();
const port: number = PORT || 3002;

// getting Rate limiter
const rateLimiter: RateLimiterMiddleware = new RateLimiterMiddleware(
  new RedisRateLimitService(REDIS_URI),
  new ConfigManager(rateLimitConfig),
  rateLimitConfig,
  logger
);

// middleware
app.use(rateLimiter.middleware);

// router
app.use(router);

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}`);
});
