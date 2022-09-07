# cypress-har-generator

Generate [HTTP Archive (HAR)](http://www.softwareishard.com/blog/har-12-spec/) while running tests

## Install

Run `npm i --save-dev @neuralegion/cypress-har-generator` to install the plugin.

> ✴ For details about changes between versions, and information about updates on previous releases, see the Releases tab on GitHub: https://github.com/NeuraLegion/cypress-har-generator/releases

## Quick Start

First, install `cypress-har-generator` as development dependency:

```bash
npm i --save-dev @neuralegion/cypress-har-generator
```

Next, go to the cypress's directory and put this code is in your `cypress/plugins/index.js` file:

```js
const {
  install,
  ensureBrowserFlags
} = require('@neuralegion/cypress-har-generator');

module.exports = (on, config) => {
  install(on, config);

  on('before:browser:launch', (browser = {}, launchOptions) => {
    ensureBrowserFlags(browser, launchOptions);
    return launchOptions;
  });
};
```

> The plugins file is no longer supported as of Cypress version 10.0.0. Instead, you have to update your `cypress.config.js` as follows (for details see [the migration guide](https://docs.cypress.io/guides/references/migration-guide#Plugins-File-Removed)):
>
> ```js
> const { defineConfig } = require('cypress');
> const {
>   install,
>   ensureBrowserFlags
> } = require('@neuralegion/cypress-har-generator');
>
> module.exports = defineConfig({
>   // setupNodeEvents can be defined in either
>   // the e2e or component configuration
>   e2e: {
>     setupNodeEvents(on, config) {
>       install(on, config);
>
>       on('before:browser:launch', (browser = {}, launchOptions) => {
>         ensureBrowserFlags(browser, launchOptions);
>
>         return launchOptions;
>       });
>     }
>   }
> });
> ```

After then, you should register commands that perform the manipulation with the HAR file.
For that add this module to your support file `cypress/support/index.js`:

```js
require('@neuralegion/cypress-har-generator/commands');
```

> Starting from Cypress 10 version 10.0.0, `supportFile` is set to look for the following file: `cypress/support/e2e.js` by default.

Once the configuration is completed, add the following code into each test:

```js
// cypress/integration/users.spec.js

describe('my tests', () => {
  before(() => {
    // start recording
    cy.recordHar();
  });

  after(() => {
    // HAR will be saved as users.spec.har
    // at the root of the project
    cy.saveHar();
  });
});
```

After then, you can start the tests with:

```bash
cypress run --browser chrome
```

> ✴ Now only Chrome family browsers are supported.

When the cypress finished executing tests, the plugin will save a new archive at the root of the project.

You can override the destination folder by setting `CYPRESS_HARS_FOLDERS` environment variable or in `env` object in Cypress config file like this:

```json
{
  "env": {
    "hars_folders": "cypress/hars"
  }
}
```

You can also pass it in the CLI using the `--env` option to set the `hars_folder` environment variable:

```bash
cypress run --browser chrome --env hars_folders=cypress/hars
```

By default, a HAR is saved to a file with a name including the current spec’s name: `{specName}.har`

## Commands

### recordHar

Starts recording network logs. The plugin records all network requests so long as the browser session is open.

```js
cy.recordHar();
```

You can set `content` flag to `false` to skip loading `content` fields in the HAR.

```js
cy.recordHar({ content: false });
```

To include only requests on specific hosts, you can specify a list of hosts using `includeHosts`.

```js
cy.recordHar({ includeHosts: ['.*.execute-api.eu-west-1.amazonaws.com'] });
```

To exclude some requests, you can specify a list of paths to be excluded using `excludePaths`.

```js
cy.recordHar({ excludePaths: ['^/login', 'logout$'] });
```

### saveHar

Stops recording and save all requests that have occurred since you run recording to the HAR file.

```js
cy.saveHar();
```

Pass a filename to change the default naming behavior.

```js
cy.saveHar({ fileName: 'example.com.har' });
```

Pass an output directory to change the destination folder overriding any previous settings:

```js
cy.saveHar({ outDir: './hars' });
```

Generate HAR file only for chrome, if it is not interactive run, and if test failed.

```js
beforeEach(() => {
  const isInteractive = Cypress.config('isInteractive');
  const isChrome = Cypress.browser.name === 'chrome';
  if (!isInteractive && isChrome) {
    cy.recordHar();
  }
});

afterEach(() => {
  const { state } = this.currentTest;
  const isInteractive = Cypress.config('isInteractive');
  const isChrome = Cypress.browser.name === 'chrome';
  if (!isInteractive && isChrome && state !== 'passed') {
    cy.saveHar();
  }
});
```

## License

Copyright © 2022 [Bright Security](https://brightsec.com/).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
