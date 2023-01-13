import { install } from './src';
import { defineConfig } from 'cypress';

export default defineConfig({
  video: false,
  fixturesFolder: false,
  screenshotOnRunFailure: false,
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    setupNodeEvents(
      on: Cypress.PluginEvents,
      _: Cypress.PluginConfigOptions
    ): void {
      install(on);
    }
  }
});
