import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';
import {
  getVoucherStatus,
  redeemVoucher,
  getGamesWithCounts,
  addGameKeys,
  issueVoucher,
  createGame,
} from '../src/services/voucherService';
import type {
  Game,
  GameWithInventory,
  VoucherStatusResult,
  RedeemSuccess,
  RedeemFailure,
  IssuedVoucher,
} from '../src/types/database';

describe('voucherService', () => {
  describe('getVoucherStatus', () => {
    it('returns status for an unredeemed voucher', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'voucher-1',
                  is_redeemed: false,
                  redeemed_at: null,
                  games: {
                    title: 'Celeste',
                    image_url: 'https://example.com/celeste.jpg',
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const result = await getVoucherStatus('voucher-1', mockClient);

      expect(result).toEqual<VoucherStatusResult>({
        id: 'voucher-1',
        is_redeemed: false,
        redeemed_at: null,
        game: {
          title: 'Celeste',
          image_url: 'https://example.com/celeste.jpg',
        },
      });
      expect(mockClient.from).toHaveBeenCalledWith('vouchers');
    });

    it('returns status for an already redeemed voucher with timestamp', async () => {
      const redeemedTime = '2026-11-14T00:00:00Z';
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'voucher-2',
                  is_redeemed: true,
                  redeemed_at: redeemedTime,
                  games: {
                    title: 'Hollow Knight',
                    image_url: null,
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const result = await getVoucherStatus('voucher-2', mockClient);

      expect(result).toEqual<VoucherStatusResult>({
        id: 'voucher-2',
        is_redeemed: true,
        redeemed_at: redeemedTime,
        game: {
          title: 'Hollow Knight',
          image_url: null,
        },
      });
    });

    it('throws an error if voucher is not found', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Row not found' },
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      await expect(getVoucherStatus('non-existent', mockClient)).rejects.toThrow('Row not found');
    });
  });

  describe('redeemVoucher', () => {
    it('successfully redeems voucher and returns secret key payload', async () => {
      const mockRpcResponse = {
        success: true,
        voucher_id: 'v-100',
        game_title: 'Celeste',
        image_url: 'https://example.com/celeste.png',
        key_code: 'STEAM-AAAA-BBBB-CCCC',
        redeemed_at: '2026-11-14T01:00:00Z',
      };

      const mockClient = {
        rpc: vi.fn().mockResolvedValue({
          data: mockRpcResponse,
          error: null,
        }),
      } as unknown as SupabaseClient;

      const result = await redeemVoucher('v-100', mockClient);

      expect(mockClient.rpc).toHaveBeenCalledWith('redeem_game_voucher', {
        p_voucher_id: 'v-100',
      });
      expect(result).toEqual<RedeemSuccess>({
        success: true,
        voucher_id: 'v-100',
        game_title: 'Celeste',
        image_url: 'https://example.com/celeste.png',
        key_code: 'STEAM-AAAA-BBBB-CCCC',
        redeemed_at: '2026-11-14T01:00:00Z',
      });
    });

    it('handles ALREADY_REDEEMED failure payload from RPC', async () => {
      const mockRpcResponse = {
        success: false,
        error: 'ALREADY_REDEEMED',
        message: 'This voucher has already been claimed.',
        game_title: 'Celeste',
        redeemed_at: '2026-11-13T20:00:00Z',
      };

      const mockClient = {
        rpc: vi.fn().mockResolvedValue({
          data: mockRpcResponse,
          error: null,
        }),
      } as unknown as SupabaseClient;

      const result = await redeemVoucher('v-100', mockClient);

      expect(result).toEqual<RedeemFailure>({
        success: false,
        error: 'ALREADY_REDEEMED',
        message: 'This voucher has already been claimed.',
        game_title: 'Celeste',
        redeemed_at: '2026-11-13T20:00:00Z',
      });
    });

    it('handles INVALID_VOUCHER failure payload from RPC', async () => {
      const mockRpcResponse = {
        success: false,
        error: 'INVALID_VOUCHER',
        message: 'Voucher not found.',
      };

      const mockClient = {
        rpc: vi.fn().mockResolvedValue({
          data: mockRpcResponse,
          error: null,
        }),
      } as unknown as SupabaseClient;

      const result = await redeemVoucher('v-unknown', mockClient);

      expect(result).toEqual<RedeemFailure>({
        success: false,
        error: 'INVALID_VOUCHER',
        message: 'Voucher not found.',
      });
    });

    it('returns UNKNOWN failure when RPC call returns network or database error', async () => {
      const mockClient = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection timeout' },
        }),
      } as unknown as SupabaseClient;

      const result = await redeemVoucher('v-timeout', mockClient);

      expect(result).toEqual<RedeemFailure>({
        success: false,
        error: 'UNKNOWN',
        message: 'Connection timeout',
      });
    });
  });

  describe('getGamesWithCounts', () => {
    it('returns games with available and total key counts', async () => {
      const mockGames: Game[] = [
        {
          id: 'g-1',
          title: 'Celeste',
          slug: 'celeste',
          image_url: 'https://example.com/c.png',
          created_at: '2026-01-01',
        },
        {
          id: 'g-2',
          title: 'Hollow Knight',
          slug: 'hollow-knight',
          image_url: null,
          created_at: '2026-01-01',
        },
      ];

      const mockKeys = [
        { id: 'k-1', game_id: 'g-1', status: 'available' },
        { id: 'k-2', game_id: 'g-1', status: 'assigned' },
        { id: 'k-3', game_id: 'g-1', status: 'redeemed' },
        { id: 'k-4', game_id: 'g-2', status: 'available' },
        { id: 'k-5', game_id: 'g-2', status: 'available' },
      ];

      const mockClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'games') {
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockGames,
                  error: null,
                }),
              }),
            };
          }
          if (table === 'game_keys') {
            return {
              select: vi.fn().mockResolvedValue({
                data: mockKeys,
                error: null,
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await getGamesWithCounts(mockClient);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<GameWithInventory>({
        id: 'g-1',
        title: 'Celeste',
        slug: 'celeste',
        image_url: 'https://example.com/c.png',
        created_at: '2026-01-01',
        available_keys: 1,
        total_keys: 3,
      });
      expect(result[1]).toEqual<GameWithInventory>({
        id: 'g-2',
        title: 'Hollow Knight',
        slug: 'hollow-knight',
        image_url: null,
        created_at: '2026-01-01',
        available_keys: 2,
        total_keys: 2,
      });
    });

    it('handles games with 0 keys correctly', async () => {
      const mockGames: Game[] = [
        {
          id: 'g-empty',
          title: 'Tunic',
          slug: 'tunic',
          image_url: null,
          created_at: '2026-01-01',
        },
      ];

      const mockClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'games') {
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockGames,
                  error: null,
                }),
              }),
            };
          }
          if (table === 'game_keys') {
            return {
              select: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await getGamesWithCounts(mockClient);

      expect(result).toEqual<GameWithInventory[]>([
        {
          id: 'g-empty',
          title: 'Tunic',
          slug: 'tunic',
          image_url: null,
          created_at: '2026-01-01',
          available_keys: 0,
          total_keys: 0,
        },
      ]);
    });

    it('throws error when games query fails', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection lost' },
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      await expect(getGamesWithCounts(mockClient)).rejects.toThrow('Database connection lost');
    });
  });

  describe('addGameKeys', () => {
    it('inserts game keys and returns the count inserted', async () => {
      const mockInserted = [{ id: 'k-1' }, { id: 'k-2' }, { id: 'k-3' }];
      const mockClient = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: mockInserted,
              error: null,
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const keysToAdd = ['KEY-1', 'KEY-2', 'KEY-3'];
      const count = await addGameKeys('g-1', keysToAdd, mockClient);

      expect(count).toBe(3);
      expect(mockClient.from).toHaveBeenCalledWith('game_keys');
    });

    it('handles empty keys list and trims whitespace', async () => {
      const mockClient = {
        from: vi.fn(),
      } as unknown as SupabaseClient;

      const count = await addGameKeys('g-1', ['  ', ''], mockClient);

      expect(count).toBe(0);
      expect(mockClient.from).not.toHaveBeenCalled();
    });

    it('throws error if insert fails', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Duplicate key violated' },
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      await expect(addGameKeys('g-1', ['KEY-1'], mockClient)).rejects.toThrow(
        'Duplicate key violated'
      );
    });
  });

  describe('issueVoucher', () => {
    it('selects available key, marks assigned, creates voucher, and returns IssuedVoucher', async () => {
      const mockKey = { id: 'key-available-1' };
      const mockVoucher = {
        id: 'new-voucher-uuid',
        game_id: 'g-1',
        key_id: 'key-available-1',
        created_at: '2026-11-14T02:00:00Z',
      };

      const mockKeySelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockKey,
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockKeyUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const mockVoucherInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockVoucher,
            error: null,
          }),
        }),
      });

      const mockClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'game_keys') {
            return {
              select: mockKeySelect,
              update: mockKeyUpdate,
            };
          }
          if (table === 'vouchers') {
            return {
              insert: mockVoucherInsert,
            };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      const result = await issueVoucher('g-1', mockClient);

      expect(result).toEqual<IssuedVoucher>({
        id: 'new-voucher-uuid',
        game_id: 'g-1',
        key_id: 'key-available-1',
        created_at: '2026-11-14T02:00:00Z',
      });
      expect(mockKeyUpdate).toHaveBeenCalledWith({ status: 'assigned' });
    });

    it('throws error when no available keys exist', async () => {
      const mockKeySelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'No rows found' },
              }),
            }),
          }),
        }),
      });

      const mockClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'game_keys') {
            return { select: mockKeySelect };
          }
          return {};
        }),
      } as unknown as SupabaseClient;

      await expect(issueVoucher('g-1', mockClient)).rejects.toThrow(
        /No available keys/i
      );
    });
  });

  describe('createGame', () => {
    it('creates game with title, slug, and imageUrl', async () => {
      const mockCreatedGame: Game = {
        id: 'g-new',
        title: 'Undertale',
        slug: 'undertale',
        image_url: 'https://example.com/undertale.png',
        created_at: '2026-11-14T00:00:00Z',
      };

      const mockClient = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCreatedGame,
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const game = await createGame(
        'Undertale',
        'undertale',
        'https://example.com/undertale.png',
        mockClient
      );

      expect(game).toEqual<Game>(mockCreatedGame);
    });

    it('throws error when creation fails', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Slug already exists' },
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      await expect(
        createGame('Undertale', 'undertale', undefined, mockClient)
      ).rejects.toThrow('Slug already exists');
    });
  });

  describe('default supabase client usage', () => {
    it('uses default supabase client when no client is passed to getVoucherStatus', async () => {
      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'voucher-default',
                is_redeemed: false,
                redeemed_at: null,
                games: {
                  title: 'Default Game',
                  image_url: null,
                },
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const status = await getVoucherStatus('voucher-default');
      expect(status.game.title).toBe('Default Game');
      expect(fromSpy).toHaveBeenCalledWith('vouchers');
      fromSpy.mockRestore();
    });

    it('uses default supabase client when no client is passed to redeemVoucher', async () => {
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: {
          success: true,
          voucher_id: 'v-default',
          game_title: 'Celeste',
          image_url: null,
          key_code: 'KEY-XYZ',
          redeemed_at: '2026-11-14T01:00:00Z',
        },
        error: null,
      } as any);

      const result = await redeemVoucher('v-default');
      expect(result.success).toBe(true);
      expect(rpcSpy).toHaveBeenCalledWith('redeem_game_voucher', {
        p_voucher_id: 'v-default',
      });
      rpcSpy.mockRestore();
    });
  });
});

describe('supabase client setup', () => {
  it('exports an initialized supabase client instance', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
    expect(typeof supabase.rpc).toBe('function');
  });
});

