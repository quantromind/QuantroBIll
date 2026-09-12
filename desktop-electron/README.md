# QuantroBill Desktop POS (Electron Module)

This is the dedicated desktop runtime for the QuantroBill Restaurant POS. It wraps the QuantroBill POS in a native desktop window with support for ESC/POS hardware silent printing, cash drawer kick pulses, and offline local fallback.

---

## 🚀 How to Run the Desktop App

### 1. Prerequisites
Ensure the Vite frontend server is running:
```bash
cd client
npm run dev
```

### 2. Start Electron
In a new terminal:
```bash
cd desktop-electron
npm install
npm start
```

---

## 🛠️ Key Capabilities
- **Direct Thermal Printing**: Prints 80mm & 58mm customer bills and kitchen KOT tokens directly to USB/LAN receipt printers without opening the system print dialog.
- **Cash Drawer Kick Pulse**: Sends standard ESC/POS pulses to trigger electronic cash drawers when finalizing cash payments.
- **Single Instance Lock**: Ensures that only one billing station window is active on the cash counter at any time to prevent double-billing.
- **Offline Fallback**: When the dev server is offline, loads pre-compiled static assets from `../client/dist/`.

---

## 📦 Building Standalone Windows Executable (.exe)
```bash
npm run build:win
```
The packaged installer will be generated in `desktop-electron/dist-electron/`.
