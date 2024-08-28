import { RateLimitConfigType } from '../types';
import { OverriderEvent } from '../types/rateLimiterTypes';
import { convertToMs } from '../utils';
import { ConfigManager } from './configManager';

describe('ConfigManager', () => {
  let validConfig: RateLimitConfigType;

  beforeEach(() => {
    validConfig = {
      ttl: 3600,
      authLimit: {
        limit: 100,
        slidingLog: {
          windowSize: convertToMs(1, 'min'),
          maxRequests: 20,
        },
      },
      unauthLimit: {
        limit: 50,
        slidingLog: {
          windowSize: convertToMs(1, 'min'),
          maxRequests: 20,
        },
      },
      override: [
        {
          url: '/api/test',
          startTime: new Date(Date.now() - 3600000),
          endTime: new Date(Date.now() + 3600000),
          rateLimit: {
            limit: 200,
            slidingLog: {
              windowSize: convertToMs(1, 'min'),
              maxRequests: 20,
            },
          },
        },
      ],
    };
  });

  describe('constructor', () => {
    it('should create an instance with valid configuration', () => {
      expect(() => new ConfigManager(validConfig)).not.toThrow();
    });

    it('should throw an error for invalid TTL', () => {
      const invalidConfig = { ...validConfig, ttl: 0 };
      expect(() => new ConfigManager(invalidConfig)).toThrow('Invalid configuration: TTL must be a positive number.');
    });
  });

  describe('getRateLimit', () => {
    let configManager: ConfigManager;

    beforeEach(() => {
      configManager = new ConfigManager(validConfig);
    });

    it('should return authenticated rate limit for authenticated user', () => {
      const result = configManager.getRateLimit('/api/other', true);
      expect(result).toEqual({
        isOverrideEvent: false,
        ratelimit: validConfig.authLimit,
      });
    });

    it('should return unauthenticated rate limit for unauthenticated user', () => {
      const result = configManager.getRateLimit('/api/other', false);
      expect(result).toEqual({
        isOverrideEvent: false,
        ratelimit: validConfig.unauthLimit,
      });
    });

    it('should return override rate limit for matching URL and time', () => {
      const result = configManager.getRateLimit('/api/test', true);
      expect(result).toEqual({
        isOverrideEvent: true,
        ratelimit: validConfig.override[0].rateLimit,
      });
    });

    it('should not return override rate limit for non-matching URL', () => {
      const result = configManager.getRateLimit('/api/other', true);
      expect(result).toEqual({
        isOverrideEvent: false,
        ratelimit: validConfig.authLimit,
      });
    });

    it('should not return override rate limit for out-of-time-range request', () => {
      const pastOverride: OverriderEvent = {
        url: '/api/past',
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000),
        rateLimit: {
          limit: 300,
          slidingLog: {
            windowSize: convertToMs(1, 'min'),
            maxRequests: 20,
          },
        },
      };
      const configWithPastOverride = new ConfigManager({
        ...validConfig,
        override: [...validConfig.override, pastOverride],
      });
      const result = configWithPastOverride.getRateLimit('/api/past', true);
      expect(result).toEqual({
        isOverrideEvent: false,
        ratelimit: validConfig.authLimit,
      });
    });
  });
});
