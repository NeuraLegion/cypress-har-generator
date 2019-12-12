const { install, ensureRequiredBrowserFlags } = require('../../../dist');

module.exports = (on, config) => {
  install(on, config);

  on('before:browser:launch', (browser = {}, args) =>
    ensureRequiredBrowserFlags(browser, args)
  );
};
