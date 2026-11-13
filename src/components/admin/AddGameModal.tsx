import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { createGame } from '../../services/voucherService';
import type { Game } from '../../types/database';

interface AddGameModalProps {
  onClose: () => void;
  onGameAdded: (game: Game) => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({ onClose, onGameAdded }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const newGame = await createGame(title.trim(), slug.trim(), imageUrl.trim() || undefined);
      onGameAdded(newGame);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create game.');
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

        <h2 className="font-display text-xl text-haven-brown-dark mb-1">
          Add New Game Title 🎮
        </h2>
        <p className="text-xs text-haven-brown-light mb-4">
          Register a game title to start loading keys and printing cards.
        </p>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-display text-haven-brown-dark mb-1">
              Game Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Celeste, Hollow Knight, Undertale"
              className="w-full bg-white border border-haven-brown-light/40 rounded-xl px-3.5 py-2.5 text-sm font-body text-haven-brown-dark focus:outline-none focus:border-haven-orange-deep shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-display text-haven-brown-dark mb-1">
              Slug Identifier
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="celeste"
              className="w-full bg-white border border-haven-brown-light/40 rounded-xl px-3.5 py-2 text-sm font-mono text-haven-brown-dark focus:outline-none focus:border-haven-orange-deep shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-display text-haven-brown-dark mb-1">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://.../cover.png"
              className="w-full bg-white border border-haven-brown-light/40 rounded-xl px-3.5 py-2.5 text-sm font-body text-haven-brown-dark focus:outline-none focus:border-haven-orange-deep shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white border border-haven-brown-light/50 text-haven-brown-dark font-display text-sm rounded-xl hover:bg-haven-butter/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex-1 py-2.5 px-4 bg-haven-orange-deep hover:bg-haven-orange-bright text-white font-display text-sm rounded-xl shadow-tactile active:translate-y-0.5 active:shadow-tactile-active transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Game</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
