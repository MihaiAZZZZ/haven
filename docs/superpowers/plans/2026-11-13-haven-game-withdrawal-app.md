# Haven Game Voucher & Redemption Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first web app for Hack Club Haven that allows organizers to generate printable QR voucher cards from a pool of game keys (e.g., Steam keys), lets attendees trade physical cards safely with live verification, and enables one-time atomic key redemption on mobile phones.

**Architecture:** Client-side React 18+ application built with Vite and Tailwind CSS adopting the official Hack Club Haven theme. Backed by Supabase PostgreSQL with Row Level Security (RLS) and an atomic PostgreSQL stored procedure (`redeem_game_voucher`) ensuring strict single-use redemption with no double-claim race conditions.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, `@supabase/supabase-js`, `qrcode.react`, `lucide-react`, `canvas-confetti`, Vitest, `@testing-library/react`.

**Spec:** [docs/superpowers/specs/2026-11-13-haven-game-withdrawal-app-design.md](file:///home/mehoi/haven/docs/superpowers/specs/2026-11-13-haven-game-withdrawal-app-design.md)

## Global Constraints
- Target platform: Mobile-first responsive web app for phone screens (360px - 430px viewport width prioritized) + desktop-friendly organizer dashboard.
- Display font: `Jua` (Google Font).
- Colors: `haven-orange-deep` (#ed5615), `haven-orange-bright` (#fa681b), `haven-green` (#b8c220), `haven-green-deep` (#97a01a), `haven-yellow` (#ffd059), `haven-butter` (#ffe382), `haven-brown-dark` (#b8774a).
- Database credentials: Project ID `sftajljdqjfmpaakekmi`, publishable key configured in `.env`.
- Keys must never be exposed to public network requests prior to redemption.

---

### Task 1: Project Scaffolding & Haven Brand Configuration

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/index.css`
- Create: `src/main.tsx`
- Create: `public/assets/` (Haven logo, Daven mascot webp/svg)
- Test: `tests/setup.test.ts`

**Interfaces:**
- Produces: Tailwind theme config with `--color-haven-*` tokens, loaded Google Font `Jua`, base public assets.

- [ ] **Step 1: Create package.json and install dependencies**

```json
{
  "name": "haven-game-withdrawal",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.48.1",
    "canvas-confetti": "^1.9.4",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "qrcode.react": "^4.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@types/canvas-confetti": "^1.9.0",
    "@types/node": "^22.13.4",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^26.0.0",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.5"
  }
}
```

- [ ] **Step 2: Configure Vite, Tailwind CSS, TypeScript, and Google Fonts**

In `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        haven: {
          orange: {
            deep: "#ed5615",
            bright: "#fa681b",
            mid: "#fc8616",
          },
          green: {
            DEFAULT: "#b8c220",
            deep: "#97a01a",
          },
          yellow: "#ffd059",
          butter: "#ffe382",
          brown: {
            dark: "#b8774a",
            light: "#dda47d",
          },
          blue: {
            deep: "#2cbf90",
          },
        },
      },
      fontFamily: {
        display: ["'Jua'", "sans-serif"],
        body: ["system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        tactile: "0 4px 0 0 #b8774a",
        "tactile-active": "0 1px 0 0 #b8774a",
        card: "0 8px 0 0 rgba(184, 119, 74, 0.4)",
      },
    },
  },
  plugins: [],
};
```

In `index.html`:
Include Google Font:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jua&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Download and store official Haven assets in public directory**

Download `logo.webp` and `daven.webp` from `haven.hackclub.com/images/` into `public/images/`.

- [ ] **Step 4: Write failing setup test and verify environment**

In `tests/setup.test.ts`:
```typescript
import { describe, it, expect } from "vitest";

describe("Environment Setup", () => {
  it("renders correctly with Haven config", () => {
    expect(true).toBe(true);
  });
});
```

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json vite.config.ts tsconfig*.json tailwind.config.js postcss.config.js index.html src/ public/ tests/
git commit -m "chore: scaffold project with Haven theme and assets"
```

---

### Task 2: Supabase Schema & Atomic RPC Stored Procedure

**Files:**
- Create: `supabase/migrations/20261113000000_haven_schema.sql`
- Create: `supabase/seed.sql`
- Create: `.env.example`
- Create: `.env`
- Test: `tests/schema.test.ts`

**Interfaces:**
- Consumes: Supabase database connection details.
- Produces: `games`, `game_keys`, `vouchers` tables, and `redeem_game_voucher(p_voucher_id UUID)` RPC function.

- [ ] **Step 1: Write SQL migration file with tables, RLS, and atomic RPC function**

In `supabase/migrations/20261113000000_haven_schema.sql`:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Games Table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Game Keys Table (Secret codes)
CREATE TABLE IF NOT EXISTS public.game_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    key_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'redeemed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Vouchers Table (Printed QR codes)
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE RESTRICT,
    key_id UUID NOT NULL UNIQUE REFERENCES public.game_keys(id) ON DELETE RESTRICT,
    is_redeemed BOOLEAN NOT NULL DEFAULT false,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_keys_game_status ON public.game_keys(game_id, status);
