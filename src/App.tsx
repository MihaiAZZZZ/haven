import React, { useState, useEffect } from 'react';
import { ClaimPage } from './pages/ClaimPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { QrCode, ShieldCheck, ArrowRight } from 'lucide-react';

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route 1: Claim Route: /claim/:uuid
  if (currentPath.startsWith('/claim/')) {
    const voucherId = currentPath.replace('/claim/', '').split('/')[0];
    return <ClaimPage voucherId={voucherId} />;
  }

  // Route 2: Admin Route: /admin
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    return <AdminPage />;
  }

  // Route 3: Home / Manual Code Entry
  if (currentPath === '/' || currentPath === '') {
    return <HomeClaimEntry />;
  }

  // Fallback 404
  return <NotFoundPage />;
}

// Home Entry View where users can manually enter code or navigate to admin
function HomeClaimEntry() {
  const [manualCode, setManualCode] = useState('');

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (clean) {
      window.location.href = `/claim/${clean}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf0] text-haven-brown-dark font-body flex flex-col justify-between items-center p-6 text-center">
      <div className="w-full max-w-md flex flex-col items-center pt-8">
        {/* Haven Logo & Mascot */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <img
            src="/images/logo.webp"
            alt="Hack Club Haven"
            className="h-14 w-auto object-contain drop-shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/logo.webp';
            }}
          />
          <img
            src="/images/daven.webp"
            alt="Daven"
            className="w-24 h-auto drop-shadow-md my-2"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/daven.webp';
            }}
          />
          <h1 className="font-display text-2xl text-haven-orange-deep">
            Competition Prize Station
          </h1>
          <p className="text-xs text-haven-brown-light max-w-xs leading-relaxed">
            Scan your printed card's QR code with your phone camera, or enter your voucher UUID below to claim your game key!
          </p>
        </div>

        {/* Manual Voucher Input Card */}
        <div className="bg-white border-2 border-haven-brown-dark/20 rounded-3xl p-6 shadow-card w-full flex flex-col gap-4">
          <form onSubmit={handleLookup} className="flex flex-col gap-3">
            <label className="text-left text-xs font-display text-haven-brown-dark flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-haven-orange-deep" />
              <span>Enter Voucher UUID</span>
            </label>
            <input
              type="text"
              required
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              className="w-full bg-[#faf5ea] border border-haven-brown-light/40 rounded-2xl px-4 py-3 text-sm font-mono text-haven-brown-dark placeholder-haven-brown-light/60 focus:outline-none focus:border-haven-orange-deep shadow-xs"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full py-3.5 px-4 bg-haven-orange-deep hover:bg-haven-orange-bright active:translate-y-0.5 text-white font-display text-base rounded-2xl shadow-tactile active:shadow-tactile-active transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Verify & Claim Game</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-haven-brown-light/20 flex flex-col gap-2">
            <a
              href="/admin"
              className="flex items-center justify-center gap-1.5 text-xs font-display text-haven-brown-dark hover:text-haven-orange-deep bg-haven-butter/40 hover:bg-haven-butter py-2.5 px-3 rounded-xl transition-colors border border-haven-brown-dark/10"
            >
              <ShieldCheck className="w-4 h-4 text-haven-orange-deep" />
              <span>Organizer Admin & Card Dispenser</span>
            </a>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-[11px] text-haven-brown-light">
        Hack Club Haven • Official Game Prize Withdrawal
      </footer>
    </div>
  );
}

export default App;
