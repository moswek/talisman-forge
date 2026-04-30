const { contextBridge } = require('electron');
const pkg = require('./package.json');

contextBridge.exposeInMainWorld('forgeMeta', {
  version: pkg.version,
  name: pkg.productName || pkg.name
});

window.addEventListener('DOMContentLoaded', () => {
  const version = document.getElementById('forge-version');
  if (version) version.textContent = `v${pkg.version}`;
});
