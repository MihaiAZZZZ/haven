import React, { useState } from 'react';
import { X, KeyRound, Loader2, Check } from 'lucide-react';
import { addGameKeys } from '../../services/voucherService';
import type { GameWithInventory } from '../../types/database';

interface AddKeysModalProps {
  game: GameWithInventory;
  onClose: () => void;
  onKeysAdded: (count: number) => void;
}

export const AddKeysModal: React.FC<AddKeysModalProps> = ({
  game,
  onClose,
  onKeysAdded,
}) => {
  const [keysText, setKeysText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawLines = keysText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rawLines.length === 0 || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const insertedCount = await addGameKeys(game.id, rawLines);
      onKeysAdded(insertedCount);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to import keys.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fffbf0] border-2 border-haven-brown-dark rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-haven-butter/60 text-haven-brown-dark transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-haven-orange-deep font-display text-lg mb-1">
          <KeyRound className="w-5 h-5" />
          <span>Add Keys for {game.title}</span>
        </div>

        <p className="text-xs text-haven-brown-light mb-4">
          Paste your batch of game keys below (one key per line). These keys remain encrypted and private until redeemed.
        </p>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between text-xs font-display text-haven-brown-dark mb-1">
              <span>Game Keys (One per line)</span>
              <span className="text-haven-orange-deep font-mono">
                {rawLines.length} keys detected
              </span>
            </div>
            <textarea
              rows={8}
              required
              value={keysText}
              onChange={(e) => setKeysText(e.target.value)}
              placeholder="3E92B-W8VKL-92MNK&#10;890ZA-PLMKJ-78TYU&#10;..."
              className="w-full bg-white border border-haven-brown-light/40 rounded-xl p-3 text-xs font-mono text-haven-brown-dark focus:outline-none focus:border-haven-orange-deep shadow-xs resize-none"
            />
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white border border-haven-brown-light/50 text-haven-brown-dark font-display text-sm rounded-xl hover:bg-haven-butter/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rawLines.length === 0}
              className="flex-1 py-2.5 px-4 bg-haven-orange-deep hover:bg-haven-orange-bright text-white font-display text-sm rounded-xl shadow-tactile active:translate-y-0.5 active:shadow-tactile-active transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Import {rawLines.length} Keys</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
