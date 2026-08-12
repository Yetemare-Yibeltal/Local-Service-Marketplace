// ============================================================
// JEST CONFIGURATION
// Testing framework configuration with TypeScript support
// ============================================================

module.exports = {
  // Use ts-jest preset for TypeScript
  preset: 'ts-jest',
  
  // Node.js test environment
  testEnvironment: 'node',
  
  // Root directories for tests
  roots: ['<rootDir>/tests'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Collect coverage from source files
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/index.ts',
    '!src/**/*.types.ts',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Global environment variables
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: {
        ignoreCodes: ['TS151801'],
      },
    },
  },
};