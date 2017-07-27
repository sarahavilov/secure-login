'use strict';

var _ = chrome.i18n.getMessage;
var prefs = {
  charset: 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890',
  length: 12,
  delay: 2,
  submit: true,
  notify: true,
  badge: true,
  color: '#6e6e6e',
  faqs: false,
  version: null,
  masterpassword: true
};
var storage = {};

function color() {
  chrome.browserAction.setBadgeBackgroundColor({
    color: prefs.color
  });
}

chrome.contextMenus.create({
  id: 'open-password-manager',
  title: _('contextPassMG'),
  contexts: ['browser_action']
});
chrome.contextMenus.create({
  id: 'generate-random-password',
  title: _('contextRandom'),
  contexts: ['browser_action']
});
chrome.contextMenus.create({
  id: 'fill-only',
  title: _('contextNoSubmit'),
  contexts: ['browser_action']
});
chrome.contextMenus.create({
  id: 'help',
  title: _('contextHelp'),
  contexts: ['browser_action']
});

function notify(message) {
  if (prefs.notify) {
    chrome.notifications.create({
      title: _('appTitle'),
      type: 'basic',
      iconUrl: 'data/icons/128.png',
      message
    });
  }
}

function generate(tabId) {
  const password = Array.apply(null, new Array(prefs.length))
    .map(() => prefs.charset.charAt(Math.floor(Math.random() * prefs.charset.length)))
    .join('');
  // copy to clipboard
  const id = Math.random();
  storage[id] = password;
  chrome.tabs.executeScript(tabId, {
    runAt: 'document_start',
    allFrames: false,
    code: `
      chrome.runtime.sendMessage({
        cmd: 'send-vars',
        id: ${id}
      }, password => {
        document.oncopy = (e) => {
          e.clipboardData.setData('text/plain', password);
          e.preventDefault();
        };
        window.focus();
        document.execCommand('Copy', false, null);
      });
    `
  }, () => notify(_(chrome.runtime.lastError ? 'msgNoCopy' : 'msgCopied')));
  notify();
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const cmd = info.menuItemId;
  if (cmd === 'open-password-manager') {
    chrome.runtime.sendMessage({
      cmd: 'open-password-manager',
      hostname: (new URL(tab.url)).hostname
    });
  }
  else if (cmd === 'generate-random-password') {
    generate(tab.id);
  }
  else if (cmd === 'help') {
    chrome.tabs.create({
      url: 'http://firefox.add0n.com/secure-login.html?from=context'
    });
  }
  else if (cmd === 'fill-only') {
    chrome.tabs.executeScript(tab.id, {
      runAt: 'document_start',
      allFrames: true,
      code: 'window.signore = true;'
    }, () => onCommand(tab));
  }
});

var cache = {};

