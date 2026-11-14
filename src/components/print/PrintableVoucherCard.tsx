import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface PrintableVoucherCardProps {
  voucherId: string;
  gameTitle: string;
  imageUrl?: string | null;
  compact?: boolean;
}

export const PrintableVoucherCard: React.FC<PrintableVoucherCardProps> = ({
  voucherId,
  gameTitle,
  imageUrl,
  compact = false,
}) => {
  const claimUrl = `${window.location.origin}/claim/${voucherId}`;

  return (
    <div
      className={`bg-white border-2 border-dashed border-haven-brown-dark rounded-2xl flex flex-col justify-between items-center text-center shadow-xs relative overflow-hidden print:overflow-visible print:shadow-none print:border-2 print:border-dashed print:border-haven-brown-dark mx-auto ${
        compact
          ? 'w-[230px] h-[320px] p-2.5 my-1'
          : 'w-[270px] h-[380px] p-3.5 my-1.5'
      }`}
    >
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between pb-1.5 border-b border-haven-brown-light/30">
        <img
          src="/images/haven-logo-color.webp"
          alt="Hack Club Haven"
          className="h-5 w-auto object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/logo.webp';
          }}
        />
        <span className="font-display text-[10px] text-haven-orange-deep bg-haven-butter/60 px-2 py-0.5 rounded-full">
          Game Voucher
        </span>
      </div>

      {/* Game Title & Cover Thumbnail */}
      <div className="w-full flex flex-col items-center my-0.5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={gameTitle}
            className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg object-cover border border-haven-brown-light/40 shadow-xs mb-1`}
          />
        ) : (
          <div
            className={`${compact ? 'w-10 h-10 text-xl' : 'w-12 h-12 text-2xl'} rounded-lg bg-haven-orange-deep flex items-center justify-center text-white font-display mb-1 shadow-xs`}
          >
            🎮
          </div>
        )}
        <h2 className={`font-display ${compact ? 'text-sm' : 'text-base'} text-haven-brown-dark leading-tight line-clamp-1`}>
          {gameTitle}
        </h2>
      </div>

      {/* Center QR Code Container */}
      <div className="bg-white p-2 rounded-xl border border-haven-brown-dark/30 shadow-2xs flex flex-col items-center">
        <QRCodeSVG
          value={claimUrl}
          size={compact ? 115 : 140}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: '/images/daven.webp',
            x: undefined,
            y: undefined,
            height: compact ? 22 : 28,
            width: compact ? 22 : 28,
            excavate: true,
          }}
        />
        <span className="font-mono text-[8px] text-haven-brown-light mt-1 uppercase tracking-wider">
          UUID: {voucherId.slice(0, 8)}...
        </span>
      </div>

      {/* Footer Instructions with Mascot */}
      <div className="w-full pt-1.5 border-t border-haven-brown-light/30 flex items-center gap-1.5 text-left">
        <img
          src="/images/daven.webp"
          alt="Daven"
          className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} object-contain shrink-0`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/daven.webp';
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-haven-brown-dark leading-tight font-semibold truncate">
            Scan to redeem on your phone!
          </p>
          <p className="text-[8px] text-haven-brown-light leading-tight">
            Single-use only • Safe to trade with friends!
          </p>
        </div>
      </div>
    </div>
  );
};
