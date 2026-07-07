# Launching Sprout

Two ways to ship, both prepped in this repo:

- **Track A — Web (PWA):** live in minutes, free, installable on iPhone via "Add to Home Screen". No Apple account.
- **Track B — App Store:** wrap the web build in a native iOS app with Capacitor, then submit through Xcode + App Store Connect.

You can do both. Track A is the fastest way to get it on your phone and to host the privacy policy URL the App Store requires.

---

## Track A — Deploy as a PWA (live today)

The production build is a static site in `dist/`. SPA routing + a privacy page are already configured (`vercel.json`, `public/_redirects`, `public/privacy.html`).

```bash
npm run build        # outputs dist/
```

**Vercel (easiest):**
```bash
npm i -g vercel
vercel               # first run: log in + link the project
vercel --prod        # deploys; gives you https://<name>.vercel.app
```

**or Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**or** connect the GitHub repo in the Vercel/Netlify dashboard (Framework preset: **Vite**, build command `npm run build`, output dir `dist`) for auto-deploys on push.

Then on iPhone: open the URL in **Safari → Share → Add to Home Screen**. It installs full‑screen with the app icon and works offline.

Your privacy policy will be live at `https://<your-domain>/privacy.html` — you'll need that URL for the App Store listing. **Edit the three `TODO`s in `public/privacy.html`** (date, support email) first.

---

## Track B — App Store (Capacitor + Xcode)

### One‑time prerequisites (not yet on this Mac)
1. **Full Xcode** — install free from the Mac App Store (~7 GB). Then run once:
   `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer && sudo xcodebuild -license accept`
2. **CocoaPods** — `brew install cocoapods` (or `sudo gem install cocoapods`).
3. **Apple Developer Program** — **$99/year** at https://developer.apple.com/programs/ (approval can take a day or two).

### Generate the native iOS project (run after the prerequisites)
```bash
npm run build
npx cap add ios            # creates ios/ (runs pod install — needs CocoaPods)
npm run ios:assets         # fans assets/icon.png + assets/splash.png into the iOS icon/splash set
npm run ios:open           # opens the project in Xcode
```
After any future code change, re-run: `npm run ios:sync` (build + copy web assets into iOS), then re‑archive.

### In Xcode
1. Select the **App** target → **Signing & Capabilities** → check *Automatically manage signing* and pick your **Team** (your Apple Developer account).
2. Set the **Bundle Identifier** to the one you'll register (default in `capacitor.config.ts` is `com.alenlor.sprout` — change it to a reverse‑DNS you own).
3. Set **Version** (e.g. `1.0.0`) and **Build** (`1`).
4. Pick **Any iOS Device (arm64)** as the run target → **Product → Archive**.
5. In the Organizer window → **Distribute App → App Store Connect → Upload**.

### In App Store Connect (https://appstoreconnect.apple.com)
- Create the app record (same bundle id), pick a name + primary language.
- **Age rating:** answer the questionnaire honestly → this app is **4+** (no objectionable content). If you list it in the **Kids** category, extra rules apply (see below).
- **Privacy:** "App Privacy" section → **Data Not Collected** (true for this app). Add the **Privacy Policy URL** (`https://<your-domain>/privacy.html`).
- Upload **screenshots** (6.7" and 6.5" iPhone sizes at minimum) — take them from a deployed build or the Simulator.
- Write the description/keywords, select the build you uploaded, then **Submit for Review** (typically 1–3 days).

### Kids‑app compliance (you're in good shape)
This app is **fully local**: no accounts, no analytics, no ads, no third‑party SDKs, and the kid side is fully scripted (no AI chat, no free‑text leaving the device), with a PIN parental gate. That satisfies the hard parts of Apple's Kids Category / COPPA rules. Just make sure: privacy policy is published, age rating is set, and (if you later add external links or purchases) they sit behind a parental gate.

### Notes
- **Service worker:** the PWA registers a service worker. It generally works inside the Capacitor webview, but if you ever see stale assets after an update, gate registration on `!Capacitor.isNativePlatform()`.
- **Commit `ios/`** to source control once generated (it's a real Xcode project), but keep `ios/App/Pods/` and `ios/App/build/` ignored.
- Regenerate icons anytime with `npm run icons` (edits `assets/icon.png` / `assets/splash.png` from `public/icons/icon-512.svg`).
