# cypress-har-generator

Generate [HTTP Archive (HAR)](http://www.softwareishard.com/blog/har-12-spec/)  while running tests

## Install

Run `npm i --save-dev @neuralegion/cypress-har-generator` to install the plugin.

then open your `cypress/plugins/index.js` file and register it

```js
module.exports = (on, config) => {
  require('@neuralegion/cypress-har-generator').install(on, config);
};
```

## How to use it

