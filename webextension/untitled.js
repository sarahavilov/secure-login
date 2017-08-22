function aaa (prefs) {
  const array = new Uint8Array(prefs.length);
  window.crypto.getRandomValues(array);
  const password = [...array.map(n => Math.ceil(n / 256 * prefs.charset.length))]
    .map(n => prefs.charset[n])
    .join('');
  console.log(password.length);
  console.log(password)
}

aaa({
  charset: 'qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM1234567890',
  length: 10
});
