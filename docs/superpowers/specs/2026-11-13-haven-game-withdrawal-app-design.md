# Haven Game Voucher & Redemption Web App Design Spec

- **Date:** 2026-11-13
- **Author:** Antigravity & Haven Team
- **Status:** Approved / Ready for Implementation Plan
- **Target Platform:** Mobile-First Web Application (PWA-ready) + Desktop Admin Dashboard
- **Theme:** Official Hack Club Haven Brand System

---

## 1. Executive Summary & Problem Context

Hack Club Haven hosts youth hackathons and game competitions where participants win game licenses (e.g., Steam keys). Rather than distributing digital keys directly at the time of winning, Haven organizers print physical, pocket-sized collectible voucher cards featuring unique QR codes. Attendees can freely trade their won games with other participants throughout the event.

Once an attendee decides to keep and redeem a game, they scan the physical card's QR code using their smartphone camera. The mobile web application validates the voucher's authenticity, verifies it has not yet been consumed (allowing safe trading), and lets the owner redeem the game key with a single tap. Each voucher can only ever be redeemed **once**.

---

## 2. Branding & Visual Design System

The application strictly adopts the official **Hack Club Haven** aesthetic:

### 2.1 Color Palette
- `haven-orange-deep`: `#ed5615` (Primary call-to-action & accents)
- `haven-orange-bright`: `#fa681b` (Hover / active button states)
- `haven-orange-mid`: `#fc8616`
- `haven-green`: `#b8c220` (Success & "Unclaimed / Valid for Trade" pill)
- `haven-green-deep`: `#97a01a` (Deep green accents & shadows)
- `haven-yellow`: `#ffd059` (Highlight badges & star accents)
- `haven-butter`: `#ffe382` (Card surface highlights)
- `haven-brown-dark`: `#b8774a` (Card borders & deep headings)
- `haven-brown-light`: `#dda47d` (Muted text / subtitle elements)
- `haven-blue-deep`: `#2cbf90` (Secondary decorative accents)
- `haven-bg`: `#fffbf0` / `#faf5ea` (Warm off-white paper canvas background)

### 2.2 Typography
- **Display Headings & Buttons:** `Jua`, cursive / sans-serif (Google Font: playful, rounded, distinct Haven font)
- **Body & Key Codes:** `Space Grotesk` or `Inter` for crisp readability; `JetBrains Mono` / monospace for Steam activation keys.

### 2.3 Mascot & Graphic Assets
- **Mascot:** Daven Pudding (the spiky hedgehog with a soft personality) as an interactive mascot on mobile screens.
- **Logos:** Official Hack Club Haven logo (SVG / webp).
- **Decorations:** Haven flower borders, rounded rectangular card frames, soft drop shadows (`shadow-[0_4px_0_0_#b8774a]`), and tactile retro button press animations.

---

## 3. System Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │                   Frontend (Vite + React)                │
   │                                                         │
   │   Attendee Mobile UI               Organizer Admin UI   │
   │   (/claim/:uuid)                   (/admin)             │
   │   - Instant trade verification     - Manage game pools  │
   │   - Atomic key reveal              - Generate QR badges │
   │   - One-tap copy & Steam link      - Print layout CSS   │
   └──────────────────────────┬──────────────────────────────┘
                              │ HTTPS / Supabase SDK
                              ▼
   ┌─────────────────────────────────────────────────────────┐
   │                   Supabase Cloud Backend                │
   │                                                         │
   │   PostgreSQL Database               Supabase Auth       │
   │   - `games`                         - Admin login       │
   │   - `game_keys`                     - Role-based RLS    │
   │   - `vouchers`                                          │
   │   - RPC: `redeem_game_voucher()` (Atomic Row Lock)      │
   └─────────────────────────────────────────────────────────┘