function update(tabId, url, callback = function () {}) {
  if (url.startsWith('about:accounts')) {
    url = 'https://accounts.firefox.com';
  }

  const hostname = (new URL(url)).hostname;
  if (!url || !url.startsWith('http')) {
    return;
  }
  if (!cache[tabId] || (
    cache[tabId] && (cache[tabId].hostname !== hostname || (
      !cache[tabId].credentials && !cache[tabId].inprogress
    ))
  )) {
    cache[tabId] = {
      hostname,
      inprogress: true
    };
    chrome.runtime.sendMessage({
      cmd: 'password-search',
      url
    }, response => {
      if (cache[tabId]) { // if tab is closed before response is ready
        delete cache[tabId].inprogress;
        cache[tabId].credentials = response;
        chrome.browserAction.setBadgeText({
          tabId,
          text: response && response.length && prefs.badge ? String(response.length) : ''
        });
        if (response) { // prevent loops
          callback();
        }
      }
    });
  }
  // only update badge on refresh
  else if (cache[tabId]) {
    const response = cache[tabId].credentials;
    chrome.browserAction.setBadgeText({
      tabId,
      text: response && response.length && prefs.badge ? String(response.length) : ''
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = tab.url;
  if (changeInfo.url || changeInfo.favIconUrl) {
    update(tabId, url);
  }
});
chrome.tabs.onRemoved.addListener(tabId => delete cache[tabId]);

chrome.alarms.onAlarm.addListener(() => {
  chrome.tabs.query({
    url: '*://*/*'
  }, tabs => {
    // only update a few first tabs to prevent freezing
    tabs.slice(0, 10).forEach(tab => update(tab.id, tab.url));
  });
});

function login(tabId, credential) {
  const id = Math.random();
  storage[id] = {
    username: credential.username,
    password: credential.password,
  };
  chrome.tabs.executeScript(tabId, {
    runAt: 'document_start',
    allFrames: true,
    code: `
      chrome.runtime.sendMessage({
        cmd: 'send-vars',
        id: ${id}
      }, ({username, password, submit}) => {
        console.log(username, password, submit);
        [...document.querySelectorAll('input[type=password]')]
        .map(p => p.form)
        .filter(f => f)
        .filter(f => f.name && f.name.indexOf('reg') !== -1 ? false : true)
        .filter((f, i, l) => l.indexOf(f) === i)
        .forEach(f => {
          console.log(f);
          // insert username and password
          [...f.querySelectorAll('input:not([type=password])')]
            .filter(i => (i.type === 'text' || i.type === 'email'))
            .forEach(input => {
              input.value = username;
              input.dispatchEvent(new Event('change', {bubbles: true}));
              input.dispatchEvent(new Event('input', {bubbles: true}));
            });
          [...f.querySelectorAll('input[type=password]')]
            .forEach(input => {
              input.value = password;
              input.dispatchEvent(new Event('change', {bubbles: true}));
              input.dispatchEvent(new Event('input', {bubbles: true}));
            });
          // submit
          if (window.signore === true) {
            delete window.signore;
            return;
          }
          if (${prefs.submit}) {
            const button = f.querySelector('input[type=submit]') || f.querySelector('[type=submit]') ||
              f.querySelector('button') || f.querySelector('input[type=button');
            if (button) {
              button.click();
            }
            else {
              const onsubmit = f.getAttribute('onsubmit');
              if (onsubmit && onsubmit.indexOf('return false') === -1) {
                f.onsubmit();
              }
              else {
                f.submit();
              }
            }
          }
        });
      });
    `
  }, () => {
    if (chrome.runtime.lastError) {
      notify(chrome.runtime.lastError.message);
    }
  });
}

function select(tabId) {
  chrome.tabs.executeScript(tabId, {
    runAt: 'document_start',
    allFrames: false,
    file: 'data/select/inject.js'
  });
}

function onCommand(tab) {
  const tabId = tab.id;

  if (cache[tabId] && cache[tabId].credentials && cache[tabId].credentials.length) {
    const credentials = cache[tabId].credentials;
    if (credentials.length === 1) {
      login(tabId, credentials[0]);
    }
    else {
      select(tabId, credentials);
    }
  }
  else if (cache[tabId] && cache[tabId].credentials) {
    notify('No matched credential is detected for this domain');
  }
  else {
    update(tab.id, tab.url, () => onCommand(tab));
  }
}

chrome.browserAction.onClicked.addListener(onCommand);

chrome.runtime.onMessage.addListener((request, sender, response) => {
  const tabId = sender.tab.id;

  if (request.cmd === 'login-with') {
    const credential = cache[tabId].credentials[request.id];
    login(tabId, credential);
  }
  else if (request.cmd === 'get-usernames') {
    response(cache[tabId].credentials.map(o => o.username));
  }
  else if (request.cmd === 'send-vars') {
    console.log(storage[request.id]);
    response(storage[request.id]);
    delete storage[request.id];
  }

  if (request.cmd === 'close-me' || request.cmd === 'login-with') {
    chrome.tabs.executeScript(tabId, {
      runAt: 'document_start',
      allFrames: false,
      code: `
        if (iframe) {
          iframe.parentNode.removeChild(iframe);
          iframe = null;
        }
      `
    });
  }
});

chrome.commands.onCommand.addListener(command => {
  if (command === 'activate') {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      tabs.forEach(onCommand);
    });
  }
});

// FAQs & Feedback
function faqs() {
  const version = chrome.runtime.getManifest().version;
  if (prefs.version !== version && (prefs.version ? prefs.faqs : true)) {
    console.log(version, prefs.version);
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://firefox.add0n.com/secure-login.html?version=' + version +
          '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
      });
    });
  }
}
(function() {
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
})();

// init
chrome.storage.local.get(prefs, ps => {
  prefs = ps;
  // color
  color();
  // get logins
  chrome.alarms.create({
    when: Date.now() + prefs.delay * 1000
  });
  // faqs
  faqs();
  // master password
  if (prefs.masterpassword) {
    chrome.runtime.sendMessage({
      cmd: 'activate-password-manager'
    });
  }
});
chrome.storage.onChanged.addListener(ps => {
  Object.keys(ps).forEach(pref => {
    prefs[pref] = ps[pref].newValue;
    if (pref === 'color') {
      color();
    }
  });
});
