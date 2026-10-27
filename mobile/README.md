# SwapToMe Mobile App

SwapToMe's dedicated mobile experience, connected directly to the live backend (`https://swaptome-api.onrender.com`) and MongoDB database.

---

## ⚡ Option 1: Instant Run (No Flutter SDK needed!)

You can run and test this mobile app immediately right now in your browser or phone:

### Method A — Using NPM:
```bash
cd mobile
npm start
```
Then open `http://localhost:4000` in your browser. (Press `F12` and toggle the Device/Mobile toolbar in Chrome for the native phone viewport).

### Method B — Direct in Browser:
Simply double-click [`index.html`](index.html) in the `mobile` folder to open it directly in your browser.

---

## 📱 Option 2: Native Flutter App (`lib/`)

The full native Flutter & Dart codebase is ready in `lib/`:
```bash
cd mobile
flutter pub get
flutter run
```
*(Requires Flutter SDK installed on your system).*

---

## 🌟 Mobile Features Included:
- **Campus Textbook Feed:** Live listings fetched from `https://swaptome-api.onrender.com/api/books`.
- **Category Filter Pills:** All, Engineering, Medical, Management, Law, Arts, Exam Prep, Novels.
- **Search:** Real-time search by title, author, or campus location.
- **Book Details Sheet:** Image preview, verified student seller card, and location.
- **Sell Book (FAB):** Post new listings with photo upload, title, author, category, and price.
- **In-App Messaging:** Direct chat with sellers to buy or swap textbooks.
- **User Authentication:** Login, registration with college/campus, and session persistence.
- **Bottom Navigation:** Browse, Messages, and Account tabs.
