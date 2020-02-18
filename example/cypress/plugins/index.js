const { install, ensureBrowserFlags } = require('../../../dist');

module.exports = (on) => {
  install(on);

  on('before:browser:launch', (browser = {}, launchOptions) => {
    ensureBrowserFlags(browser, launchOptions);
    return launchOptions;
  });
};
