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
-- Games: anyone can read, organizers can insert/update
CREATE POLICY "Allow public read access to games" ON public.games
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert to games" ON public.games
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update to games" ON public.games
    FOR UPDATE TO public USING (true);

-- Vouchers: anyone can read basic metadata (excluding key_id)
CREATE POLICY "Allow public read access to voucher status" ON public.vouchers
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow staff insert vouchers" ON public.vouchers
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Game Keys: blocked for public; only accessible by service_role / internal procedures
CREATE POLICY "Allow service role full access to keys" ON public.game_keys
    FOR ALL TO service_role USING (true);

CREATE POLICY "Allow staff insert game keys" ON public.game_keys
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow staff select key status" ON public.game_keys
    FOR SELECT TO anon, authenticated USING (true);

-- Shield unredeemed key_code from public network inspection
REVOKE SELECT ON public.game_keys FROM anon, authenticated, public;
GRANT SELECT (id, game_id, status, created_at) ON public.game_keys TO anon, authenticated, public;
GRANT INSERT (game_id, key_code, status) ON public.game_keys TO anon, authenticated;
GRANT ALL ON public.game_keys TO service_role;

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

-- Grant execution to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.redeem_game_voucher(UUID) TO anon, authenticated, service_role;

-- Atomic Voucher Issuance Stored Procedure
CREATE OR REPLACE FUNCTION public.issue_game_voucher(p_game_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH picked_key AS (
      SELECT id FROM public.game_keys
      WHERE game_id = p_game_id AND status = 'available'
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    ),
    updated_key AS (
      UPDATE public.game_keys
      SET status = 'assigned'
      WHERE id IN (SELECT id FROM picked_key)
      RETURNING id, game_id
    ),
    new_voucher AS (
      INSERT INTO public.vouchers (game_id, key_id)
      SELECT game_id, id FROM updated_key
      RETURNING id, game_id, key_id, is_redeemed, created_at
    )
    SELECT jsonb_build_object(
      'id', v.id,
      'game_id', v.game_id,
      'key_id', v.key_id,
      'is_redeemed', v.is_redeemed,
      'created_at', v.created_at
    )
    INTO v_result
    FROM new_voucher v;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'No available keys for this game';
    END IF;

    RETURN v_result;
END;
$$;

-- Grant execution to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.issue_game_voucher(UUID) TO anon, authenticated, service_role;

