import { convertToMs } from "../utils/helper";
import { RateLimitConfigInterface } from "../types/types";

const TTL_NUMBER: number = 1;
const TTL_UNIT: "min" | "hour" = "hour";
const UNAUTH_LIMIT = 100;
const AUTH_DEFAULT_LIMIT = 200;
const EVENT_LIMIT = 200;
const SLIDING_LOG_WINDOW_SIZE_MINUTES = 1;
const SLIDING_LOG_MAX_REQUESTS = 10;


export const defaultConfig: RateLimitConfigInterface = {
  ttl: convertToMs(TTL_NUMBER, TTL_UNIT),
  unauthLimit: UNAUTH_LIMIT,
  authLimit: AUTH_DEFAULT_LIMIT,
  SlidingLog: {
    windowSize: convertToMs(SLIDING_LOG_WINDOW_SIZE_MINUTES, "min"),
    maxRequests: SLIDING_LOG_MAX_REQUESTS,
  },
  override: [
    {
      url: "/sale",
      startTime: new Date("2024-08-23T05:38:44.981Z"),
      endTime: new Date("2024-08-23T05:40:44.981Z"),
      rateLimit: UNAUTH_LIMIT + EVENT_LIMIT, // Increased limit during the sale
    },
  ],
};
