'use strict';

function restore() {
  chrome.storage.local.get({
    charset: 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890',
    length: 12,
    delay: 2,
    submit: true,
    faqs: false
  }, (prefs) => {
    document.getElementById('charset').value = prefs.charset;
    document.getElementById('length').value = prefs.length;
    document.getElementById('delay').value = prefs.delay;
    document.getElementById('submit').checked = prefs.submit;
    document.getElementById('faqs').checked = prefs.faqs;
  });
}

function save() {
  let charset = document.getElementById('charset').value;
  let length = Math.max(document.getElementById('length').value, 3);
  let delay = Math.max(document.getElementById('delay').value, 1);
  let submit = document.getElementById('submit').checked;
  let faqs = document.getElementById('faqs').checked;
  chrome.storage.local.set({
    charset,
    length,
    delay,
    submit,
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
