# cypress-har-generator

[![Maintainability](https://api.codeclimate.com/v1/badges/231b9635d2cc00131b69/maintainability)](https://codeclimate.com/github/NeuraLegion/cypress-har-generator/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/231b9635d2cc00131b69/test_coverage)](https://codeclimate.com/github/NeuraLegion/cypress-har-generator/test_coverage)
[![Build Status](https://github.com/NeuraLegion/cypress-har-generator/actions/workflows/coverage.yml/badge.svg?branch=master&event=push)](https://github.com/NeuraLegion/cypress-har-generator/actions/workflows/coverage.yml?query=branch%3Amaster+event%3Apush)
[![NPM Downloads](https://img.shields.io/npm/dw/@neuralegion/cypress-har-generator?label=NPM%20Downloads)](https://www.npmjs.com/package/@neuralegion/cypress-har-generator)

The Cypress plugin for generating [HTTP Archive (HAR)](http://www.softwareishard.com/blog/har-12-spec/) files is a tool that allows developers and QA engineers to capture detailed information about network requests made during the execution of Cypress tests.

**Advantages**:

- Detailed visibility into network requests including **WebSocket** frames, **Server-Sent Events (SSE)**, and more.
- Ability to replay network requests in a web development tool.
- Easy integration with [**Cypress**](https://www.cypress.io/)

**Why it is important**

- Improves the performance and stability of your application
- Quickly troubleshoot issues with network requests
- Saves a significant amount of time and effort in debugging and troubleshooting network issues.

The plugin allows you to record network requests from multiple targets such as pages, workers, and pop-ups, which allows you to get a more comprehensive view of your application's network activity. This is especially useful for debugging and troubleshooting issues that may be related to multiple sources.

## Table of contents

- [Install](#install)
- [Setting Up the Plugin](#setting-up-the-plugin)
- [Generating a HAR File](#generating-a-har-file)
- [Commands](#commands)
  - [recordHar](#recordhar)
  - [saveHar](#savehar)
  - [disposeOfHar](#disposeofhar)
- [Example Usage](#example-usage)
- [License](#license)

## Install

To install the plugin as development dependency, run the following command:

```bash
$ npm i --save-dev @neuralegion/cypress-har-generator
```

> ✴ For details about changes between versions, and information about updates on previous releases, see the Releases tab on GitHub: https://github.com/NeuraLegion/cypress-har-generator/releases

## Setting Up the Plugin

To use the plugin, you'll need to update the `cypress/plugins/index.js` file as follows:

```js
const { install } = require('@neuralegion/cypress-har-generator');

module.exports = on => {
  install(on);
};
```

If you're using Cypress version 10.0.0 or higher, you'll need to update your `cypress.config.js` file as follows (for details see [the migration guide](https://docs.cypress.io/guides/references/migration-guide#Plugins-File-Removed)):

```js
const { defineConfig } = require('cypress');
const { install } = require('@neuralegion/cypress-har-generator');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on) {
      install(on);
    }
  }
});
```

> ✴ `setupNodeEvents` can be defined in either the e2e or component configuration

> ⚠ Please note that the `setupNodeEvents` does not support multiple `on` event listeners without overwriting previously defined listeners. To work around this issue, you can either call the `install` function at the end of the `setupNodeEvents` function, or use the deprecated `ensureBrowserFlags` as follows:
>
> ```js
> const { defineConfig } = require('cypress');
> const {
>   install,
>   ensureBrowserFlags
> } = require('@neuralegion/cypress-har-generator');
>
> module.exports = defineConfig({
>   e2e: {
>     setupNodeEvents(on) {
>       install(on);
>       on('before:browser:launch', (browser = {}, launchOptions) => {
>         ensureBrowserFlags(browser, launchOptions);
>         return launchOptions;
>       });
>     }
>   }
> });
> ```
>
> For more information, see [this GitHub issue](https://github.com/cypress-io/cypress/issues/5240).

Next, add the following line to your `cypress/support/index.js` file to register commands that perform the manipulation with a HAR file:

```js
require('@neuralegion/cypress-har-generator/commands');
```

> ✴ Starting from Cypress version 10.0.0, `supportFile` is set to look for the following file: `cypress/support/e2e.js` by default.

## Generating a HAR File

To generate a HAR file, you'll need to include the following code in your test file(s):

```js
describe('my tests', () => {
  before(() => {
    // start recording
    cy.recordHar();
  });

  after(() => {
    // save the HAR file
    cy.saveHar();
  });
});
```

By default, the plugin will save the generated HAR file to the root of your project with a file name that includes the current spec's name (e.g. `{specName}.har`).

You can also specify a different destination folder for the generated HAR file by setting the `CYPRESS_HARS_FOLDERS` environment variable or the `hars_folders` field in the `env` object in your Cypress config file:

```json
{
  "env": {
    "hars_folders": "cypress/hars"
  }
}
```

Alternatively, you can pass the `hars_folders` variable in the CLI using the `--env` option:

```bash
$ cypress run --browser chrome --env hars_folders=cypress/hars
```

Finally, to start running your tests, use the following command:

```bash
$ cypress run --browser chrome
```

> 🚧 Currently, only Chrome family browsers are supported. But this plugin also works with Electron, you just need to set the remote-debugging-port option when you launch Cypress as follows:
>
> ```bash
> $ ELECTRON_EXTRA_LAUNCH_ARGS=--remote-debugging-port=9222 cypress run --browser electron
> ```
>
> Please refer to the [Electron documentation](https://www.electronjs.org/docs/latest/api/command-line-switches#--remote-debugging-portport) and the [Cypress documentation](https://docs.cypress.io/api/plugins/browser-launch-api#Modify-Electron-app-switches) for more information on how to properly configure this switch.

## Commands

The plugin provides two main commands for work with HTTP Archive (HAR) files in your Cypress tests: `recordHar` and `saveHar`.

### recordHar

Starts recording network logs. All network requests made during the browser session will be recorded.

Here's an example of how to use the `recordHar` command:

```js
cy.recordHar();
```

You can set the `content` boolean flag to `false` to skip loading `content` field in the HAR.

```js
cy.recordHar({ content: false });
```

To include only requests on specific hosts, you can pass an array of patterns specifying a list of hosts using the `includeHosts` for which to record requests:

```js
cy.recordHar({ includeHosts: ['.*.execute-api.eu-west-1.amazonaws.com'] });
```

To exclude some requests, you can pass an array of patterns specifying a list of paths using the `excludePaths` to be excluded from the logs:

```js
cy.recordHar({ excludePaths: ['^/login', 'logout$'] });
```

You can also pass an array of MIME types for which to record requests:

```js
cy.recordHar({ includeMimes: ['application/json'] });
```

This will record only requests with a MIME type of `application/json`.

To exclude requests based on their status code, you can use the `minStatusCodeToInclude` field.

For example, to only include requests that have a status code of 400 or greater, you can pass the `minStatusCodeToInclude` option as follows:

```js
cy.recordHar({ minStatusCodeToInclude: 400 });
```

> ✴ As of version 6, this option will be removed. Use `excludeStatusCodes` instead.

Alternatively, you can have more granular control over the requests to exclude by passing an array of status codes you want to exclude from the recorded HAR file.

```js
cy.recordHar({ excludeStatusCodes: [200, 201, 204] });
```

> ⚠ Please note that both options `minStatusCodeToInclude` and `excludeStatusCodes` are mutually exclusive.

By default, when you use `recordHar` command, it will include the blob requests in the recorded HAR file. However, those requests only make sense when they are used on the same page they were created. To exclude the blob requests from the recorded HAR file, set the `includeBlobs` to false as follows:

```js
cy.recordHar({ includeBlobs: false });
```

> ✴ As of version 6, this flag will be disabled by default.

### saveHar

Stops recording and saves all requests that have occurred since `recordHar` was run to a HAR file. By default, the file is saved to the root of the project with a file name that includes the current spec's name (e.g. `{specName}.har`).

```js
cy.saveHar();
```

You can pass a file name to change the default naming behavior.

```js
cy.saveHar({ fileName: 'example.com.har' });
```

You can customize a destination folder overriding any previous settings:

```js
cy.saveHar({ outDir: './hars' });
```

You can also pass the `waitForIdle` option to wait for all pending requests to complete before saving the HAR file:

```js
cy.saveHar({ waitForIdle: true });
```

This option is false by default. When set to true, the plugin will monitor the count of pending requests and wait for it to reach zero before proceeding with saving the HAR file. This ensures that all responses have been received and the data in the file is complete and accurate.

### disposeOfHar

Stops the ongoing recording of network requests and disposes of the recorded logs, which will be not saved to a HAR file.

You may use this command if you have started recording network logs with `recordHar` command, but you decide to refuse to save the recorded logs to a HAR file.
Here's an example of how you might use this command to dispose of the HAR:

```js
describe('my tests', () => {
  before(() => {
    // start recording
    cy.recordHar();
  });

  after(() => {
    // decide not to save the recorded logs
    cy.disposeOfHar();
  });
});
```

## Example Usage

To generate a HAR file during your tests, you'll need to include the `recordHar` and `saveHar` commands in your test file(s). Here's an example of how you might use these commands in a test:

```js
describe('my tests', () => {
  before(() => {
    // start recording
    cy.recordHar();
  });

  after(() => {
    // save the HAR file
    cy.saveHar();
  });
});
```

You can also generate a HAR file only for Chrome browser sessions, if it is not interactive run, and only if the test has failed:

```js
describe('my tests', () => {
  beforeEach(() => {
    const isInteractive = Cypress.config('isInteractive');
    const isChrome = Cypress.browser.name === 'chrome';
    if (!isInteractive && isChrome) {
      cy.recordHar();
    }
  });

  afterEach(function () {
    const { state } = this.currentTest;
    const isInteractive = Cypress.config('isInteractive');
    const isChrome = Cypress.browser.name === 'chrome';
    if (!isInteractive && isChrome && state !== 'passed') {
      cy.saveHar();
    }
  });
});
```

If you're using Cypress version 6.2.0 or higher, you can set up hooks in a single step, eliminating the need to define them in each spec file. To do this, you need to call `enableExperimentalLifecycle` in addition to `install` as shown below:

```js
const { defineConfig } = require('cypress');
const {
  install,
  enableExperimentalLifecycle
} = require('@neuralegion/cypress-har-generator');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      install(on);
      enableExperimentalLifecycle(on, config);
    }
  }
});
```

> ⚠ Please note, to utilize this experimental mechanism for setting up lifecycle, you must either disable the interactive mode or enable the "experimentalInteractiveRunEvents" feature. For more details, see the documentation: https://docs.cypress.io/guides/references/experiments#Configuration

## License

Copyright © 2022 [Bright Security](https://brightsec.com/).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.
