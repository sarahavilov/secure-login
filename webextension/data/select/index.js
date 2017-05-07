'use strict';

var select = document.querySelector('select');

function add (login, id) {
  let option = document.createElement('option');
  option.value = id;
  option.textContent = login;
  if (id === 0) {
    option.selected = true;
  }
  select.appendChild(option);
}

document.addEventListener('click', e => {
  let cmd = e.target.dataset.cmd;
  if (cmd === 'cancel') {
    chrome.runtime.sendMessage({
      cmd: 'close-me'
    });
  }
});
document.addEventListener('submit', (e) => {
  chrome.runtime.sendMessage({
    cmd: 'login-with',
    id: +document.querySelector('select').value
  });
  e.preventDefault();
});

chrome.runtime.sendMessage({
  cmd: 'get-usernames'
}, response => {
  response.forEach(add);
  window.focus();
  document.querySelector('select').focus();
});

document.addEventListener('keydown', e => {
  if (e.code === 'Escape') {
    document.querySelector('[data-cmd="cancel"]').click();
    e.preventDefault();
  }
  else if (e.code === 'Enter') {
    document.querySelector('[type=submit]').click();
  }
});

// keep the panel's focus
window.addEventListener('blur', () => {
  window.setTimeout(() => window.focus(), 0);
});
