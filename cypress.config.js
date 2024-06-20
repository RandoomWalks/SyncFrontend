const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Implement node event listeners here
      // For example, you can set up a plugin to process code coverage
      on('task', {
        // Define any custom tasks here if needed
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
    baseUrl: 'http://localhost:8000', // Change this to the URL where your app is running
    specPattern: 'cypress/integration/**/*.js',
    supportFile: 'cypress/support/e2e.js',
  },
});
