import { defaultConfig, PORT, REDIT_URI } from './config';
import express, { Application } from 'express';
import { RateLimiter } from './middleware';
import { RedisClient } from './utils';
import router from './routers';
import pino from 'pino';

const app: Application = express();
const logger = pino();
const port = PORT || 3002;

// getting Rate limiter
const rateLimiter = new RateLimiter(new RedisClient(REDIT_URI), defaultConfig);

// middleware
app.use(rateLimiter.middleware);

// router
app.use(router);

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}`);
});
