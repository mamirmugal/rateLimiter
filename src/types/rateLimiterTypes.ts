export type RateLimit = {
  limit: number;
  slidingLog: {
    windowSize: number;
    maxRequests: number;
  };
};

export type OverriderEvent = {
  url: string;
  startTime: Date;
  endTime: Date;
  rateLimit: RateLimit;
};

export type RateLimitConfigType = {
  ttl: number;
  authLimit: RateLimit;
  unauthLimit: RateLimit;
  override: OverriderEvent[];
};

export type RateLimitResult = {
  isNotAllowed: boolean;
  requests: number;
  ttl: number;
};

export type EvaluateRateLimitResult = {
  tooManyRequests: boolean;
  retryAfter: number;
  ratelimit: number;
  remainingRequests: number;
  resetTime: number;
};