import { RateLimit } from './rateLimiterTypes';

export type GetRateLimitReturnType = {
  isOverrideEvent: boolean;
  ratelimit: RateLimit;
};
