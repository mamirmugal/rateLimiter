# API Rate Limiter

## Objective
Expressjs poject written in Typescipt, which adds rate limiter to an api (middleware), while using using Redis to keep track of api counts.

## Run the code
```sh
npm start
```

### Curl command to call the api and a unauthenticated user
```sh
curl --location 'localhost:3002'
```

### Curl command to call the api and a authenticated user
```sh
curl --location 'localhost:3002' \
--header 'Authorization: Bearer customToken'
```

### Curl command to call the api for special event
```sh
curl --location 'localhost:3002/sale'
```

### Customise rate limiter
- to customise rate limiter please navigate to `/src/config/rateLimiterConfig.ts` file

```typescript
export const defaultConfig: RateLimitConfigInterface = {
  ttl: convertToMs(1, 'hour'), // time to live for the request this is set to 1 hour
  unauthLimit: {
    limit: 100, // request allow with respect to ttl, here is 100 request in an hour
    slidingLog: { // Sliding window 10 request in 1 minute
      windowSize: convertToMs(1, 'min'),
      maxRequests: 10,
    },
  },
  authLimit: {
    limit: 200,
    slidingLog: {
      windowSize: convertToMs(1, 'min'),
      maxRequests: 5,
    },
  },
  override: [
    {
      url: '/sale', // special event path
      startTime: new Date('2024-08-23T05:38:44.981Z'), // when the event starts
      endTime: new Date('2024-08-23T05:40:44.981Z'), // when the event ends
      rateLimit: { // rate limit for the sale event
        limit: 400, // Increased limit during the sale
        slidingLog: {
          windowSize: convertToMs(1, 'min'),
          maxRequests: 20,
        },
      },
    },
  ],
};
```

## Run test
```sh
npm test
```