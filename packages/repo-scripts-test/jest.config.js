/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/lib/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '\\.node\\.test\\.js$'],
  moduleFileExtensions: ['js', 'json', 'node'],
  verbose: true,
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/**/*.test.js',
    '!lib/**/*.d.ts',
    '!lib/**/*.map'
  ],
};