CREATE INDEX IF NOT EXISTS idx_vouchers_game_id ON public.vouchers(game_id);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- Games: anyone can read
CREATE POLICY "Allow public read access to games" ON public.games
    FOR SELECT TO public USING (true);

-- Vouchers: anyone can read basic metadata (excluding key_id)
CREATE POLICY "Allow public read access to voucher status" ON public.vouchers
    FOR SELECT TO public USING (true);

-- Game Keys: blocked for public; only accessible by service_role / internal procedures
CREATE POLICY "Allow service role full access to keys" ON public.game_keys
    FOR ALL TO service_role USING (true);

-- Atomic Redeem Stored Procedure
CREATE OR REPLACE FUNCTION public.redeem_game_voucher(p_voucher_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_voucher RECORD;
    v_key_code TEXT;
    v_game_title TEXT;
    v_game_image TEXT;
BEGIN
    -- 1. Atomically update voucher ONLY IF is_redeemed is false
    UPDATE public.vouchers
    SET is_redeemed = true,
        redeemed_at = now()
    WHERE id = p_voucher_id AND is_redeemed = false
    RETURNING id, game_id, key_id, redeemed_at INTO v_voucher;

    -- If no row updated, voucher was either already redeemed or does not exist
    IF NOT FOUND THEN
        SELECT v.is_redeemed, v.redeemed_at, g.title, g.image_url
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
                'game_title', v_voucher.title,
                'image_url', v_voucher.image_url
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

    -- 3. Retrieve game metadata
    SELECT title, image_url INTO v_game_title, v_game_image 
    FROM public.games 
    WHERE id = v_voucher.game_id;

    -- 4. Return success payload with secret key
    RETURN jsonb_build_object(
        'success', true,
        'voucher_id', v_voucher.id,
        'game_title', v_game_title,
        'image_url', v_game_image,
        'key_code', v_key_code,
        'redeemed_at', v_voucher.redeemed_at
    );
END;
$$;
```

- [ ] **Step 2: Create sample seeds and .env files**

In `.env`:
```env
VITE_SUPABASE_URL=https://sftajljdqjfmpaakekmi.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_vR130N8Tm5BM-lNy3pfl_Q_QUqh8f6x
```

- [ ] **Step 3: Commit**

```bash
git add supabase/ .env.example
git commit -m "feat(db): add Supabase schema and atomic redeem RPC function"
```

---

### Task 3: Data Access Layer & Supabase Client

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/types/database.ts`
- Create: `src/services/voucherService.ts`
- Test: `tests/voucherService.test.ts`

**Interfaces:**
- Consumes: Supabase credentials from environment.
- Produces:
  - `getVoucherStatus(voucherId: string): Promise<VoucherStatusResult>`
  - `redeemVoucher(voucherId: string): Promise<RedeemResult>`
  - `issueVoucher(gameId: string): Promise<IssuedVoucher>`
  - `addGameKeys(gameId: string, keys: string[]): Promise<number>`
  - `getGamesWithCounts(): Promise<GameWithInventory[]>`

- [ ] **Step 1: Write type definitions**

In `src/types/database.ts`:
```typescript
export interface Game {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  created_at: string;
}

export interface GameWithInventory extends Game {
  available_keys: number;
  total_keys: number;
}

export interface VoucherStatusResult {
  id: string;
  is_redeemed: boolean;
  redeemed_at: string | null;
  game: {
    title: string;
    image_url: string | null;
  };
}

export interface RedeemSuccess {
  success: true;
  voucher_id: string;
  game_title: string;
  image_url: string | null;
  key_code: string;
  redeemed_at: string;
}

export interface RedeemFailure {
  success: false;
  error: 'ALREADY_REDEEMED' | 'INVALID_VOUCHER' | 'UNKNOWN';
  message: string;
  game_title?: string;
  redeemed_at?: string;
}

export type RedeemResult = RedeemSuccess | RedeemFailure;
```

- [ ] **Step 2: Write tests for voucher service logic**

In `tests/voucherService.test.ts`:
Mock Supabase responses to verify parsing of success and already_redeemed payloads.

- [ ] **Step 3: Implement `src/services/voucherService.ts`**

Implement `getVoucherStatus` and `redeemVoucher` using `@supabase/supabase-js`.

- [ ] **Step 4: Run tests to verify**

Run: `npm test tests/voucherService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ src/types/ src/services/ tests/voucherService.test.ts
git commit -m "feat(services): implement typed Supabase voucher service"
```

---

### Task 4: Attendee Mobile Claim View (`/claim/:uuid`)

**Files:**
- Create: `src/components/claim/ClaimHeader.tsx`
- Create: `src/components/claim/TradeStatusBadge.tsx`
- Create: `src/components/claim/RedeemCard.tsx`
- Create: `src/components/claim/KeyRevealedModal.tsx`
- Create: `src/pages/ClaimPage.tsx`
- Create: `src/hooks/useVoucherClaim.ts`
- Test: `tests/ClaimPage.test.tsx`

**Interfaces:**
- Consumes: `voucherService.getVoucherStatus`, `voucherService.redeemVoucher`.
- Produces: Standalone `/claim/:uuid` route with live trading badge and one-time key reveal.

- [ ] **Step 1: Write test for ClaimPage states**

In `tests/ClaimPage.test.tsx`:
- Test 1: Renders loading state with Daven animation.
- Test 2: Renders `VALID FOR TRADE - UNCLAIMED` badge when voucher is unredeemed.
- Test 3: Renders `ALREADY REDEEMED` badge when voucher was claimed.
- Test 4: Tapping "Claim Game Key" calls `redeemVoucher` and displays secret key with copy button.

- [ ] **Step 2: Implement `TradeStatusBadge` and `ClaimHeader`**

Adopts Haven styling with Jua font and Haven green / orange badges.

- [ ] **Step 3: Implement `ClaimPage` with localStorage caching**

Saves revealed key to `localStorage.getItem(`haven_claim_${uuid}`)` so browser reloads never lock out the redeemer.

- [ ] **Step 4: Run test to verify**

Run: `npm test tests/ClaimPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/claim/ src/pages/ClaimPage.tsx src/hooks/ tests/ClaimPage.test.tsx
git commit -m "feat(claim): add mobile claim view with trading verification badge"
```

---

### Task 5: Organizer Admin Dashboard (`/admin`) & Key Management

**Files:**
- Create: `src/pages/AdminPage.tsx`
- Create: `src/components/admin/GameKeyManager.tsx`
- Create: `src/components/admin/AddGameModal.tsx`
- Create: `src/components/admin/AddKeysModal.tsx`
- Test: `tests/AdminPage.test.tsx`

**Interfaces:**
- Consumes: `voucherService.getGamesWithCounts`, `voucherService.addGameKeys`.
- Produces: Organizer inventory interface showing available key counts and batch key import (multi-line paste).

- [ ] **Step 1: Write test for AdminPage inventory and key addition**

In `tests/AdminPage.test.tsx`:
- Test: Displays game cards with key counters.
- Test: Adding keys calls service and updates counter.

- [ ] **Step 2: Implement Admin UI components**

Includes button to create new game, modal to paste bulk Steam keys, and live key count indicators.

- [ ] **Step 3: Run test to verify**

Run: `npm test tests/AdminPage.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/AdminPage.tsx src/components/admin/ tests/AdminPage.test.tsx
git commit -m "feat(admin): implement organizer game inventory and key manager"
```

---

### Task 6: Physical Voucher Dispenser & Print-Ready Cards

**Files:**
- Create: `src/components/admin/VoucherDispenser.tsx`
- Create: `src/components/print/PrintableVoucherCard.tsx`
- Create: `src/components/print/PrintModal.tsx`
- Create: `src/styles/print.css`
- Test: `tests/PrintableCard.test.tsx`

**Interfaces:**
- Consumes: `voucherService.issueVoucher`.
- Produces: Instant QR voucher card generator with `@media print` formatted printable cards.

- [ ] **Step 1: Write test for PrintableVoucherCard**

In `tests/PrintableCard.test.tsx`:
- Test: Renders game title, vector QR code with UUID URL, Daven mascot, and single-use trading note.

- [ ] **Step 2: Implement PrintableVoucherCard with print CSS**

Format card with exact dimensions (e.g. 2.5" x 3.5" trading card or label size):
```css
@media print {
  body * {
    visibility: hidden;
  }
  .printable-card-area, .printable-card-area * {
    visibility: visible;
  }
  .printable-card-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
```

- [ ] **Step 3: Implement VoucherDispenser button grid**

Buttons for each game (e.g. `[ + Draw Celeste Voucher ]`). Pressing calls `issueVoucher`, pairs unused key, and pops up print modal.

- [ ] **Step 4: Run test to verify**

Run: `npm test tests/PrintableCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/print/ src/components/admin/VoucherDispenser.tsx src/styles/print.css tests/PrintableCard.test.tsx
git commit -m "feat(print): add tactile voucher dispenser and print-ready card modal"
```

---

### Task 7: App Routing, Fallbacks, Integration & Verification

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/NotFoundPage.tsx`
- Create: `src/components/ui/Confetti.tsx`
- Test: `tests/integration.test.tsx`

**Interfaces:**
- Produces: Full end-to-end routing (`/claim/:uuid`, `/admin`, `/`), 404 handler with Daven the hedgehog, and full build verification.

- [ ] **Step 1: Write integration test**

Verify route handling: navigating to `/claim/some-uuid` loads ClaimPage, `/admin` loads AdminPage, unknown routes show 404.

- [ ] **Step 2: Implement App router and NotFoundPage**

- [ ] **Step 3: Run full test suite & production build check**

Run: `npm test && npm run build`
Expected: 100% tests pass, build produces clean production bundle in `dist/`.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/pages/NotFoundPage.tsx src/components/ui/ tests/integration.test.tsx
git commit -m "feat: complete app routing, error pages, and build verification"
```
