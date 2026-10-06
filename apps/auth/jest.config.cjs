module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json"
      }
    ]
  },
  moduleNameMapper: {
    "^@shared-cognito/(.*)$": "<rootDir>/src/shared/cognito/$1",
    "^@shared-dynamodb/(.*)$": "<rootDir>/src/shared/dynamodb/$1",
    "^@shared-swagger/(.*)$": "<rootDir>/src/shared/swagger/$1",
    "^@shared-utils/(.*)$": "<rootDir>/src/shared/utils/$1"
  }
};
