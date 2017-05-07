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
    faqs: false
  }, (prefs) => {
    document.getElementById('charset').value = prefs.charset;
    document.getElementById('length').value = prefs.length;
    document.getElementById('delay').value = prefs.delay;
    document.getElementById('submit').checked = prefs.submit;
    document.getElementById('notify').checked = prefs.notify;
    document.getElementById('badge').checked = prefs.badge;
    document.getElementById('color').value = prefs.color;
    document.getElementById('faqs').checked = prefs.faqs;
  });
}

function save() {
  let charset = document.getElementById('charset').value;
  let length = Math.max(document.getElementById('length').value, 3);
  let delay = Math.max(document.getElementById('delay').value, 1);
  let submit = document.getElementById('submit').checked;
  let notify = document.getElementById('notify').checked;
  let badge = document.getElementById('badge').checked;
  let color = document.getElementById('color').value;
  let faqs = document.getElementById('faqs').checked;
  chrome.storage.local.set({
    charset,
    length,
    delay,
    submit,
    notify,
    badge,
    color,
    faqs
  }, () => {
    let status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 750);
    restore();
  });
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);
