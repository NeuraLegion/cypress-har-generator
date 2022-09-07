const { defineConfig } = require('cypress');
const { install, ensureBrowserFlags } = require('../dist');

module.exports = defineConfig({
  fixturesFolder: false,
  video: false,
  env: {
   // Set an output directory to change the destination folder
    hars_folders: 'cypress/hars'
  },
  // setupNodeEvents can be defined in either
  // the e2e or component configuration
  e2e: {
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/integration/**/*.cy.js',
    baseUrl: 'http://localhost:7079',
    setupNodeEvents(on, config) {
      install(on, config);
      // bind to the event we care about
      on('before:browser:launch', (browser = {}, launchOptions) => {
        ensureBrowserFlags(browser, launchOptions);
        return launchOptions;
      });
    }
  }
});
