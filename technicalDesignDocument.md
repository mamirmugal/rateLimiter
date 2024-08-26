# Technical Design Document: Rate Limiting Middleware for Express.js

## 1. Introduction

This document outlines the technical design for implementing a rate limiting middleware in an Express.js application using TypeScript. The middleware will enforce request limits based on IP address, authentication status, and specific endpoints, using Redis as an in-memory store for tracking request counts.

## 2. System Architecture

### 2.1 High-Level Components

1. RateLimiter Middleware
2. Redis Client Wrapper
3. Configuration Manager
4. Sliding Log Algorithm
5. Override Manager

### 2.2 Technology Stack

- Node.js
- Express.js
- TypeScript
- Redis
- Jest (for testing)

## 3. Detailed Component Design

### 3.1 RateLimiter Middleware

#### 3.1.1 Purpose
`RateLimiterMiddleware` class to intercept incoming requests, check against rate limits, and either allow the request or return a 429 error.

#### 3.1.2 Key Functions
- `middleware(req: Request, res: Response, next: NextFunction)` 
  - A middleware function to intercept incoming calls and return appropriate response
- `evaluateRateLimit(req: CustomRequest): Promise<EvaluateRateLimitResult>` 
  - Method to encapsulate the rate limiting logic by using Redis

### 3.2 Redis Client Wrapper

#### 3.2.1 Purpose
`RedisRateLimitService` class to provide a simplified interface for interacting with Redis, specifically for rate limiting operations.

#### 3.2.2 Key Functions
- `incrAndExpire(key: string, windowMs: number): Promise<[number, number]>` 
  - Function to add a key, increment it, and add expiry to it
- `removeKey(key: string): Promise<void>`
  - Removing key from Redis
- `incrExpireCalcSlidingLog(key: string, configTtl: number, ratelimit: RateLimit): Promise<RateLimitResult>`
  - Encapsulating both `incrAndExpire` and `isSlidingWindowLimitExceeded`

### 3.3 Configuration Manager

#### 3.3.1 Purpose
`ConfigManager` class to manage and provide access to rate limiting configuration options.

#### 3.3.2 Key Functions
- `getRateLimit(endpoint: string, isAuthenticated: boolean): GetRateLimitReturnType`
  - Method to calculate the rate limit

### 3.4 Sliding Log Algorithm (Bonus)

#### 3.4.1 Purpose
`RedisRateLimitService` class to provide more granular control over request limits by tracking the exact timestamp of each request.

#### 3.4.2 Key Functions
- `isSlidingWindowLimitExceeded(key: string, windowSizeMs: number, maxRequests: number): Promise<boolean>`
  - Function to calculate sliding window and determine if the requests have exceeded the specified window

### 3.5 Override Manager (Bonus)

#### 3.5.1 Purpose
`ConfigManager` class to manage temporary rate limit overrides based on specific criteria.

#### 3.5.2 Key Functions
- `private getOverrideEvent(url: string): RateLimit | null`
  - Private method to get override events

## 4. Data Flow

1. Request comes into Express.js application
2. RateLimiter middleware intercepts the request
3. Middleware checks authentication status
4. Middleware gets the appropriate rate limit from `ConfigManager`
5. Middleware checks for any applicable overrides (Bonus) from `ConfigManager`
6. Middleware uses `RedisRateLimitService` to check and update request count
7. The Sliding Log Algorithm is easily configurable and integrated for every endpoint
8. If limit exceeded, return 429 error; otherwise, call next()

## 5. Error Handling

- Configuration errors: Throw error during initialization
- Override errors: Log and use default limits

## 6. Testing Strategy

### 6.1 Unit Tests
- `RateLimiterMiddleware` class methods
- `RedisRateLimitService` methods
- `ConfigManager` methods

### 6.2 Integration Tests
- Middleware function with mock Redis client
- Different rate limits for authenticated vs unauthenticated users
- Endpoint-specific rate limits
- Sliding log algorithm functionality (Bonus)
- Override functionality (Bonus)

## 7. Deployment Considerations

- Redis connection string should be configurable via environment variables
- Consider using Redis cluster for high-availability setups
- Implement proper logging for monitoring and debugging
- Use TypeScript compilation as part of the build process

## 8. Future Enhancements

- Redis connection errors: Fail open (allow requests) and log errors
- Persist rate limit in database
- Dynamic rate limit adjustments based on server load
- User-specific rate limits
- Adding more validation to config manager
- Improving test run time

## 9. Conclusion

This technical design provides a robust framework for implementing rate limiting in an Express.js application. It offers flexibility through configuration options, efficiency through Redis usage, and extensibility through the bonus features of sliding log algorithm and temporary overrides.