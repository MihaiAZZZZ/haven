import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultSupabase } from '../lib/supabase';
import type {
  Game,
  GameWithInventory,
  IssuedVoucher,
  RedeemFailure,
  RedeemResult,
  RedeemSuccess,
  VoucherStatusResult,
} from '../types/database';

/**
 * Retrieves the live status and game metadata for a given voucher id.
 */
export async function getVoucherStatus(
  voucherId: string,
  client: SupabaseClient = defaultSupabase
): Promise<VoucherStatusResult> {
  const { data, error } = await client
    .from('vouchers')
    .select(
      `
      id,
      is_redeemed,
      redeemed_at,
      games (
        title,
        image_url
      )
    `
    )
    .eq('id', voucherId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Voucher not found');
  }

  const rawGames = (data as Record<string, unknown>).games ?? (data as Record<string, unknown>).game;
  const gameData = Array.isArray(rawGames) ? rawGames[0] : rawGames;

  return {
    id: data.id,
    is_redeemed: Boolean(data.is_redeemed),
    redeemed_at: data.redeemed_at ?? null,
    game: {
      title: (gameData as { title?: string })?.title ?? 'Unknown Game',
      image_url: (gameData as { image_url?: string | null })?.image_url ?? null,
    },
  };
}

/**
 * Invokes the atomic Supabase RPC to redeem a voucher.
 */
export async function redeemVoucher(
  voucherId: string,
  client: SupabaseClient = defaultSupabase
): Promise<RedeemResult> {
  const { data, error } = await client.rpc('redeem_game_voucher', {
    p_voucher_id: voucherId,
  });

  if (error) {
    return {
      success: false,
      error: 'UNKNOWN',
      message: error.message || 'An unexpected error occurred during redemption.',
    };
  }

  const payload = typeof data === 'string' ? JSON.parse(data) : data;

  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      error: 'UNKNOWN',
      message: 'Invalid response from server.',
    };
  }

  if (payload.success === true) {
    const successResult: RedeemSuccess = {
      success: true,
      voucher_id: payload.voucher_id,
      game_title: payload.game_title,
      image_url: payload.image_url ?? null,
      key_code: payload.key_code,
      redeemed_at: payload.redeemed_at,
    };
    return successResult;
  }

  const failureError =
    payload.error === 'ALREADY_REDEEMED' || payload.error === 'INVALID_VOUCHER'
      ? payload.error
      : 'UNKNOWN';

  const failureResult: RedeemFailure = {
    success: false,
    error: failureError,
    message: payload.message || 'Redemption failed.',
    game_title: payload.game_title,
    redeemed_at: payload.redeemed_at,
  };
  return failureResult;
}

/**
 * Retrieves all games along with inventory counts (available keys and total keys).
 */
export async function getGamesWithCounts(
  client: SupabaseClient = defaultSupabase
): Promise<GameWithInventory[]> {
  const { data: games, error: gamesError } = await client
    .from('games')
    .select('id, title, slug, image_url, created_at, game_keys(id, status)')
    .order('title', { ascending: true });

  if (gamesError) {
    throw new Error(gamesError.message);
  }

  if (!games || games.length === 0) {
    return [];
  }

  const hasEmbeddedKeys = games.some((g) => Array.isArray((g as Record<string, unknown>).game_keys));

  if (!hasEmbeddedKeys) {
    const { data: keys, error: keysError } = await client
      .from('game_keys')
      .select('id, game_id, status');

    if (keysError) {
      throw new Error(keysError.message);
    }

    const keyList = keys || [];
    return (games as Array<Record<string, unknown>>).map((game) => {
      const gKeys = keyList.filter((k) => k.game_id === game.id);
      const available_keys = gKeys.filter((k) => k.status === 'available').length;
      const total_keys = gKeys.length;
      const { game_keys: _ignored, ...gameData } = game;
      return {
        ...(gameData as unknown as Game),
        available_keys,
        total_keys,
      };
    });
  }

  return (games as Array<Record<string, unknown>>).map((game) => {
    const keys = (game.game_keys as Array<{ id?: string; status?: string }>) || [];
    const available_keys = keys.filter((k) => k.status === 'available').length;
    const total_keys = keys.length;
    const { game_keys: _ignored, ...gameData } = game;
    return {
      ...(gameData as unknown as Game),
      available_keys,
      total_keys,
    };
  });
}

/**
 * Inserts an array of secret game keys with status 'available'.
 */
export async function addGameKeys(
  gameId: string,
  keys: string[],
  client: SupabaseClient = defaultSupabase
): Promise<number> {
  const cleanKeys = keys.map((k) => k.trim()).filter((k) => k.length > 0);

  if (cleanKeys.length === 0) {
    return 0;
  }

  const rows = cleanKeys.map((key_code) => ({
    game_id: gameId,
    key_code,
    status: 'available' as const,
  }));

  const { data, error } = await client
    .from('game_keys')
    .insert(rows)
    .select('id');

  if (error) {
    throw new Error(error.message);
  }

  return data ? data.length : 0;
}

/**
 * Finds an available key for the game, marks it 'assigned', and creates a voucher record.
 * Uses atomic PostgreSQL stored procedure `issue_game_voucher` with client-side fallback.
 */
export async function issueVoucher(
  gameId: string,
  client: SupabaseClient = defaultSupabase
): Promise<IssuedVoucher> {
  // 1. Attempt atomic stored procedure execution if RPC is supported
  if (typeof client.rpc === 'function') {
    try {
      const { data, error } = await client.rpc('issue_game_voucher', {
        p_game_id: gameId,
      });

      if (!error && data) {
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        return {
          id: payload.id,
          game_id: payload.game_id,
          key_id: payload.key_id,
          created_at: payload.created_at,
        };
      }

      if (error) {
        if (/No available keys/i.test(error.message)) {
          throw new Error('No available keys for this game');
        }

        // If the error indicates missing function in mock/DB, fall through to fallback
        const isMissingFunction =
          error.code === 'PGRST202' ||
          /function.*does not exist/i.test(error.message) ||
          /could not find the function/i.test(error.message);

        if (!isMissingFunction) {
          throw new Error(error.message);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && /No available keys/i.test(err.message)) {
        throw err;
      }
    }
  }

  // 2. Client-side fallback for testing / environments without RPC
  const { data: key, error: keyError } = await client
    .from('game_keys')
    .select('id')
    .eq('game_id', gameId)
    .eq('status', 'available')
    .limit(1)
    .single();

  if (keyError || !key) {
    throw new Error('No available keys for this game');
  }

  const { error: updateError } = await client
    .from('game_keys')
    .update({ status: 'assigned' })
    .eq('id', key.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { data: voucher, error: voucherError } = await client
    .from('vouchers')
    .insert({
      game_id: gameId,
      key_id: key.id,
      is_redeemed: false,
    })
    .select('id, game_id, key_id, created_at')
    .single();

  if (voucherError || !voucher) {
    throw new Error(voucherError?.message || 'Failed to create voucher');
  }

  return {
    id: voucher.id,
    game_id: voucher.game_id,
    key_id: voucher.key_id,
    created_at: voucher.created_at,
  };
}

/**
 * Inserts a new game into the games catalog.
 */
export async function createGame(
  title: string,
  slug: string,
  imageUrl?: string,
  client: SupabaseClient = defaultSupabase
): Promise<Game> {
  const { data, error } = await client
    .from('games')
    .insert({
      title,
      slug,
      image_url: imageUrl || null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create game');
  }

  return data as Game;
}
