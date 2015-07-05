/* globals addMessageListener, content */
'use strict';

addMessageListener('click', function () {
  var elems = content.document.querySelectorAll('[data-sl-click=true]');
  [].forEach.call(elems, function (elem) {
    elem.removeAttribute('data-sl-click');
    elem.click();
  });
});
addMessageListener('submit', function () {
  var elems = content.document.querySelectorAll('[data-sl-submit=true]');
  [].forEach.call(elems, function (elem) {
    elem.removeAttribute('data-sl-submit');
    elem.submit();
  });
});
addMessageListener('focus', function () {
  var elems = content.document.querySelectorAll('[data-sl-focus=true]');
  [].forEach.call(elems, function (elem) {
    elem.removeAttribute('data-sl-focus');
    elem.focus();
  });
});
