import React, { useEffect, useState } from 'react';
import { getGamesWithCounts } from '../services/voucherService';
import type { GameWithInventory } from '../types/database';
import { VoucherDispenser } from '../components/admin/VoucherDispenser';
import { GameCatalog } from '../components/admin/GameCatalog';
import { Ticket, Package, RefreshCw, Loader2 } from 'lucide-react';
import '../styles/print.css';

export const AdminPage: React.FC = () => {
  const [games, setGames] = useState<GameWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dispenser' | 'inventory'>('dispenser');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await getGamesWithCounts();
      setGames(data);
    } catch (err: unknown) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const totalAvailable = games.reduce((acc, g) => acc + g.available_keys, 0);
  const totalKeys = games.reduce((acc, g) => acc + g.total_keys, 0);

  return (
    <div className="min-h-screen bg-[#fffbf0] text-haven-brown-dark font-body pb-12">
      {/* Top Navigation */}
      <header className="bg-white border-b border-haven-brown-light/30 px-4 py-3 sticky top-0 z-20 shadow-xs print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <img
                src="/images/logo.webp"
                alt="Hack Club Haven"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/logo.webp';
                }}
              />
            </a>
            <span className="text-haven-brown-light">|</span>
            <span className="font-display text-sm text-haven-orange-deep bg-haven-butter/50 px-2.5 py-0.5 rounded-full">
              Organizer Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchInventory}
              disabled={loading}
              className="p-2 rounded-xl text-haven-brown-dark hover:bg-haven-butter/40 transition-colors"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <a
              href="/"
              className="text-xs font-display text-haven-brown-dark hover:text-haven-orange-deep underline"
            >
              Public Claim View
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6 print:hidden">
          <div className="bg-white border border-haven-brown-light/30 rounded-2xl p-3.5 shadow-xs flex flex-col">
            <span className="text-[11px] font-display text-haven-brown-light uppercase">
              Total Games
            </span>
            <span className="font-display text-2xl text-haven-brown-dark">
              {games.length}
            </span>
          </div>

          <div className="bg-white border border-haven-brown-light/30 rounded-2xl p-3.5 shadow-xs flex flex-col">
            <span className="text-[11px] font-display text-haven-green-deep uppercase">
              Available Keys
            </span>
            <span className="font-display text-2xl text-haven-green-deep">
              {totalAvailable}
            </span>
          </div>

          <div className="bg-white border border-haven-brown-light/30 rounded-2xl p-3.5 shadow-xs flex flex-col">
            <span className="text-[11px] font-display text-haven-orange-deep uppercase">
              Total Pool
            </span>
            <span className="font-display text-2xl text-haven-orange-deep">
              {totalKeys}
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mb-6 border-b border-haven-brown-light/30 pb-2 print:hidden">
          <button
            onClick={() => setActiveTab('dispenser')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-display text-sm transition-all cursor-pointer ${
              activeTab === 'dispenser'
                ? 'bg-haven-orange-deep text-white shadow-tactile'
                : 'bg-white text-haven-brown-dark hover:bg-haven-butter/40 border border-haven-brown-light/30'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Voucher Dispenser (Buttons)</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-display text-sm transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-haven-orange-deep text-white shadow-tactile'
                : 'bg-white text-haven-brown-dark hover:bg-haven-butter/40 border border-haven-brown-light/30'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Game Inventory & Keys</span>
          </button>
        </div>

        {/* Content */}
        {loading && games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-haven-orange-deep animate-spin" />
            <p className="font-display text-sm text-haven-brown-dark">
              Loading inventory...
            </p>
          </div>
        ) : (
          <div>
            {activeTab === 'dispenser' && (
              <VoucherDispenser games={games} onVoucherIssued={fetchInventory} />
            )}
            {activeTab === 'inventory' && (
              <GameCatalog games={games} onRefresh={fetchInventory} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
