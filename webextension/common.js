'use strict';

var prefs = {
  charset: 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890',
  length: 12,
  delay: 2,
  submit: true,
  notify: true,
  badge: true,
  color: '#6e6e6e',
  faqs: false,
  version: null
};

function color () {
  chrome.browserAction.setBadgeBackgroundColor({
    color: prefs.color
  });
}

chrome.contextMenus.create({
  id: 'open-password-manager',
  title: 'Saved passwords...',
  contexts: ['browser_action']
});
chrome.contextMenus.create({
  id: 'generate-random-password',
  title: 'Generate a random password',
  contexts: ['browser_action']
});
chrome.contextMenus.create({
  id: 'help',
  title: 'Help...',
  contexts: ['browser_action']
});

function notify (message) {
  if (prefs.notify) {
    chrome.notifications.create({
      title: 'Secure Login',
      type: 'basic',
      iconUrl: 'data/icons/128.png',
      message
    });
  }
}

function protect(str) {
  return (str || '').replace(/\`/g, '');
}

function generate (tabId) {
  let password = Array.apply(null, new Array(prefs.length))
    .map(() => prefs.charset.charAt(Math.floor(Math.random() * prefs.charset.length)))
    .join('');
  // copy to clipboard
  chrome.tabs.executeScript(tabId, {
    runAt: 'document_start',
    allFrames: false,
    code: `
      document.oncopy = (e) => {
        e.clipboardData.setData('text/plain', String.raw\`${protect(password)} \`.slice(0, -1));
        e.preventDefault();
      };
      window.focus();
      document.execCommand('Copy', false, null);
    `
  });
  // diplay notification
  notify('Generated password is copied to the clipboard');
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  let cmd = info.menuItemId;
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
});

var cache = {};

function update (tabId, url, callback = function () {}) {
  if (url.startsWith('about:accounts')) {
    url = 'https://accounts.firefox.com';
  }

  let hostname = (new URL(url)).hostname;
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
          text: response && response.length && prefs.badge ? response.length + '' : ''
        });
        if (response) { // prevent loops
          callback();
        }
      }
    });
  }
  // only update badge on refresh
  else if (cache[tabId]) {
    let response = cache[tabId].credentials;
    chrome.browserAction.setBadgeText({
      tabId,
      text: response && response.length && prefs.badge ? response.length + '' : ''
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  let url = tab.url;
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

function login (tabId, credential) {
  chrome.tabs.executeScript(tabId, {
    runAt: 'document_start',
    allFrames: true,
    code: `
      [...document.querySelectorAll('input[type=password]')]
      .map(p => p.form)
      .filter(f => f)
      .filter((f, i, l) => l.indexOf(f) === i)
      .forEach(f => {
        // insert username and password
        [...f.querySelectorAll('input:not([type=password])')]
          .filter(i => (i.type === 'text' || i.type === 'email'))
          .forEach(input => {
            input.value = String.raw\`${protect(credential.username)} \`.slice(0, -1);
            input.dispatchEvent(new Event('change', {bubbles: true}));
            input.dispatchEvent(new Event('input', {bubbles: true}));
          });
        [...f.querySelectorAll('input[type=password]')]
          .forEach(input => {
            input.value = String.raw\`${protect(credential.password)} \`.slice(0, -1);
            input.dispatchEvent(new Event('change', {bubbles: true}));
            input.dispatchEvent(new Event('input', {bubbles: true}));
          });
        // submit
        if (${prefs.submit}) {
          let button = f.querySelector('input[type=submit]') || f.querySelector('[type=submit]');
          if (button) {
            button.click();
          }
          else {
            let onsubmit = f.getAttribute('onsubmit');
            if (onsubmit && onsubmit.indexOf('return false') === -1) {
              f.onsubmit();
            }
            else {
              f.submit();
            }
          }
        }
      });
    `
  });
}

function select (tabId) {
  chrome.tabs.executeScript(tabId, {
    runAt: 'document_start',
    allFrames: false,
    file: 'data/select/inject.js'
  });
}

function onCommand (tab) {
  let tabId = tab.id;

  if (cache[tabId] && cache[tabId].credentials && cache[tabId].credentials.length) {
    let credentials = cache[tabId].credentials;
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
  let tabId = sender.tab.id;

  if (request.cmd === 'login-with') {
    let credential = cache[tabId].credentials[request.id];
    login(tabId, credential);
  }
  else if (request.cmd === 'get-usernames') {
    response(cache[tabId].credentials.map(o => o.username));
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

chrome.commands.onCommand.addListener((command) => {
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
function faqs () {
  let version = chrome.runtime.getManifest().version;
  if (prefs.version !== version && (prefs.version ? prefs.faqs : true)) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://firefox.add0n.com/secure-login.html?version=' + version +
          '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
      });
    });
  }
}
(function () {
  let {name, version} = chrome.runtime.getManifest();
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
});
chrome.storage.onChanged.addListener(ps => {
  Object.keys(ps).forEach(pref => {
    prefs[pref] = ps[pref].newValue;
    if (pref === 'color') {
      color();
    }
  });
});
