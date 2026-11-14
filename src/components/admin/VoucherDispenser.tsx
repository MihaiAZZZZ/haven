import React, { useState } from 'react';
import type { GameWithInventory } from '../../types/database';
import { issueVoucher } from '../../services/voucherService';
import { PrintModal, type PrintableVoucherItem } from '../print/PrintModal';
import { Ticket, Loader2, AlertCircle, Printer, Layers, Plus, Minus, Trash2 } from 'lucide-react';

interface VoucherDispenserProps {
  games: GameWithInventory[];
  onVoucherIssued: () => void;
}

export const VoucherDispenser: React.FC<VoucherDispenserProps> = ({
  games,
  onVoucherIssued,
}) => {
  const [issuingGameId, setIssuingGameId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [printQueue, setPrintQueue] = useState<PrintableVoucherItem[]>([]);
  const [modalVouchers, setModalVouchers] = useState<PrintableVoucherItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getQuantity = (gameId: string, maxAvailable: number) => {
    const q = quantities[gameId] ?? 1;
    return Math.min(Math.max(1, q), Math.max(1, maxAvailable));
  };

  const setQuantity = (gameId: string, qty: number, maxAvailable: number) => {
    const safeQty = Math.min(Math.max(1, qty), maxAvailable);
    setQuantities((prev) => ({ ...prev, [gameId]: safeQty }));
  };

  // Dispenses N vouchers for a game and either opens them in modal or adds to queue
  const handleIssueBatch = async (
    game: GameWithInventory,
    count: number,
    action: 'print-now' | 'add-to-queue'
  ) => {
    if (game.available_keys <= 0 || issuingGameId) return;

    const actualCount = Math.min(count, game.available_keys);
    if (actualCount <= 0) return;

    setIssuingGameId(game.id);
    setError(null);

    const newlyIssued: PrintableVoucherItem[] = [];

    try {
      for (let i = 0; i < actualCount; i++) {
        const voucher = await issueVoucher(game.id);
        newlyIssued.push({
          voucherId: voucher.id,
          gameTitle: game.title,
          imageUrl: game.image_url,
        });
      }

      onVoucherIssued();

      if (action === 'print-now') {
        setModalVouchers(newlyIssued);
      } else {
        setPrintQueue((prev) => [...prev, ...newlyIssued]);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to issue vouchers for ${game.title}.`
      );
      if (newlyIssued.length > 0) {
        if (action === 'print-now') {
          setModalVouchers(newlyIssued);
        } else {
          setPrintQueue((prev) => [...prev, ...newlyIssued]);
        }
      }
    } finally {
      setIssuingGameId(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-haven-brown-light/30 pb-3">
        <div>
          <h2 className="font-display text-xl text-haven-brown-dark flex items-center gap-2">
            <Ticket className="w-6 h-6 text-haven-orange-deep" />
            <span>Voucher Dispenser & Multi-Card Printing</span>
          </h2>
          <p className="text-xs text-haven-brown-light mt-0.5">
            Print single cards or combine multiple cards from any game into a multi-card print sheet.
          </p>
        </div>

        {/* Print Queue Status / Trigger */}
        {printQueue.length > 0 && (
          <div className="flex items-center gap-2 bg-white border-2 border-haven-orange-deep/40 rounded-2xl p-2 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 px-2">
              <Layers className="w-4 h-4 text-haven-orange-deep" />
              <span className="font-display text-xs text-haven-brown-dark">
                {printQueue.length} {printQueue.length === 1 ? 'card' : 'cards'} on sheet
              </span>
            </div>

            <button
              onClick={() => setModalVouchers(printQueue)}
              className="py-1.5 px-3 bg-haven-orange-deep hover:bg-haven-orange-bright text-white font-display text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Preview & Print Sheet</span>
            </button>

            <button
              onClick={() => setPrintQueue([])}
              className="p-1.5 text-haven-brown-light hover:text-red-600 rounded-lg transition-colors cursor-pointer"
              title="Clear print sheet"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
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
            const qty = getQuantity(game.id, game.available_keys);

            return (
              <div
                key={game.id}
                className={`p-4 rounded-3xl border-2 flex flex-col gap-3 transition-all ${
                  isOutOfKeys
                    ? 'bg-haven-butter/20 border-haven-brown-light/30 opacity-60'
                    : 'bg-white border-haven-brown-dark/20 shadow-tactile'
                }`}
              >
                {/* Game Top Info */}
                <div className="flex items-center gap-3">
                  {game.image_url ? (
                    <img
                      src={game.image_url}
                      alt={game.title}
                      className="w-13 h-13 rounded-2xl object-cover shrink-0 border border-haven-brown-light/30 shadow-xs"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-2xl bg-haven-orange-deep text-white font-display text-xl flex items-center justify-center shrink-0 shadow-xs">
                      🎮
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base text-haven-brown-dark truncate">
                      {game.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
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
                </div>

                {/* Quantity Controls & Quick Presets */}
                {!isOutOfKeys && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-haven-brown-light/20">
                    <span className="text-xs font-display text-haven-brown-light">Quantity:</span>

                    <div className="flex items-center gap-1 bg-[#faf5ea] border border-haven-brown-light/30 rounded-xl p-1">
                      <button
                        onClick={() => setQuantity(game.id, qty - 1, game.available_keys)}
                        disabled={qty <= 1 || isThisIssuing}
                        className="p-1 hover:bg-haven-butter/60 rounded-lg text-haven-brown-dark disabled:opacity-30 cursor-pointer"
                        title="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min={1}
                        max={game.available_keys}
                        value={qty}
                        onChange={(e) => setQuantity(game.id, parseInt(e.target.value) || 1, game.available_keys)}
                        disabled={isThisIssuing}
                        className="w-10 text-center font-mono font-bold text-xs bg-transparent text-haven-brown-dark focus:outline-none"
                      />

                      <button
                        onClick={() => setQuantity(game.id, qty + 1, game.available_keys)}
                        disabled={qty >= game.available_keys || isThisIssuing}
                        className="p-1 hover:bg-haven-butter/60 rounded-lg text-haven-brown-dark disabled:opacity-30 cursor-pointer"
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick presets if multiple keys available */}
                    {game.available_keys >= 4 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQuantity(game.id, 4, game.available_keys)}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border cursor-pointer ${
                            qty === 4
                              ? 'bg-haven-orange-deep text-white border-haven-orange-deep'
                              : 'bg-white text-haven-brown-dark border-haven-brown-light/30 hover:bg-haven-butter/30'
                          }`}
                        >
                          4
                        </button>
                        {game.available_keys >= 6 && (
                          <button
                            onClick={() => setQuantity(game.id, 6, game.available_keys)}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border cursor-pointer ${
                              qty === 6
                                ? 'bg-haven-orange-deep text-white border-haven-orange-deep'
                                : 'bg-white text-haven-brown-dark border-haven-brown-light/30 hover:bg-haven-butter/30'
                            }`}
                          >
                            6
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleIssueBatch(game, qty, 'print-now')}
                    disabled={isOutOfKeys || Boolean(issuingGameId)}
                    className="flex-1 py-2.5 px-3 bg-haven-orange-deep hover:bg-haven-orange-bright active:translate-y-0.5 text-white font-display text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isThisIssuing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print {qty > 1 ? `${qty} Cards` : 'Now'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleIssueBatch(game, qty, 'add-to-queue')}
                    disabled={isOutOfKeys || Boolean(issuingGameId)}
                    className="py-2.5 px-3 bg-white border border-haven-brown-light/40 hover:border-haven-orange-deep hover:bg-haven-butter/20 text-haven-brown-dark font-display text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                    title="Add to multi-game print sheet"
                  >
                    <Plus className="w-3.5 h-3.5 text-haven-orange-deep" />
                    <span>Sheet</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Print Modal for Single or Multiple Vouchers */}
      {modalVouchers && modalVouchers.length > 0 && (
        <PrintModal
          vouchers={modalVouchers}
          onClose={() => setModalVouchers(null)}
          onRemoveVoucher={(removedId) => {
            setPrintQueue((prev) => prev.filter((item) => item.voucherId !== removedId));
          }}
        />
      )}
    </div>
  );
};
