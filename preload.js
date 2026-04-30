const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('forge', {
  getMeta: () => ipcRenderer.invoke('app:get-meta'),
  saveProject: (data) => ipcRenderer.invoke('project:save', data),
  openProject: () => ipcRenderer.invoke('project:open'),
  terminalStart: (payload) => ipcRenderer.invoke('terminal:start', payload),
  terminalStop: (payload) => ipcRenderer.invoke('terminal:stop', payload),
  terminalInput: (payload) => ipcRenderer.invoke('terminal:input', payload),
  terminalResize: (payload) => ipcRenderer.invoke('terminal:resize', payload),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  diagnosticsPath: () => ipcRenderer.invoke('diagnostics:path'),
  telemetryStatus: () => ipcRenderer.invoke('telemetry:status'),
  telemetryTest: () => ipcRenderer.invoke('telemetry:test'),
  onTerminalEvent: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on('terminal:event', listener);
    return () => ipcRenderer.removeListener('terminal:event', listener);
  }
});
