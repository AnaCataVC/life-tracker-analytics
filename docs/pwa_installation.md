# Installing Life Tracker & Analytics (PWA)

Life Tracker & Analytics is built as a **Progressive Web App (PWA)**. This means you can install it directly onto your device (PC, Mac, iOS, or Android) without needing to download it from an app store. 

By installing the app, you get a native-like experience: it runs in full-screen mode, has its own app icon on your home screen or taskbar, and operates seamlessly with the built-in Google Drive synchronization.

## How to Install

### 💻 On Desktop (Windows / Mac / Linux)
**Using Google Chrome or Microsoft Edge:**
1. Open the Life Tracker & Analytics application in your browser.
2. Look at the right side of the address bar (URL bar).
3. Click on the **"Install Life Tracker & Analytics"** icon (usually a small monitor with a down arrow, or an app icon with a plus sign).
4. Confirm by clicking **Install**.
5. The app will now open in its own dedicated window and can be pinned to your taskbar or dock.

### 📱 On Android
**Using Google Chrome:**
1. Open the Life Tracker & Analytics application in your mobile browser.
2. Tap the three-dot menu `⋮` in the top-right corner of Chrome.
3. Select **"Add to Home screen"** or **"Install app"**.
4. Confirm the prompt. The Life Tracker & Analytics icon will now appear in your app drawer and home screen.

### 🍎 On iOS (iPhone / iPad)
**Using Safari:** *(Note: Chrome on iOS does not support PWA installation)*
1. Open the Life Tracker & Analytics application in Safari.
2. Tap the **Share** button at the bottom of the screen (the square with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm by tapping **Add** in the top right. 
5. The app will now be available on your iOS home screen as a standalone application.

---

## 🔐 Note on Google Authentication (GIS)
Because Life Tracker & Analytics is installed as a PWA, it behaves securely just like the web version. Your **Google Identity Services (GIS)** authentication will continue to work perfectly. 

When you connect your Google Account from the installed app, it will safely open a secure browser popup for consent and then return you to your installed app automatically.

## 🛠 For Developers
The PWA functionality is powered by `vite-plugin-pwa`. 
- **Icons**: Located in the `/public` directory (`pwa-192x192.png` and `pwa-512x512.png`).
- **Configuration**: The Web App Manifest and Service Worker registration are automatically handled in `vite.config.ts`.
- **Updates**: The service worker is configured for `autoUpdate`, meaning users will automatically get the latest version of the app when they close and reopen it.

---

## 🚀 Static Hosting & Local-First Architecture
Life Tracker & Analytics is built as a **Local-First PWA**. This means that there is **no backend server** required. All your data is saved instantly and securely in your device's local database (IndexedDB via Dexie) and backed up directly to your personal Google Drive as a JSON file (`lifetracker_backup.json`).

### Deploying to Vercel / Netlify
Because the Express server was removed, you can deploy this app 100% for free on static hosting platforms.
1. Connect your repository to Vercel or Netlify.
2. Set the **Build Command** to `npm run build`.
3. Set the **Output Directory** to `dist`.
4. **Environment Variable**: Add `VITE_GOOGLE_CLIENT_ID` with your Google Cloud OAuth Client ID in your hosting provider's dashboard.

Once deployed, visit your domain, connect your Google Account, and install the PWA on your devices!
