import React from 'react';
import { PrintableVoucherCard } from './PrintableVoucherCard';
import { Printer, X, ExternalLink } from 'lucide-react';

interface PrintModalProps {
  voucherId: string;
  gameTitle: string;
  imageUrl?: string | null;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  voucherId,
  gameTitle,
  imageUrl,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const claimUrl = `/claim/${voucherId}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fffbf0] border-2 border-haven-brown-dark rounded-3xl max-w-md w-full p-5 shadow-2xl flex flex-col items-center relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-haven-butter/60 text-haven-brown-dark transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-display text-xl text-haven-brown-dark mb-1">
          Voucher Card Generated! 🎉
        </h2>
        <p className="text-xs text-haven-brown-light mb-4">
          This card is ready to print or hand out to winners.
        </p>

        {/* Printable Card Area */}
        <div className="printable-card-area w-full flex justify-center my-2">
          <PrintableVoucherCard
            voucherId={voucherId}
            gameTitle={gameTitle}
            imageUrl={imageUrl}
          />
        </div>

        {/* Actions */}
        <div className="w-full flex items-center gap-3 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-haven-orange-deep hover:bg-haven-orange-bright active:translate-y-0.5 text-white font-display text-base rounded-2xl shadow-tactile active:shadow-tactile-active transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span>Print Voucher Card</span>
          </button>

          <a
            href={claimUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-white border-2 border-haven-brown-dark/30 hover:border-haven-orange-deep text-haven-brown-dark rounded-2xl shadow-xs transition-colors flex items-center justify-center"
            title="Preview Mobile Claim Page"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};
