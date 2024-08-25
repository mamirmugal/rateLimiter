/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  roots: ['<rootDir>/src'], // Specify the src folder as the root for tests
  testMatch: [
    '**/?(*.)+(spec|test).[jt]s?(x)', // Match files with .test.js, .spec.js, .test.ts, .spec.ts
  ],
};
