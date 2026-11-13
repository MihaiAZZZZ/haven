import React, { useEffect, useState } from 'react';
import { getGamesWithCounts } from '../services/voucherService';
import type { GameWithInventory } from '../types/database';
import { VoucherDispenser } from '../components/admin/VoucherDispenser';
import { GameCatalog } from '../components/admin/GameCatalog';
import { Ticket, Package, RefreshCw, Loader2, Lock, LogOut, KeyRound } from 'lucide-react';
import '../styles/print.css';

export const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('haven_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [games, setGames] = useState<GameWithInventory[]>([]);
  const [loading, setLoading] = useState(false);
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
    if (isAuthenticated) {
      fetchInventory();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'haven2026';

    if (passwordInput === expectedPassword) {
      sessionStorage.setItem('haven_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Incorrect organizer password. Access denied.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('haven_admin_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // If not authenticated, render password lock screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fffbf0] text-haven-brown-dark font-body flex flex-col justify-between items-center p-6 text-center">
        <div className="w-full max-w-sm flex flex-col items-center pt-10">
          <img
            src="/images/haven-logo-color.webp"
            alt="Hack Club Haven"
            className="h-14 w-auto object-contain drop-shadow-sm mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/logo.webp';
            }}
          />

          <div className="relative mb-4">
            <img
              src="/images/daven.webp"
              alt="Daven"
              className="w-24 h-auto drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/daven.webp';
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-haven-orange-deep text-white p-1.5 rounded-full shadow-md">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <h1 className="font-display text-2xl text-haven-orange-deep mb-1">
            Organizer Access Only
          </h1>
          <p className="text-xs text-haven-brown-light max-w-xs leading-relaxed mb-6">
            Enter your organizer password to unlock the game voucher dispenser and inventory dashboard.
          </p>

          <div className="bg-white border-2 border-haven-brown-dark/20 rounded-3xl p-6 shadow-card w-full flex flex-col gap-3">
            {authError && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-xl text-xs font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter organizer password..."
                  className="w-full bg-[#faf5ea] border border-haven-brown-light/40 rounded-2xl pl-10 pr-4 py-3 text-sm font-body text-haven-brown-dark placeholder-haven-brown-light/60 focus:outline-none focus:border-haven-orange-deep shadow-xs"
                />
                <KeyRound className="w-4 h-4 text-haven-brown-light absolute left-3.5 top-3.5 pointer-events-none" />
              </div>

              <button
                type="submit"
                disabled={!passwordInput}
                className="w-full py-3.5 px-4 bg-haven-orange-deep hover:bg-haven-orange-bright active:translate-y-0.5 text-white font-display text-sm rounded-2xl shadow-tactile active:shadow-tactile-active transition-all cursor-pointer disabled:opacity-50"
              >
                Unlock Dashboard
              </button>
            </form>

            <a
              href="/"
              className="text-xs text-haven-brown-light hover:text-haven-orange-deep underline font-display mt-2"
            >
              Back to Player Redemption
            </a>
          </div>
        </div>
      </div>
    );
  }

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
                src="/images/haven-logo-color.webp"
                alt="Hack Club Haven"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/logo.webp';
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
              className="p-2 rounded-xl text-haven-brown-dark hover:bg-haven-butter/40 transition-colors cursor-pointer"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-display text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
              title="Log out of organizer dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
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
