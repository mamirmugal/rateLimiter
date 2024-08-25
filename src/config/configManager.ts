import { GetRateLimitReturnType, RateLimit, RateLimitConfigType } from '../types';
import { OverriderEvent } from '../types/rateLimiterTypes';

export class ConfigManager {
  private options: RateLimitConfigType;

  constructor(options: RateLimitConfigType) {
    this.options = options;
    this.validateConfig();
  }

  // validating basic config
  private validateConfig() {
    if (!this.options.ttl || this.options.ttl <= 0) {
      throw new Error('Invalid configuration: TTL must be a positive number.');
    }

    if (!this.options.authLimit) {
      throw new Error('Invalid configuration: authenticated config missing.');
    }

    if (!this.options.unauthLimit) {
      throw new Error('Invalid configuration: unauthenticated config missing.');
    }

    if (!this.options.override) {
      throw new Error('Invalid configuration: override config missing.');
    }
  }

  private getOverrideEvent(url: string): RateLimit | null {
    const currentTime: Date = new Date();

    const event: OverriderEvent | undefined = this.options.override.find(
      (event: OverriderEvent) => event.url === url && currentTime >= event.startTime && currentTime <= event.endTime
    );

    return event ? event.rateLimit : null;
  }

  getRateLimit(endpoint: string, isAuthenticated: boolean): GetRateLimitReturnType {
    let isOverrideEvent = false;

    let ratelimit: RateLimit = this.options.unauthLimit;
    // auth user
    if (isAuthenticated) ratelimit = this.options.authLimit;

    // change to override event
    const eventLimit: RateLimit | null = this.getOverrideEvent(endpoint);

    if (eventLimit) {
      isOverrideEvent = true;
      ratelimit = eventLimit;
    }

    return {
      isOverrideEvent,
      ratelimit,
    };
  }
}
