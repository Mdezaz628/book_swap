# SwapToMe Mobile App (React Native & Expo)

SwapToMe mobile app built with **React Native** and **Expo**. Connected to the live Render cloud backend (`https://swaptome-api.onrender.com`).

---

## 📱 How to Run on Your Phone (Android / iPhone)

You **do not** need Android Studio or Xcode!

1. Install **Expo Go** from Google Play Store or Apple App Store on your physical phone:
   - [Expo Go on Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [Expo Go on App Store](https://apps.apple.com/app/expo-go/id982107779)

2. Open PowerShell in `Book1\mobile`:
   ```bash
   cd mobile
   npm start
   ```

3. A large QR code will display in the terminal and in your browser (`http://localhost:8081`).
   - **Android**: Open the **Expo Go** app and tap **"Scan QR code"**.
   - **iPhone**: Open the default **Camera** app and tap the Expo notification prompt.

---

## 💻 How to Run on Web (Browser)

If you'd like to test the app in your desktop browser:
```bash
npm run web
```
*(If prompted, install the optional web package `npx expo install react-dom react-native-web`)*

---

## 📁 Project Structure

```
mobile/
├── App.js                         # Root layout with 5-tab bottom navigation
├── app.json                       # App branding, icon, splash, theme configuration
├── package.json                   # Dependencies (expo, react-native, expo-image-picker, etc.)
└── src/
    ├── constants/
    │   ├── theme.js               # Amber brand colors, radii, shadows, spacing
    │   └── api.js                 # Live Render cloud endpoints
    ├── components/
    │   ├── BookCard.js            # Responsive 2-column card with badges
    │   └── BookDetailModal.js     # Fullscreen details modal, owner contact, swap action
    └── screens/
        ├── HomeScreen.js          # Explore feed, category chips, search
        ├── BrowseScreen.js        # Filters (Type, Condition, Sort by price/date)
        ├── SellScreen.js          # Photo picker (Camera/Gallery) & listing creation
        ├── ChatScreen.js          # Direct messages & swap negotiations
        └── ProfileScreen.js       # User auth, stats, Render backend health monitor
```
