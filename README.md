# cypress-har-generator

Generate [HTTP Archive (HAR)](http://www.softwareishard.com/blog/har-12-spec/)  while running tests

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
const { install, ensureRequiredBrowserFlags } = require('@neuralegion/cypress-har-generator');

module.exports = (on, config) => {
  install(on, config);
  
  on('before:browser:launch', (browser = {}, args) =>
    ensureRequiredBrowserFlags(browser, args)
  );
};
```

After then, you should register commands that perform the manipulation with the HAR file. 
For that add this module to your support file `cypress/support/index.js`:

```js
require('@neuralegion/cypress-har-generator/commands');
```

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

> ✴  Now only Chrome family browsers are supported.

When the cypress finished executing tests, the plugin will save a new archive at the root of the project.
By default, a HAR is saved to a file with a name including the current spec’s name: `{specName}.har`

## Commands

### recordHar

Starts recording network logs. The plugin records all network requests so long as  browser session is open.
                              
```js
cy.recordHar();
```

### saveHar

Stops recording and save all requests that have occurred since you run recording to the HAR file.
                              
```js
cy.saveHar();
```

Pass a filename to change the default naming behavior. 

```js
cy.saveHar(fileName);
```

If you want to change the path to the files, you can specify it by setting the `hars_folder` environment variable.
 
```bash
cypress run --browser chrome --env hars_folders=cypress/hars
```

## License

Copyright © 2019 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.

