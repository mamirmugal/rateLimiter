export type TTL_UNIT_TYPE = "min" | "hour";

type OverriderEvent = {
  url: string;
  startTime: Date;
  endTime: Date;
  rateLimit: number;
};

export interface RateLimitConfigInterface {
  ttl: number;
  authLimit: number;
  unauthLimit: number;
  override: OverriderEvent[];
  SlidingLog: {
    windowSize: number,
    maxRequests: number,
  },
}
