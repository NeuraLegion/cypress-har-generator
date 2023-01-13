import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      { tsconfig: './tsconfig.json', isolatedModules: true }
    ]
  },
  maxWorkers: '25%',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  collectCoverageFrom: ['src/**/*.ts', '!**/index.ts']
};

export default config;
