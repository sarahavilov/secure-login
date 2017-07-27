'use strict';

function restore() {
  chrome.storage.local.get({
    charset: 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890',
    length: 12,
    delay: 2,
    submit: true,
    notify: true,
    badge: true,
    color: '#6e6e6e',
    faqs: true,
    masterpassword: true
  }, prefs => {
    Object.entries(prefs).forEach(([key, value]) => {
      document.getElementById(key)[typeof value === 'boolean' ? 'checked' : 'value'] = value;
    });
  });
}

function save() {
  chrome.storage.local.set({
    charset: document.getElementById('charset').value,
    length: Math.max(document.getElementById('length').value, 3),
    delay: Math.max(document.getElementById('delay').value, 1),
    submit: document.getElementById('submit').checked,
    notify: document.getElementById('notify').checked,
    badge: document.getElementById('badge').checked,
    color: document.getElementById('color').value,
    faqs: document.getElementById('faqs').checked,
    masterpassword: document.getElementById('masterpassword').checked
  }, () => {
    const status = document.getElementById('status');
    status.textContent = chrome.i18n.getMessage('msgSaved');
    setTimeout(() => status.textContent = '', 750);
    restore();
  });
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);

// localization
[...document.querySelectorAll('[data-i18n]')].forEach(e => {
  e.textContent = chrome.i18n.getMessage(e.dataset.i18n);
});
