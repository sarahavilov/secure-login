'use strict';

try {
  document.body.removeChild(iframe);
}
catch (e) {}

var iframe = document.createElement('iframe'); // jshint ignore:line

iframe.setAttribute('style', `
  border: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 350px;
  height: 200px;
  max-width: 80%;
  margin-left: auto;
  margin-right: auto;
  background-color: #fff;
  z-index: 10000000000;
  box-shadow: 0 0 5px #999;
`);
document.body.appendChild(iframe);
iframe.src = chrome.runtime.getURL('data/select/index.html');
