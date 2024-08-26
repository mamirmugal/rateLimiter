import express, { Application } from 'express';
import pino, { Logger } from 'pino';
import { rateLimitConfig, PORT, REDIS_URI, ConfigManager } from './config';
import { RateLimiterMiddleware } from './middleware';
import router from './routers';
import { RedisRateLimitService } from './services';

const app: Application = express();
const logger: Logger = pino();
const port: number = PORT || 3002;

// Initialize Redis service
const redisService = new RedisRateLimitService(REDIS_URI);

// Initialize Config Manager
const configManager = new ConfigManager(rateLimitConfig);

// Initialize Rate Limiter Middleware
const rateLimiter: RateLimiterMiddleware = new RateLimiterMiddleware(
  redisService,
  configManager,
  rateLimitConfig,
  logger
);

// Apply middleware
app.use(rateLimiter.middleware);

// Apply router
app.use(router);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}).on('error', (err: Error) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});