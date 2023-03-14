import { install } from './src';
import { defineConfig } from 'cypress';
import { promisify } from 'util';
import { access, constants, unlink, readFile } from 'fs';
import { tmpdir } from 'os';

export default defineConfig({
  projectId: 'ir8zwo',
  video: false,
  fixturesFolder: false,
  screenshotOnRunFailure: false,
  trashAssetsBeforeRuns: true,
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    setupNodeEvents(
      on: Cypress.PluginEvents,
      _: Cypress.PluginConfigOptions
    ): void {
      install(on);

      on('task', {
        /* eslint-disable @typescript-eslint/naming-convention */
        async 'fs:match'({
          path,
          regexp
        }: {
          path: string;
          regexp: RegExp;
        }): Promise<boolean> {
          try {
            const result = await promisify(readFile)(path, 'utf-8');

            return new RegExp(regexp).test(result);
          } catch {
            return false;
          }
        },
        async 'fs:exists'(path: string): Promise<boolean> {
          try {
            await promisify(access)(path, constants.F_OK);

            return true;
          } catch {
            return false;
          }
        },
        async 'fs:remove'(path: string): Promise<null> {
          try {
            await promisify(unlink)(path);
          } catch {
            // noop
          }

          return null;
        },
        'fs:tmpdir'(): string {
          return tmpdir();
        }
        /* eslint-enable @typescript-eslint/naming-convention */
      });
    }
  }
});
