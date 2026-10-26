// Pont entre l'interface et l'appli Windows (window.AlbaNative), même API que sur Android
const { contextBridge, ipcRenderer } = require('electron');
const call = (cmd, ...args) => ipcRenderer.sendSync('alba', cmd, ...args);
contextBridge.exposeInMainWorld('AlbaNative', {
  platform: () => call('platform'),
  getServer: () => call('getServer'),
  setServer: (url) => call('setServer', url),
  shellVersion: () => call('shellVersion'),
  saveShell: (version, html, js, css) => call('saveShell', version, html, js, css),
});
