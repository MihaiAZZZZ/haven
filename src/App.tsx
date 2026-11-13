import React, { useState, useEffect } from 'react';
import { ClaimPage } from './pages/ClaimPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CameraQrScanner } from './components/scanner/CameraQrScanner';
import { Camera, QrCode, ShieldCheck, ArrowRight } from 'lucide-react';

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Route 1: Claim Route: /claim/:uuid
  if (currentPath.startsWith('/claim/')) {
    const voucherId = currentPath.replace('/claim/', '').split('/')[0];
    return <ClaimPage voucherId={voucherId} />;
  }

  // Route 2: Admin Route: /admin
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    return <AdminPage />;
  }

  // Route 3: Home / Scanner Landing
  if (currentPath === '/' || currentPath === '') {
    return <HomeClaimEntry onNavigate={navigateTo} />;
  }

  // Fallback 404
  return <NotFoundPage />;
}

interface HomeClaimEntryProps {
  onNavigate: (path: string) => void;
}

// Home Entry View where attendees can tap to scan with camera or manually enter UUID
function HomeClaimEntry({ onNavigate }: HomeClaimEntryProps) {
  const [manualCode, setManualCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (clean) {
      onNavigate(`/claim/${clean}`);
    }
  };

  const handleScanSuccess = (uuid: string) => {
    setShowScanner(false);
    onNavigate(`/claim/${uuid}`);
  };

  return (
    <div className="min-h-screen bg-[#fffbf0] text-haven-brown-dark font-body flex flex-col justify-between items-center p-6 text-center">
      <div className="w-full max-w-md flex flex-col items-center pt-6">
        {/* Haven Logo & Mascot */}
        <div className="flex flex-col items-center gap-2 mb-6">
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
            className="w-24 h-auto drop-shadow-md my-1"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/daven.webp';
            }}
          />
          <h1 className="font-display text-2xl text-haven-orange-deep">
            Redeem Your Won Games
          </h1>
          <p className="text-xs text-haven-brown-light max-w-xs leading-relaxed">
            Have a printed paper game voucher from our competition? Scan it below to withdraw your key!
          </p>
        </div>

        {/* Primary Action: Big Camera Scanner Button */}
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => setShowScanner(true)}
            className="w-full py-5 px-6 bg-haven-orange-deep hover:bg-haven-orange-bright active:translate-y-0.5 text-white font-display text-xl rounded-3xl shadow-tactile active:shadow-tactile-active transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            <div className="p-2 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <span>Scan Paper QR Code</span>
          </button>

          {/* Secondary: Manual Code Entry */}
          <div className="bg-white border-2 border-haven-brown-dark/20 rounded-3xl p-5 shadow-sm w-full flex flex-col gap-3">
            <span className="text-xs font-display text-haven-brown-light uppercase tracking-wider">
              Or Enter Voucher Code
            </span>

            <form onSubmit={handleManualLookup} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste UUID code here..."
                  className="w-full bg-[#faf5ea] border border-haven-brown-light/40 rounded-2xl pl-9 pr-3 py-2.5 text-xs font-mono text-haven-brown-dark placeholder-haven-brown-light/60 focus:outline-none focus:border-haven-orange-deep shadow-xs"
                />
                <QrCode className="w-4 h-4 text-haven-brown-light absolute left-3 top-3 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="py-2.5 px-4 bg-haven-butter hover:bg-haven-yellow text-haven-brown-dark font-display text-xs rounded-2xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1 shrink-0"
              >
                <span>Go</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Admin Navigation Shortcut */}
          <a
            href="/admin"
            className="flex items-center justify-center gap-1.5 text-xs font-display text-haven-brown-dark hover:text-haven-orange-deep bg-white border border-haven-brown-light/30 hover:bg-haven-butter/30 py-3 px-4 rounded-2xl transition-colors shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-haven-orange-deep" />
            <span>Organizer Portal & Card Dispenser</span>
          </a>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      {showScanner && (
        <CameraQrScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-8 text-[11px] text-haven-brown-light">
        Hack Club Haven • Official Game Prize Withdrawal
      </footer>
    </div>
  );
}

export default App;
