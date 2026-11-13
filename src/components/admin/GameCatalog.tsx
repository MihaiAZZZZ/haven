import React, { useState } from 'react';
import type { GameWithInventory, Game } from '../../types/database';
import { AddGameModal } from './AddGameModal';
import { AddKeysModal } from './AddKeysModal';
import { Plus, KeyRound } from 'lucide-react';

interface GameCatalogProps {
  games: GameWithInventory[];
  onRefresh: () => void;
}

export const GameCatalog: React.FC<GameCatalogProps> = ({ games, onRefresh }) => {
  const [showAddGame, setShowAddGame] = useState(false);
  const [selectedGameForKeys, setSelectedGameForKeys] = useState<GameWithInventory | null>(null);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-haven-brown-light/30 pb-3">
        <div>
          <h2 className="font-display text-xl text-haven-brown-dark">
            Game Inventory & Key Pools
          </h2>
          <p className="text-xs text-haven-brown-light mt-0.5">
            Manage your game titles and load batches of activation keys.
          </p>
        </div>

        <button
          onClick={() => setShowAddGame(true)}
          className="self-start sm:self-auto py-2 px-4 bg-haven-orange-deep hover:bg-haven-orange-bright active:translate-y-0.5 text-white font-display text-xs rounded-xl shadow-tactile active:shadow-tactile-active transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Game</span>
        </button>
      </div>

      {games.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-haven-brown-light/40 rounded-3xl p-8 text-center flex flex-col items-center gap-3">
          <span className="text-3xl">📦</span>
          <p className="font-display text-base text-haven-brown-dark">
            No games in catalog yet
          </p>
          <button
            onClick={() => setShowAddGame(true)}
            className="py-2 px-4 bg-haven-orange-deep text-white font-display text-xs rounded-xl shadow-sm"
          >
            Create Your First Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-white border-2 border-haven-brown-dark/20 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {game.image_url ? (
                  <img
                    src={game.image_url}
                    alt={game.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-haven-brown-light/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-haven-butter flex items-center justify-center text-xl shrink-0">
                    🎮
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-display text-base text-haven-brown-dark truncate">
                    {game.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span className="font-mono text-haven-green-deep font-bold">
                      {game.available_keys} available
                    </span>
                    <span className="text-haven-brown-light">/</span>
                    <span className="font-mono text-haven-brown-dark">
                      {game.total_keys} total
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedGameForKeys(game)}
                className="py-2 px-3 bg-haven-butter/60 hover:bg-haven-butter border border-haven-brown-dark/20 text-haven-brown-dark font-display text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-haven-orange-deep" />
                <span>+ Add Keys</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddGame && (
        <AddGameModal
          onClose={() => setShowAddGame(false)}
          onGameAdded={(_newGame: Game) => {
            onRefresh();
          }}
        />
      )}

      {selectedGameForKeys && (
        <AddKeysModal
          game={selectedGameForKeys}
          onClose={() => setSelectedGameForKeys(null)}
          onKeysAdded={(_count: number) => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
