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

export interface GameKey {
  id: string;
  game_id: string;
  key_code: string;
  status: 'available' | 'assigned' | 'redeemed';
  created_at: string;
}

export interface Voucher {
  id: string;
  game_id: string;
  key_id: string;
  is_redeemed: boolean;
  redeemed_at: string | null;
  created_at: string;
}

export interface IssuedVoucher {
  id: string;
  game_id: string;
  key_id?: string;
  created_at?: string;
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
