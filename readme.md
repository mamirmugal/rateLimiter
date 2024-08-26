# API Rate Limiter

## Objective
Express.js project written in TypeScript, which adds a rate limiter to an API (middleware), using Redis to keep track of API request counts.

**Note**
- Redis should be installed and running on the system

## Installation and Running the Code
```sh
npm install && npm start
```

### Curl command to call the API as an unauthenticated user
```sh
curl --location 'http://localhost:3002'
```

### Curl command to call the API as an authenticated user
```sh
curl --location 'http://localhost:3002' \
--header 'Authorization: Bearer customToken'
```

### Customize Rate Limiter
To customize the rate limiter, navigate to `/src/config/rateLimiterConfig.ts` file:

```typescript
export const defaultConfig: RateLimitConfigInterface = {
  ttl: convertToMs(1, 'hour'), // Time to live for the request (set to 1 hour)
  unauthLimit: {
    limit: 100, // Requests allowed with respect to TTL (100 requests per hour)
    slidingLog: { // Sliding window: 10 requests in 1 minute
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
      url: '/sale', // Special event path
      startTime: moment('23/08/2024, 17:05', 'DD/MM/YYYY, HH:mm').toDate(), // Event start time
      endTime: moment('23/08/2024, 17:35', 'DD/MM/YYYY, HH:mm').toDate(), // Event end time
      rateLimit: { // Rate limit for the sale event
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

### Calling Special Event
Change the `startTime` and `endTime` in the config file `/src/config/rateLimiterConfig.ts`:

```typescript
{
  // ...
  override: [
    {
      url: '/sale', // Special event path
      startTime: moment('23/08/2024, 17:05', 'DD/MM/YYYY, HH:mm').toDate(), // Event start time
      endTime: moment('23/08/2024, 17:35', 'DD/MM/YYYY, HH:mm').toDate(), // Event end time
      // ...
    },
  // ...
}
```

Call the endpoint for the special event:
```sh
curl --location 'http://localhost:3002/sale'
```

### Adding Multiple Special Events
Add the following object to the `override` array in the config file `/src/config/rateLimiterConfig.ts`:

```typescript
{
  // ...
  override: [
    {
      // ...
    },
    {
      url: '/presale', // Special event path
      startTime: moment('25/08/2024, 17:05', 'DD/MM/YYYY, HH:mm').toDate(), // Event start time
      endTime: moment('25/08/2024, 17:35', 'DD/MM/YYYY, HH:mm').toDate(), // Event end time
      rateLimit: { // Rate limit for the presale event
        limit: 500, // Increased limit during the presale
        slidingLog: {
          windowSize: convertToMs(1, 'min'),
          maxRequests: 50, // Allowing 50 requests per minute
        },
      },
    },
  // ...
}
```

Call the endpoint for the new special event:
```sh
curl --location 'http://localhost:3002/presale'
```

## Running Tests
```sh
npm test
```

## Running in Production
```sh
npm run build-run
```
