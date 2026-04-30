const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('forge', {
  getMeta: () => ipcRenderer.invoke('app:get-meta'),
  saveProject: (data) => ipcRenderer.invoke('project:save', data),
  openProject: () => ipcRenderer.invoke('project:open'),
  terminalStart: (payload) => ipcRenderer.invoke('terminal:start', payload),
  terminalStop: (payload) => ipcRenderer.invoke('terminal:stop', payload),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  onTerminalEvent: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on('terminal:event', listener);
    return () => ipcRenderer.removeListener('terminal:event', listener);
  }
});
