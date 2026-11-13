import React from 'react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fffbf0] text-haven-brown-dark flex flex-col items-center justify-center p-6 text-center">
      <img
        src="/images/daven.webp"
        alt="Daven the hedgehog"
        className="w-32 h-auto mb-4 drop-shadow-md"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/assets/daven.webp';
        }}
      />
      <h1 className="font-display text-4xl text-haven-orange-deep mb-2">404</h1>
      <h2 className="font-display text-xl text-haven-brown-dark mb-2">
        Page Not Found
      </h2>
      <p className="text-sm text-haven-brown-light max-w-sm mb-6">
        Daven looked under all the leaves, but couldn't find this page or voucher!
      </p>
      <a
        href="/"
        className="py-3 px-6 bg-haven-orange-deep hover:bg-haven-orange-bright text-white font-display text-sm rounded-2xl shadow-tactile transition-transform active:translate-y-0.5"
      >
        Back to Haven Game Station
      </a>
    </div>
  );
};
