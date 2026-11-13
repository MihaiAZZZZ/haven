# Haven Game Voucher & Redemption Web App 🎮🦔

A mobile-first web app for **Hack Club Haven** competitions allowing organizers to print collectible, single-use QR voucher cards and let attendees trade and withdraw their won games.

## Features

- **Attendee Mobile Claim (`/claim/:uuid`):**
  - Instant trade verification badge (🟢 `VALID FOR TRADE • UNCLAIMED` vs 🔴 `ALREADY CLAIMED`).
  - Single-use atomic redemption via PostgreSQL stored procedures.
  - Secret activation key reveal with 1-tap copy to clipboard and direct Steam activation link.
  - LocalStorage caching so browser reloads never lock out the redeemer.
- **In-App Camera QR Scanner:**
  - Attendees can tap the big square QR button on their phone to scan paper voucher cards directly using their camera.
  - Optional `(cant scan) to input the code manually` fallback.
- **Organizer Dashboard (`/admin`):**
  - Secured behind organizer password authentication (`VITE_ADMIN_PASSWORD`).
  - Game catalog & key pool manager (paste batches of Steam keys).
  - Instant voucher dispenser with `@media print` CSS for physical badge/slip printing.
- **Hack Club Haven Theme:**
  - Official colors (`haven-orange`, `haven-green`, `haven-yellow`, `haven-butter`).
  - Google Font `Jua` display typography.
  - Official Haven logo and Daven Pudding hedgehog mascot.

---

## Environment Variables

Configure these in `.env` (or in Vercel project settings):

```env
VITE_SUPABASE_URL=https://sftajljdqjfmpaakekmi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_vR130N8Tm5BM-lNy3pfl_Q_QUqh8f6x
VITE_ADMIN_PASSWORD=haven2026
```

---

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run unit tests
npm test

# Build for production
npm run build
```

---

## Supabase Database Setup

1. Open your Supabase project SQL Editor.
2. Run [`supabase/migrations/20261113000000_haven_schema.sql`](supabase/migrations/20261113000000_haven_schema.sql).
3. (Optional) Run [`supabase/seed.sql`](supabase/seed.sql) to populate sample games and keys.
