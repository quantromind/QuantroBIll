const { contextBridge, ipcRenderer } = require('electron');

// Expose safe POS hardware desktop APIs to the renderer window
contextBridge.exposeInMainWorld('desktopApi', {
  isElectron: true,
  platform: process.platform,

  // Hardware thermal printing for bills and KOT slips
  printThermal: (options) => ipcRenderer.invoke('print-thermal', options),

  // Raw ESC/POS thermal spooler simulation (58mm/80mm)
  printEscPosRaw: (data) => ipcRenderer.invoke('print-escpos-raw', data),

  // Kick cash drawer via ESC/POS pulse signal
  openCashDrawer: () => ipcRenderer.invoke('open-cash-drawer'),

  // Fullscreen / Kiosk mode toggle
  toggleFullScreen: () => ipcRenderer.invoke('toggle-fullscreen'),

  // Get list of connected physical receipt printers
  getPrinters: () => ipcRenderer.invoke('get-printers'),

  // Offline local caching APIs
  saveOfflineCache: (key, data) => ipcRenderer.invoke('save-offline-cache', { key, data }),
  getOfflineCache: (key) => ipcRenderer.invoke('get-offline-cache', { key }),
});
