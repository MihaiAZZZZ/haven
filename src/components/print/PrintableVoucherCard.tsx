import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PrintableVoucherCardProps {
  voucherId: string;
  gameTitle: string;
  imageUrl?: string | null;
}

export const PrintableVoucherCard: React.FC<PrintableVoucherCardProps> = ({
  voucherId,
  gameTitle,
  imageUrl,
}) => {
  const claimUrl = `${window.location.origin}/claim/${voucherId}`;

  return (
    <div className="w-[300px] h-[440px] bg-white border-2 border-dashed border-haven-brown-dark rounded-3xl p-4 flex flex-col justify-between items-center text-center shadow-sm relative overflow-hidden print:shadow-none print:border-solid print:border-haven-brown-dark mx-auto my-2">
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-haven-brown-light/30">
        <img
          src="/images/logo.webp"
          alt="Hack Club Haven"
          className="h-6 w-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/logo.webp';
          }}
        />
        <span className="font-display text-[11px] text-haven-orange-deep bg-haven-butter/60 px-2.5 py-0.5 rounded-full">
          Game Voucher
        </span>
      </div>

      {/* Game Title & Cover Thumbnail */}
      <div className="w-full flex flex-col items-center my-1">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={gameTitle}
            className="w-16 h-16 rounded-xl object-cover border border-haven-brown-light/40 shadow-xs mb-1.5"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-haven-orange-deep flex items-center justify-center text-white text-2xl font-display mb-1.5 shadow-xs">
            🎮
          </div>
        )}
        <h2 className="font-display text-lg text-haven-brown-dark leading-tight line-clamp-1">
          {gameTitle}
        </h2>
      </div>

      {/* Center QR Code Container */}
      <div className="bg-white p-2.5 rounded-2xl border-2 border-haven-brown-dark/30 shadow-xs flex flex-col items-center">
        <QRCodeSVG
          value={claimUrl}
          size={160}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: '/images/daven.webp',
            x: undefined,
            y: undefined,
            height: 32,
            width: 32,
            excavate: true,
          }}
        />
        <span className="font-mono text-[9px] text-haven-brown-light mt-1.5 uppercase tracking-wider">
          UUID: {voucherId.slice(0, 8)}...
        </span>
      </div>

      {/* Footer Instructions with Mascot */}
      <div className="w-full pt-2 border-t border-haven-brown-light/30 flex items-center gap-2 text-left">
        <img
          src="/images/daven.webp"
          alt="Daven"
          className="w-9 h-9 object-contain shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/daven.webp';
          }}
        />
        <div className="flex-1">
          <p className="text-[10px] text-haven-brown-dark leading-tight font-semibold">
            Scan to redeem on your phone!
          </p>
          <p className="text-[9px] text-haven-brown-light leading-tight">
            Single-use only • Safe to trade with friends!
          </p>
        </div>
      </div>
    </div>
  );
};
