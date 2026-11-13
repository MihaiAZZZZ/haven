import React, { useState } from 'react';
import type { GameWithInventory } from '../../types/database';
import { issueVoucher } from '../../services/voucherService';
import { PrintModal } from '../print/PrintModal';
import { Ticket, Loader2, AlertCircle } from 'lucide-react';

interface VoucherDispenserProps {
  games: GameWithInventory[];
  onVoucherIssued: () => void;
}

export const VoucherDispenser: React.FC<VoucherDispenserProps> = ({
  games,
  onVoucherIssued,
}) => {
  const [issuingGameId, setIssuingGameId] = useState<string | null>(null);
  const [issuedVoucher, setIssuedVoucher] = useState<{
    voucherId: string;
    gameTitle: string;
    imageUrl?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrawVoucher = async (game: GameWithInventory) => {
    if (game.available_keys <= 0 || issuingGameId) return;

    setIssuingGameId(game.id);
    setError(null);

    try {
      const voucher = await issueVoucher(game.id);
      setIssuedVoucher({
        voucherId: voucher.id,
        gameTitle: game.title,
        imageUrl: game.image_url,
      });
      onVoucherIssued();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to issue voucher for ${game.title}.`
      );
    } finally {
      setIssuingGameId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-haven-brown-light/30 pb-3">
        <div>
          <h2 className="font-display text-xl text-haven-brown-dark flex items-center gap-2">
            <Ticket className="w-6 h-6 text-haven-orange-deep" />
            <span>Instant Voucher Dispenser</span>
          </h2>
          <p className="text-xs text-haven-brown-light mt-0.5">
            Press any game button to pair an available key, generate a unique single-use QR voucher, and print the card.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {games.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-haven-brown-light/40 rounded-3xl p-8 text-center flex flex-col items-center gap-2">
          <span className="text-3xl">🎮</span>
          <p className="font-display text-base text-haven-brown-dark">
            No games added yet!
          </p>
          <p className="text-xs text-haven-brown-light">
            Go to the Game Catalog tab to add games and game keys.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => {
            const isOutOfKeys = game.available_keys <= 0;
            const isThisIssuing = issuingGameId === game.id;

            return (
              <button
                key={game.id}
                onClick={() => handleDrawVoucher(game)}
                disabled={isOutOfKeys || Boolean(issuingGameId)}
                className={`relative group p-4 rounded-3xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                  isOutOfKeys
                    ? 'bg-haven-butter/20 border-haven-brown-light/30 opacity-60 cursor-not-allowed'
                    : 'bg-white border-haven-brown-dark/20 hover:border-haven-orange-deep hover:bg-haven-butter/10 shadow-tactile active:translate-y-0.5 active:shadow-tactile-active'
                }`}
              >
                {/* Game Icon / Image */}
                {game.image_url ? (
                  <img
                    src={game.image_url}
                    alt={game.title}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-haven-brown-light/30 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-haven-orange-deep text-white font-display text-2xl flex items-center justify-center shrink-0 shadow-xs">
                    🎮
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base text-haven-brown-dark truncate group-hover:text-haven-orange-deep transition-colors">
                    {game.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isOutOfKeys
                          ? 'bg-red-100 text-red-700'
                          : 'bg-haven-green/20 text-haven-green-deep'
                      }`}
                    >
                      {game.available_keys} left
                    </span>
                    <span className="text-[11px] text-haven-brown-light">
                      ({game.total_keys} total)
                    </span>
                  </div>
                </div>

                {/* Action Indicator */}
                <div className="shrink-0">
                  {isThisIssuing ? (
                    <div className="p-2 bg-haven-orange-deep/10 text-haven-orange-deep rounded-2xl">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-haven-orange-deep group-hover:bg-haven-orange-bright text-white text-xs font-display rounded-xl shadow-xs transition-colors">
                      + Print
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Print Modal */}
      {issuedVoucher && (
        <PrintModal
          voucherId={issuedVoucher.voucherId}
          gameTitle={issuedVoucher.gameTitle}
          imageUrl={issuedVoucher.imageUrl}
          onClose={() => setIssuedVoucher(null)}
        />
      )}
    </div>
  );
};
