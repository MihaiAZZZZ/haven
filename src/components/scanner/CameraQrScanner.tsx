import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

interface CameraQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  onScanSuccess,
  onClose,
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'haven-qr-reader';

  useEffect(() => {
    let isMounted = true;
    const scanner = new Html5Qrcode(scannerContainerId);
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        setIsStarting(true);
        setScannerError(null);

        await scanner.start(
          { facingMode: 'environment' }, // prefer rear camera on mobile
          {
            fps: 15,
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (isMounted) {
              // Extract UUID if a full URL was scanned
              let uuid = decodedText.trim();
              if (uuid.includes('/claim/')) {
                uuid = uuid.split('/claim/')[1].split('/')[0].split('?')[0];
              }

              // Stop scanner and notify parent
              scanner
                .stop()
                .then(() => {
                  scanner.clear();
                  onScanSuccess(uuid);
                })
                .catch(() => {
                  onScanSuccess(uuid);
                });
            }
          },
          () => {
            // Frame scan without detection - ignore
          }
        );

        if (isMounted) {
          setIsStarting(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setIsStarting(false);
          const msg =
            err instanceof Error
              ? err.message
              : 'Unable to access camera. Please allow camera permissions in your browser.';
          setScannerError(msg);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scanner.isScanning) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [onScanSuccess]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121214] flex flex-col items-center justify-between p-4 font-body animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-end pt-2 pb-3 text-white">
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close scanner"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Viewfinder Center */}
      <div className="w-full max-w-sm flex flex-col items-center my-auto">
        {/* Single Clean Camera Target Container */}
        <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] rounded-3xl overflow-hidden border-2 border-haven-orange-deep shadow-2xl bg-black flex items-center justify-center">
          <div id={scannerContainerId} className="w-full h-full object-cover" />

          {/* Clean Viewfinder Corner Markers */}
          <div className="pointer-events-none absolute inset-3 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="w-6 h-6 border-t-3 border-l-3 border-haven-orange-bright rounded-tl-lg" />
              <div className="w-6 h-6 border-t-3 border-r-3 border-haven-orange-bright rounded-tr-lg" />
            </div>
            <div className="flex justify-between">
              <div className="w-6 h-6 border-b-3 border-l-3 border-haven-orange-bright rounded-bl-lg" />
              <div className="w-6 h-6 border-b-3 border-r-3 border-haven-orange-bright rounded-br-lg" />
            </div>
          </div>

          {/* Starting State */}
          {isStarting && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 className="w-7 h-7 text-haven-orange-bright animate-spin" />
              <span className="font-display text-xs tracking-wide">Starting Camera...</span>
            </div>
          )}
        </div>

        {/* Error message if permission denied */}
        {scannerError && (
          <div className="mt-4 bg-red-900/90 border border-red-500 text-red-100 px-4 py-3 rounded-2xl text-xs flex flex-col items-center text-center gap-2 max-w-xs">
            <div className="flex items-center gap-1.5 font-display text-sm text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Camera Error</span>
            </div>
            <p>{scannerError}</p>
            <button
              onClick={handleRetry}
              className="mt-1 flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-xl font-display transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Permission</span>
            </button>
          </div>
        )}

        <p className="text-white/80 text-sm text-center mt-4 max-w-xs leading-relaxed font-body">
          Align the QR code from your printed game card inside the frame. It will scan automatically!
        </p>
      </div>

      {/* Large Clear Tip Banner with Mascot */}
      <div className="w-full max-w-md bg-white/10 border border-white/20 rounded-3xl p-4 sm:p-5 flex items-center gap-4 text-left mb-4 shadow-xl">
        <img
          src="/images/daven.webp"
          alt="Daven"
          className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/daven.webp';
          }}
        />
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-base text-haven-yellow tracking-wide">
            Daven's Tip 🦔
          </span>
          <p className="text-white text-sm sm:text-base leading-snug font-body">
            If lighting is dim, move closer to a lamp or hold the paper flat!
          </p>
        </div>
      </div>
    </div>
  );
};
