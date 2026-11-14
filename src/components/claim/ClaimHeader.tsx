import React from 'react';

export const ClaimHeader: React.FC = () => {
  return (
    <header className="flex flex-col items-center justify-center pt-6 pb-2 px-4 text-center">
      <div className="flex items-center gap-2 mb-2">
        <img
          src="/images/haven-logo-color.webp"
          alt="Hack Club Haven"
          className="h-12 w-auto object-contain drop-shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/logo.webp';
          }}
        />
      </div>
    </header>
  );
};
