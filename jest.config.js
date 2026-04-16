module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { experimentalDecorators: true }],
  },
  moduleNameMapper: {
    '^agora-edu-core$': '<rootDir>/../../agora-edu-core/src/index.ts',
    '^agora-rte-sdk$': '<rootDir>/../../agora-rte-sdk/src/index.ts',
    '^agora-common-libs$': '<rootDir>/../../agora-common-libs/src/index.ts',
    '^@ui-scene/(.*)$': '<rootDir>/src/$1',
  },
};
