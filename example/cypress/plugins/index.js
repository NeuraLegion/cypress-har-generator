const { install, ensureRequiredBrowserFlags } = require('../../../dist');

module.exports = (on) => {
  install(on);

  on('before:browser:launch', (browser = {}, args) => {
    args = ensureRequiredBrowserFlags(browser, args);
    args.push('--headless');
    return args;
  });
};