```

- **Frontend Framework:** React 18 / 19 with TypeScript, bundled with Vite for near-instant mobile page loads.
- **Styling:** Tailwind CSS with custom Haven plugin colors and custom button utility classes.
- **QR Code Generation:** Vector SVG QR codes (`qrcode.react` / `qrcode`) capable of rendering crisp printable cards without raster blur.
- **Backend / Database:** Supabase (PostgreSQL 15+) hosted instance.
- **Client Library:** `@supabase/supabase-js`.

---

## 4. Database Schema & Atomic Concurrency Model

### 4.1 PostgreSQL Tables

#### Table: `games`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | Unique game identifier |
| `title` | TEXT | NOT NULL | e.g. "Celeste", "Hollow Knight" |
| `slug` | TEXT | NOT NULL, UNIQUE | URL-safe identifier |
| `image_url` | TEXT | NULLABLE | Cover artwork / thumbnail |
| `created_at` | TIMESTAMPTZ | default `now()` | Timestamp |

#### Table: `game_keys`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | Unique key record identifier |
| `game_id` | UUID | FK -> `games.id` ON DELETE CASCADE | Target game |
| `key_code` | TEXT | NOT NULL | Secret activation code (e.g. Steam key) |
| `status` | TEXT | NOT NULL default `'available'` | Enum: `'available'`, `'assigned'`, `'redeemed'` |
| `created_at` | TIMESTAMPTZ | default `now()` | Timestamp |

#### Table: `vouchers`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | Encoded in QR code (`/claim/:id`) |
| `game_id` | UUID | FK -> `games.id` | Associated game |
| `key_id` | UUID | FK -> `game_keys.id`, UNIQUE | Paired unused key |
| `is_redeemed` | BOOLEAN | default `false` | Redemption status |
| `redeemed_at` | TIMESTAMPTZ | NULLABLE | Timestamp when redeemed |
| `created_at` | TIMESTAMPTZ | default `now()` | Timestamp when printed |

---

### 4.2 Strict Single-Use Atomic Stored Procedure (`redeem_game_voucher`)

To ensure unredeemed game keys can **never** be snooped by inspecting network payloads, and to prevent double-claiming under simultaneous requests:

```sql
CREATE OR REPLACE FUNCTION public.redeem_game_voucher(p_voucher_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voucher RECORD;
    v_key_code TEXT;
    v_game_title TEXT;
BEGIN
    -- 1. Atomically lock and claim the voucher in one atomic statement
    UPDATE public.vouchers
    SET is_redeemed = true,
        redeemed_at = now()
    WHERE id = p_voucher_id AND is_redeemed = false
    RETURNING id, game_id, key_id, redeemed_at INTO v_voucher;

    -- If no row was updated, check why
    IF NOT FOUND THEN
        -- Check if voucher exists but was already redeemed
        SELECT v.is_redeemed, v.redeemed_at, g.title 
        INTO v_voucher
        FROM public.vouchers v
        JOIN public.games g ON g.id = v.game_id
        WHERE v.id = p_voucher_id;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'ALREADY_REDEEMED',
                'message', 'This voucher has already been claimed.',
                'redeemed_at', v_voucher.redeemed_at,
                'game_title', v_voucher.title
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'error', 'INVALID_VOUCHER',
                'message', 'Voucher not found.'
            );
        END IF;
    END IF;

    -- 2. Mark the corresponding key as redeemed
    UPDATE public.game_keys
    SET status = 'redeemed'
    WHERE id = v_voucher.key_id
    RETURNING key_code INTO v_key_code;

    -- 3. Retrieve game title
    SELECT title INTO v_game_title FROM public.games WHERE id = v_voucher.game_id;

    -- 4. Return the revealed secret key
    RETURN jsonb_build_object(
        'success', true,
        'voucher_id', v_voucher.id,
        'game_title', v_game_title,
        'key_code', v_key_code,
        'redeemed_at', v_voucher.redeemed_at
    );
END;
$$;
```

---

### 4.3 Public vs. Admin Row-Level Security (RLS)

1. **`games`:** Public `SELECT` allowed for all users.
2. **`vouchers`:** Public `SELECT` allowed only for safe columns (`id`, `game_id`, `is_redeemed`, `redeemed_at`, `created_at`). The sensitive `key_id` is shielded.
3. **`game_keys`:** Completely blocked from public queries. Only accessible by authorized admin sessions and internally by the `redeem_game_voucher` `SECURITY DEFINER` function.

---

## 5. User Interfaces & Workflows

### 5.1 Attendee Mobile Experience (`/claim/:uuid`)

1. **Scan QR Code:** Attendee points phone camera at printed card; opens `https://haven-game-claim.web.app/claim/:uuid`.
2. **Phase 1: Trading Verification Card:**
   - Visual card with Haven styling, game artwork, and game title.
   - **Trade Status Pill:**
     - 🟢 **`VALID FOR TRADE • UNCLAIMED`**: Indicates to anyone considering trading for this card that it is 100% active.
     - 🔴 **`ALREADY CLAIMED`**: Displays timestamp of claim; warns recipient that the card has no remaining value.
