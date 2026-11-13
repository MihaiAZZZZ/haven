import React from 'react';

export const ClaimHeader: React.FC = () => {
  return (
    <header className="flex flex-col items-center justify-center pt-6 pb-4 px-4 text-center">
      <div className="flex items-center gap-2 mb-2">
        <img
          src="/images/logo.webp"
          alt="Hack Club Haven"
          className="h-10 w-auto object-contain drop-shadow-sm"
          onError={(e) => {
            // Fallback to assets folder if images not matched
            (e.target as HTMLImageElement).src = '/assets/logo.webp';
          }}
        />
      </div>
      <div className="flex items-center gap-2 bg-haven-butter/60 border border-haven-brown-light/40 px-3 py-1 rounded-full text-xs font-display text-haven-brown-dark shadow-sm">
        <span>🎮</span>
        <span>Game Voucher Redemption Station</span>
      </div>
    </header>
  );
};
