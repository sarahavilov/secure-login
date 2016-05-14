/* globals addMessageListener, content */
'use strict';

addMessageListener('click', function () {
  var elems = content.document.querySelectorAll('[data-sl-click]');
  [].forEach.call(elems, function (elem) {
    elem.removeAttribute('data-sl-click');
    elem.click();
  });
});
addMessageListener('submit', function () {
  var elems = content.document.querySelectorAll('[data-sl-submit]');
  [].forEach.call(elems, function (elem) {
    elem.removeAttribute('data-sl-submit');
    elem.submit();
  });
});
addMessageListener('focus', function () {
  var elems = content.document.querySelectorAll('[data-sl-focus]');
  [].forEach.call(elems, function (elem) {
    elem.removeAttribute('data-sl-focus');
    elem.focus();
  });
});
addMessageListener('value', function () {
  var elems = content.document.querySelectorAll('[data-sl-value]');
  [].forEach.call(elems, function (elem) {
    elem.value = elem.dataset.slValue;
    elem.dispatchEvent(new Event('change'));
    elem.dispatchEvent(new Event('keydown'));
    elem.dispatchEvent(new Event('keyup'));
    elem.dispatchEvent(new Event('keychange'));
    elem.removeAttribute('data-sl-value');
  });
});
