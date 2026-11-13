import React, { useState, useEffect } from 'react';
import { ClaimPage } from './pages/ClaimPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CameraQrScanner } from './components/scanner/CameraQrScanner';
import { QrCode, ArrowRight, X } from 'lucide-react';

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

// Home Entry View with the big QR button and "(cant scan)" manual input option
function HomeClaimEntry({ onNavigate }: HomeClaimEntryProps) {
  const [manualCode, setManualCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

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
      <div className="w-full max-w-md flex flex-col items-center pt-8">
        {/* Haven Logo & Mascot */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <img
            src="/images/haven-logo-color.webp"
            alt="Hack Club Haven"
            className="h-16 w-auto object-contain drop-shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/logo.webp';
            }}
          />
          <img
            src="/images/daven.webp"
            alt="Daven"
            className="w-28 h-auto drop-shadow-md my-2"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/daven.webp';
            }}
          />
          <h1 className="font-display text-2xl text-haven-orange-deep mt-1">
            Redeem Your Won Games
          </h1>
          <p className="text-xs text-haven-brown-light max-w-xs leading-relaxed">
            Have a printed paper game voucher from our competition? Scan it below to withdraw your key!
          </p>
        </div>

        {/* Big Square Button with QR Code Icon Only (No Text) */}
        <div className="w-full flex flex-col items-center gap-3 my-2">
          <button
            onClick={() => setShowScanner(true)}
            aria-label="Scan QR Code"
            className="w-48 h-48 sm:w-56 sm:h-56 aspect-square bg-haven-orange-deep hover:bg-haven-orange-bright active:translate-y-1 text-white rounded-3xl shadow-tactile active:shadow-tactile-active transition-all flex items-center justify-center cursor-pointer group"
          >
            <QrCode className="w-24 h-24 sm:w-28 sm:h-28 text-white group-hover:scale-105 transition-transform" />
          </button>

          {/* Little text under it: (cant scan) to input the code manually */}
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-xs text-haven-brown-light hover:text-haven-orange-deep font-display underline transition-colors cursor-pointer py-1.5"
          >
            {showManualInput ? '(close manual input)' : '(cant scan) to input the code manually'}
          </button>

          {/* Expandable Manual Code Input */}
          {showManualInput && (
            <div className="bg-white border-2 border-haven-brown-dark/20 rounded-3xl p-4 shadow-sm w-full flex flex-col gap-2 mt-1 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-left">
                <span className="text-xs font-display text-haven-brown-dark">
                  Enter Voucher UUID
                </span>
                <button
                  onClick={() => setShowManualInput(false)}
                  className="text-haven-brown-light hover:text-haven-brown-dark p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleManualLookup} className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste UUID code here..."
                  className="w-full bg-[#faf5ea] border border-haven-brown-light/40 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-haven-brown-dark placeholder-haven-brown-light/60 focus:outline-none focus:border-haven-orange-deep shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="py-2.5 px-4 bg-haven-orange-deep hover:bg-haven-orange-bright text-white font-display text-xs rounded-2xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1 shrink-0"
                >
                  <span>Go</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Hidden Admin: Organizers navigate directly to /admin */}
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
