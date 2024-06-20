module.exports = {
    projects: [
        {
            displayName: 'unit',
            testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
            setupFilesAfterEnv: ['<rootDir>/tests/unit/setupTests.js'],
            transform: {
                '^.+\\.jsx?$': 'babel-jest'
            }
        },
        {
            displayName: 'integration',
            testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
            setupFilesAfterEnv: ['<rootDir>/tests/integration/setupTests.js','jest-fetch-mock'],
            transform: {
                '^.+\\.jsx?$': 'babel-jest'
            },
        }
    ]
};