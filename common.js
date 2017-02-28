'use strict';

var webExtension = require('sdk/webextension');
var timers = require('sdk/timers');
var passwords = require('sdk/passwords');
// to check whether master passwrod is entered or not
var {Cc, Ci} = require('chrome');
var nsILoginManager = Cc['@mozilla.org/login-manager;1'].getService(Ci.nsILoginManager);
// to open password manager
var {openDialog} = require('sdk/window/utils');

// make sure master password is called once after startup
timers.setTimeout(() => passwords.search({
  url: 'http://www.example.com',
  onComplete: function () {}
}), 10000);

webExtension.startup().then(api => {
  let browser = api.browser;

  browser.runtime.onMessage.addListener((request, sender, response) => {
    if (request.cmd === 'password-search') {
      if (nsILoginManager.isLoggedIn) {
        passwords.search({
          url: request.url,
          onComplete: credentials => response(credentials)
        });
      }
      else {
        response(null);
      }
      return true;
    }
    else if (request.cmd === 'open-password-manager') {
      openDialog({
        url: 'chrome://passwordmgr/content/passwordManager.xul',
        features: 'chrome=yes,resizable=yes,toolbar=yes,centerscreen=yes,modal=no,dependent=no,dialog=no',
        args: {filterString: request.hostname}
      });
    }
  });
}).catch(e => console.error(e));
