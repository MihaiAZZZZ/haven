-- Haven Game Voucher & Redemption Seed Data

-- 1. Seed Games
INSERT INTO public.games (id, title, slug, image_url)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Celeste', 'celeste', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'),
    ('a0000000-0000-0000-0000-000000000002', 'Hollow Knight', 'hollow-knight', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'),
    ('a0000000-0000-0000-0000-000000000003', 'Stardew Valley', 'stardew-valley', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'),
    ('a0000000-0000-0000-0000-000000000004', 'Balatro', 'balatro', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'),
    ('a0000000-0000-0000-0000-000000000005', 'Undertale', 'undertale', 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Game Keys
INSERT INTO public.game_keys (id, game_id, key_code, status)
VALUES
    -- Celeste keys
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'CEL-12345-ABCDE-67890', 'assigned'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'CEL-99887-FGHIJ-11223', 'available'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'CEL-55443-KLMNO-99001', 'redeemed'),

    -- Hollow Knight keys
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'HK-77889-PQRST-33445', 'available'),
    ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'HK-11223-UVWXY-55667', 'available'),

    -- Stardew Valley keys
    ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'SV-88990-ZABCD-77889', 'available'),
    ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'SV-33445-EFGHI-99001', 'available'),

    -- Balatro keys
    ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000004', 'BAL-44556-JKLMN-22334', 'available'),

    -- Undertale keys
    ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000005', 'UND-66778-OPQRS-88990', 'available')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Sample Vouchers
INSERT INTO public.vouchers (id, game_id, key_id, is_redeemed, redeemed_at)
VALUES
    -- Unredeemed voucher ready for claim / trade testing
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', false, NULL),
    -- Already redeemed voucher for testing claimed state
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', true, now() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;
