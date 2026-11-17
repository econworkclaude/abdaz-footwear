# ABDAZ Footwear

Two Android apps from one codebase for ABDAZ FOOTWEAR (Hasthinapuram, Chennai). **Step Into Style.**

| App | Package | Who uses it |
| --- | --- | --- |
| **ABDAZ** | `com.abdaz.footwear` | Customers: browse, size, bag, address check, Cash on Delivery, tracking |
| **ABDAZ Admin** | `com.abdaz.footwear.admin` | Store staff: dashboard, orders workflow, stock, products, delivery zones, settings |

Both apps run in **live mode** when Supabase keys are present and in clearly labelled **demo mode** (on-device sample data, no server) when they are not.

## Get the APKs

Every push to `main` runs `.github/workflows/android-apk.yml`, which checks types, runs tests and builds both APKs. Open the repository's **Releases → latest-apk** on your phone and tap `ABDAZ-….apk` or `ABDAZ-Admin-….apk` (allow "Install unknown apps" when asked). These are test builds signed with a debug key; a Play Store release needs a private signing key.

## Connect the real database (Supabase)

1. Create a project at supabase.com (region: Mumbai).
2. **SQL Editor** → run `supabase/migrations/20261118000001_init.sql`, then `supabase/seed.sql` (demo catalogue, clearly flagged `is_demo`).
3. **Authentication → Providers**
   - Email: enable. In **Email Templates → Magic Link**, include `{{ .Token }}` so customers receive a 6-digit code.
   - Phone (optional): needs an SMS provider (Twilio, MessageBird, Vonage or Textlocal) for real SMS OTP.
4. **Create the admin login**: Authentication → Users → *Add user* (email + password). Then in SQL Editor:
   ```sql
   update public.profiles set role = 'admin', full_name = 'Store Admin' where email = 'you@example.com';
   ```
5. In GitHub → Settings → Secrets and variables → Actions, add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API). Never add the `service_role` key anywhere in the apps.
6. Push or re-run the workflow. The new APKs are named `…-live.apk`.

## How the data is protected

- Customers can only read their own addresses, orders and notifications (row-level security).
- Orders are created only by the `place_order` database function: it checks sign-in, address ownership, active delivery zone and pincode, locks each size row, refuses overselling, recomputes prices from the database and is idempotent (a double tap creates one order).
- Status changes go through `admin_set_order_status` (admins only, valid steps only, restocks on cancel/return, writes audit log and a customer notification).
- Customers cannot change roles, prices or stock. Tested in `supabase/tests/checkout_test.sql`.

## Develop

```bash
cd apps/mobile
npm install
npx expo start                     # customer app (scan QR with Expo Go)
APP_VARIANT=admin npx expo start   # admin app
npm run typecheck && npm test
```

Database tests (plain Postgres 16): load `supabase/tests/shim.sql`, the migration, `seed.sql`, then run `supabase/tests/checkout_test.sql`.

## Not built yet

UPI gateway (needs a Razorpay/Cashfree account), product photo upload (Supabase Storage), returns/exchange request screens, coupons, push notifications, rider app and live map. Privacy policy and terms are placeholders that need the owner's legal review.
