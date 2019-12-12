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

After then, you should register tasks that perform the manipulation with the HAR file. 
For that add this module to your support file `cypress/support/index.js`:

```js
require('@neuralegion/cypress-har-generator/support');
```

Once the configuration is completed, start the tests with:

```bash
cypress run --browser chrome
```

> ✴  Now only Chrome family browsers are supported.

When the cypress finished executing tests, the plugin will save a new archive `archive.har`:

> ✴  If you want to change a path to a file, you can specify it by setting the `CYPRESS_HAR_FILE` environment variable.

## License

Copyright © 2019 [NeuraLegion](https://github.com/NeuraLegion).

This project is licensed under the MIT License - see the [LICENSE file](LICENSE) for details.

