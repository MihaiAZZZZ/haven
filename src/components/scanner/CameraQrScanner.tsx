import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle, RefreshCw } from 'lucide-react';

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
            fps: 10,
            qrbox: { width: 250, height: 250 },
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
              scanner.stop().then(() => {
                scanner.clear();
                onScanSuccess(uuid);
              }).catch(() => {
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
              : 'Unable to access your phone camera. Please grant camera permission.';
          setScannerError(msg);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, [onScanSuccess]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-between p-4 font-body animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 pb-4 text-white">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-haven-orange-bright" />
          <span className="font-display text-base tracking-wide">
            Scan Paper QR Code
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close scanner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Viewfinder Center */}
      <div className="w-full max-w-sm flex flex-col items-center my-auto">
        {/* Camera Target Container */}
        <div className="relative w-full aspect-square max-w-[280px] rounded-3xl overflow-hidden border-4 border-haven-orange-deep shadow-2xl bg-black flex items-center justify-center">
          <div id={scannerContainerId} className="w-full h-full object-cover" />

          {/* Target Overlay Corners */}
          <div className="pointer-events-none absolute inset-4 border-2 border-dashed border-white/60 rounded-2xl flex items-center justify-center">
            {isStarting && (
              <span className="text-white/80 font-display text-xs bg-black/60 px-3 py-1.5 rounded-full">
                Starting camera...
              </span>
            )}
          </div>
        </div>

        {/* Error message if permission denied */}
        {scannerError && (
          <div className="mt-4 bg-red-900/80 border border-red-500 text-red-200 px-4 py-3 rounded-2xl text-xs flex flex-col items-center text-center gap-2 max-w-xs">
            <div className="flex items-center gap-1.5 font-display text-sm text-red-100">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Camera Error</span>
            </div>
            <p>{scannerError}</p>
            <button
              onClick={handleRetry}
              className="mt-1 flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-xl font-display transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Permission</span>
            </button>
          </div>
        )}

        <p className="text-white/80 text-xs text-center mt-4 max-w-xs leading-relaxed">
          Align the QR code from your printed game voucher inside the box. It will scan automatically!
        </p>
      </div>

      {/* Footer Instructions with Mascot */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center gap-3 text-left mb-2">
        <img
          src="/images/daven.webp"
          alt="Daven"
          className="w-10 h-10 object-contain shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/daven.webp';
          }}
        />
        <p className="text-white/90 text-[11px] leading-tight">
          <strong>Tip:</strong> If lighting is dim, move closer to a lamp or hold the paper flat!
        </p>
      </div>
    </div>
  );
};
