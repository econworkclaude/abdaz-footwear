# ABDAZ Footwear

Customer app for ABDAZ FOOTWEAR (Hasthinapuram, Chennai). **Step Into Style.**

Status: **v0.1 demo build.** The customer app runs fully on-device with sample data. Nothing is sent to a server, no SMS is sent, and no payment is taken.

## What works in this build

- Splash, 3-slide onboarding (remembered), guest browsing
- Phone + OTP sign-in in clearly labelled development mode (code `123456`, no SMS sent)
- Home: location header, search, promo banner, features row, categories, Trending / New Arrivals / Featured rails
- Catalogue: category chips, search, sort, price / UK size / in-stock filters, empty state
- Product: colour variants, UK 6 to 10 sizes driven by per-colour-per-size stock (sold-out sizes disabled), size guide, wishlist, Add to Bag / Buy Now
- Bag: quantity limits by stock, remove, totals, persisted between sessions
- Address: add / edit / delete / default, serviceability check against Zone A (Hasthinapuram, Chromepet, Chitlapakkam, Tambaram Sanatorium); Zone B/C areas are refused
- Checkout: sign-in, address, zone and stock checks, recalculated totals, COD only (UPI shown as not set up), duplicate-submit protection
- Order success (order IDs `AB000001`…), order tracking timeline with real timestamps and a labelled DEMO "next status" button, cancel while Placed/Confirmed (restocks), My Orders tabs, Account, Saved Items, Notifications, Support

## Not built yet (next phases)

Supabase schema + RLS + server checkout, real OTP (Supabase Auth + SMS provider), UPI gateway, Next.js admin dashboard, returns/exchanges flow, coupons, push notifications, maps. Product images are original vector illustrations until real photos are uploaded.

## Run it

```bash
cd apps/mobile
npm install
npx expo start          # scan the QR with Expo Go on Android (same Wi-Fi)
npm run typecheck && npm test
```

## Android APK

`.github/workflows/android-apk.yml` builds an installable APK on every push to `main`. Open the repository's **Actions** tab, pick the latest "Android APK" run, download `abdaz-demo-apk`, unzip, and open the `.apk` on the phone (allow "Install unknown apps" when asked). This is a test build signed with a debug key; a Play Store build needs a proper signing key (EAS or a keystore).
