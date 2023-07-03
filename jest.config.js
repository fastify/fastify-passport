module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/build/", "/node_modules/"],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }]
  },
  moduleNameMapper: {
    'tiny-lru': require.resolve('tiny-lru')
  }
};
