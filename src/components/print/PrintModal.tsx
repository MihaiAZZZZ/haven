import React, { useState } from 'react';
import { PrintableVoucherCard } from './PrintableVoucherCard';
import { Printer, X, ExternalLink, Grid, LayoutTemplate, Trash2 } from 'lucide-react';

export interface PrintableVoucherItem {
  voucherId: string;
  gameTitle: string;
  imageUrl?: string | null;
}

interface PrintModalProps {
  voucherId?: string;
  gameTitle?: string;
  imageUrl?: string | null;
  vouchers?: PrintableVoucherItem[];
  onClose: () => void;
  onRemoveVoucher?: (voucherId: string) => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  voucherId,
  gameTitle,
  imageUrl,
  vouchers,
  onClose,
  onRemoveVoucher,
}) => {
  // Normalize items
  const initialList: PrintableVoucherItem[] = vouchers && vouchers.length > 0
    ? vouchers
    : voucherId && gameTitle
    ? [{ voucherId, gameTitle, imageUrl }]
    : [];

  const [items, setItems] = useState<PrintableVoucherItem[]>(initialList);
  // Default to compact if multiple cards, standard if single
  const [compact, setCompact] = useState<boolean>(initialList.length > 1);

  const handlePrint = () => {
    window.print();
  };

  const handleRemove = (idToRemove: string) => {
    const updated = items.filter((item) => item.voucherId !== idToRemove);
    setItems(updated);
    if (onRemoveVoucher) {
      onRemoveVoucher(idToRemove);
    }
    if (updated.length === 0) {
      onClose();
    }
  };

  const isMultiple = items.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-[#fffbf0] border-2 border-haven-brown-dark rounded-3xl max-w-4xl w-full max-h-[92vh] shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Sticky Header */}
        <div className="p-4 border-b border-haven-brown-light/20 flex items-center justify-between shrink-0 bg-[#fffbf0] z-10">
          <div>
            <h2 className="font-display text-lg sm:text-xl text-haven-brown-dark leading-tight">
              {isMultiple ? `Print Sheet (${items.length} Cards)` : 'Voucher Card Ready! 🎉'}
            </h2>
            <p className="text-xs text-haven-brown-light mt-0.5">
              {isMultiple
                ? 'Multiple cards formatted together on this page for easy printing & cutting.'
                : 'Ready to print or hand out to winners.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Card Size Toggle */}
            <button
              onClick={() => setCompact(!compact)}
              className="px-2.5 py-1.5 bg-white border border-haven-brown-light/30 hover:border-haven-orange-deep text-haven-brown-dark rounded-xl text-xs font-display flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle Compact / Standard Card Size"
            >
              {compact ? (
                <>
                  <LayoutTemplate className="w-3.5 h-3.5 text-haven-orange-deep" />
                  <span className="hidden sm:inline">Standard Size</span>
                </>
              ) : (
                <>
                  <Grid className="w-3.5 h-3.5 text-haven-orange-deep" />
                  <span className="hidden sm:inline">Compact Grid</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-haven-butter/60 text-haven-brown-dark transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-[#faf5ea]/40">
          <div className="printable-card-area w-full flex flex-wrap justify-center items-start gap-3">
            {items.map((item) => (
              <div key={item.voucherId} className="relative group">
                <PrintableVoucherCard
                  voucherId={item.voucherId}
                  gameTitle={item.gameTitle}
                  imageUrl={item.imageUrl}
                  compact={compact}
                />

                {/* Individual remove button in preview (hidden on print) */}
                {items.length > 1 && (
                  <button
                    onClick={() => handleRemove(item.voucherId)}
                    className="absolute top-2 right-2 p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full shadow-xs opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer"
                    title="Remove card from this print sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-3 sm:p-4 border-t border-haven-brown-light/20 flex items-center justify-between gap-3 shrink-0 bg-[#fffbf0] z-10">
          <div className="text-xs text-haven-brown-light hidden sm:block">
            {compact ? 'Compact size fits 4–6 cards per page' : 'Standard full-size cards'}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              disabled={items.length === 0}
              className="flex-1 sm:flex-none py-2.5 px-6 bg-haven-orange-deep hover:bg-haven-orange-bright active:translate-y-0.5 text-white font-display text-sm sm:text-base rounded-2xl shadow-tactile active:shadow-tactile-active transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Print {items.length > 1 ? `All ${items.length} Cards` : 'Voucher Card'}</span>
            </button>

            {!isMultiple && items.length === 1 && (
              <a
                href={`/claim/${items[0].voucherId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white border border-haven-brown-light/30 hover:border-haven-orange-deep text-haven-brown-dark rounded-2xl shadow-xs transition-colors flex items-center justify-center cursor-pointer print:hidden"
                title="Preview Mobile Claim Page"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-white border border-haven-brown-light/30 hover:bg-haven-butter/30 text-haven-brown-dark font-display text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer print:hidden"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
