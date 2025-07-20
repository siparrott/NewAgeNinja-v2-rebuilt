module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-node/cjs'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000,
  collectCoverageFrom: [
    'agent/**/*.ts',
    'server/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ]
};