# 📱 QuantroBill Waiter Mobile App (React Native + Expo)

Handheld captain and waiter order-taking application for QuantroBill POS.

---

## Features
- **4-Digit Quick PIN Login Pad**: Super fast touch authentication for waiters during rush hours.
- **Visual Handheld Floor Plan**: Live section tabs (Main Hall, AC Section, Patio) with status indicators:
  - 🟢 **Vacant**: Ready to seat and take order.
  - 🟡 **Active KOT**: Running order with timer and live total.
  - 🔴 **Food Ready**: Food marked cooked in KDS.
- **Ultra-Fast Order Punching**:
  - Live category pills & instant dish search.
  - Veg/Non-Veg indicators.
  - Cooking notes modal (*"Extra spicy"*, *"No onion"*, *"Jain"*).
  - 1-tap **"FIRE KOT TO KITCHEN"** button that sends orders directly to the Kitchen KDS screen and thermal printer.

---

## How to Run on Mobile (Android / iOS)

1. Navigate to the waiter mobile directory:
   ```bash
   cd waiter-mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

4. Scan the QR code using the **Expo Go** app on your Android or iOS phone, or press `a` for Android Emulator / `i` for iOS Simulator.
