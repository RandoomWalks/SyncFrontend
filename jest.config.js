module.exports = {
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
    transform: {
        '^.+\\.jsx?$': 'babel-jest'
    }
};
