export type TTL_UNIT_TYPE = 'min' | 'hour';

export type CalculateLimitResult = {
  tooManyRequests: boolean;
  retryAfter: number;
  ratelimit: number;
  remainingRequests: number;
  resetTime: number;
};