3. **Phase 2: Redemption Action:**
   - Attendee clicks large Haven-Orange button: **`[ Claim Game Key ]`**.
   - Button enters loading state with playful animated Daven hedgehog.
   - Supabase RPC executes atomically.
4. **Phase 3: Key Unveiled:**
   - Secret key is displayed in high-contrast monospace container with a glowing border.
   - **One-Tap Copy:** Clicking the key or "Copy Key" button copies the code and triggers a "Copied to clipboard! 🎮" tooltip.
   - **Platform Shortcut:** "Redeem on Steam" direct link (`https://store.steampowered.com/account/registerkey?key=...`).
5. **Session Resilience (`localStorage` Cache):**
   - Once successfully revealed, the key is saved in the smartphone's `localStorage` indexed by the voucher UUID. If the attendee reloads the page or loses connection, their claimed key remains immediately accessible without re-querying or causing an error.

---

### 5.2 Organizer Admin & Generator Dashboard (`/admin`)

1. **Authentication:** Simple password / Supabase admin session.
2. **Game Catalog & Inventory:**
   - List of games with cover thumbnails.
   - Available key counter (e.g., `Celeste: 18 keys available`).
   - "Add Keys" modal: paste a list of Steam keys (one per line); automatically added to `game_keys` with `status = 'available'`.
3. **Tactile Button Grid (Voucher Dispenser):**
   - Large buttons for each game: `[ + Draw Celeste Voucher ]`, `[ + Draw Hollow Knight Voucher ]`.
   - Pressing a button:
     1. Automatically pulls an `available` key from that game's pool.
     2. Assigns it to a newly generated `vouchers` record with a cryptographically secure UUID.
     3. Marks the key `status = 'assigned'`.
     4. Opens the **Print Voucher Modal**.
4. **Printable Card Layout (Print CSS):**
   - Designed to fit standard label printers, business cards, or 4-per-page letter cards.
   - Contents:
     - Game Title + Hack Club Haven Logo.
     - Vector QR code with high error correction (Level M or Q) pointing directly to the mobile claim URL.
     - Daven the hedgehog illustration.
     - Printed trading notice: *"Scan with your phone to claim key • 1-time single redemption • Tradeable with friends at Haven!"*
   - Includes standard `@media print` CSS so clicking "Print" prints only the clean card boundaries without page headers or background UI clutter.
   - Batch print mode to print multiple cards at once for pre-event prep.

---

## 6. Error Handling & Edge Cases

| Scenario | System Behavior |
|---|---|
| **Attendee scans invalid / corrupted UUID** | Displays friendly 404 card featuring Daven the hedgehog: *"Oops! We couldn't find this voucher. Please check your printed QR code."* |
| **Simultaneous double-claim attempt** | PostgreSQL atomic `UPDATE ... WHERE is_redeemed = false` ensures exactly one request succeeds. The other immediately receives an `ALREADY_REDEEMED` response. |
| **Spotty Wi-Fi / Cell drops during claim** | If network drops before response arrives, a prominent "Retry Claim" button is displayed. If the key was already registered on the server, subsequent tap safely retrieves the state from `localStorage` or server check. |
| **No keys left when admin presses button** | Admin button displays disabled state with badge: *"0 Keys Remaining - Add more to issue vouchers"*, preventing broken QR code generation. |
| **Attendee refreshes page after claiming** | Key is cached in local browser storage; page displays the key immediately with a badge: *"You claimed this key on [Date]"*. |

---

## 7. Testing & Verification Strategy

1. **Database & RPC Concurrency Testing:**
   - Execute parallel asynchronous requests to `redeem_game_voucher` with identical UUID to confirm 100% single-winner resolution.
   - Verify that unauthenticated public sessions cannot query `game_keys` directly or view unredeemed keys in `vouchers`.
2. **Mobile Device Usability Testing:**
   - Test responsive layout on small phone viewports (iPhone SE, modern Android/iOS screens).
   - Test camera QR code scanning flow end-to-end.
   - Verify copy-to-clipboard functionality across mobile Safari and Chrome.
3. **Print Layout Testing:**
   - Verify `@media print` styling produces clean, crisp cards at 300 DPI without web chrome or margins.
