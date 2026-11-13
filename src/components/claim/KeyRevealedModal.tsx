import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface KeyRevealedProps {
  gameTitle: string;
  keyCode: string;
  redeemedAt?: string;
}

export const KeyRevealedCard: React.FC<KeyRevealedProps> = ({
  gameTitle,
  keyCode,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(keyCode);
      setCopied(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ed5615', '#b8c220', '#ffd059', '#ffe382'],
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy
      const el = document.createElement('textarea');
      el.value = keyCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const steamRedeemUrl = `https://store.steampowered.com/account/registerkey?key=${encodeURIComponent(keyCode)}`;

  return (
    <div className="flex flex-col items-center gap-4 bg-white border-2 border-haven-orange-deep rounded-3xl p-5 shadow-tactile w-full animate-in fade-in duration-300">
      <div className="flex items-center gap-2 text-haven-orange-deep font-display text-lg">
        <Sparkles className="w-5 h-5 text-haven-yellow animate-pulse" />
        <span>Your Game Key is Ready!</span>
      </div>

      <p className="text-xs text-haven-brown-dark text-center">
        This key for <strong className="text-haven-orange-deep">{gameTitle}</strong> has been withdrawn to your device.
      </p>

      {/* Secret Key Display */}
      <div
        onClick={handleCopy}
        className="w-full bg-haven-butter/30 border-2 border-dashed border-haven-orange-deep/70 hover:border-haven-orange-deep rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.98] group relative"
      >
        <span className="text-[10px] text-haven-brown-light uppercase tracking-wider font-semibold mb-1">
          Activation Key (Tap to Copy)
        </span>
        <code className="font-mono font-bold text-base md:text-lg text-haven-brown-dark tracking-wider select-all break-all text-center">
          {keyCode}
        </code>

        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-display text-haven-orange-deep bg-white px-3 py-1 rounded-full shadow-sm border border-haven-orange-deep/20">
          {copied ? (
            <>
              <Check className="w-4 h-4 text-haven-green" />
              <span className="text-haven-green-deep">Copied to Clipboard! 🎮</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Key</span>
            </>
          )}
        </div>
      </div>

      {/* Steam Quick Link */}
      <a
        href={steamRedeemUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 bg-[#171a21] hover:bg-[#2a475e] text-white py-3 px-4 rounded-2xl font-display text-sm shadow-md transition-colors"
      >
        <span>Redeem on Steam</span>
        <ExternalLink className="w-4 h-4" />
      </a>

      <p className="text-[11px] text-haven-brown-light text-center leading-tight">
        Tip: We saved this key to your phone's browser, so refreshing this page won't lose it!
      </p>
    </div>
  );
};
