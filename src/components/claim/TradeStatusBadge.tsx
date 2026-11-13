import React from 'react';
import { CheckCircle2, XCircle, ArrowLeftRight } from 'lucide-react';

interface TradeStatusBadgeProps {
  isRedeemed: boolean;
  redeemedAt?: string | null;
}

export const TradeStatusBadge: React.FC<TradeStatusBadgeProps> = ({
  isRedeemed,
  redeemedAt,
}) => {
  if (isRedeemed) {
    const formattedDate = redeemedAt
      ? new Date(redeemedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    return (
      <div className="flex flex-col items-center gap-1 bg-red-100 border-2 border-red-400 text-red-800 px-4 py-2 rounded-2xl w-full text-center shadow-sm">
        <div className="flex items-center gap-2 font-display text-base">
          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>ALREADY CLAIMED</span>
        </div>
        <p className="text-xs text-red-700">
          {formattedDate ? `Claimed on ${formattedDate}` : 'This voucher has already been redeemed.'}
        </p>
        <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">
          ⚠️ Not valid for trading
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 bg-haven-green/20 border-2 border-haven-green-deep text-haven-green-deep px-4 py-2.5 rounded-2xl w-full text-center shadow-sm">
      <div className="flex items-center gap-2 font-display text-base text-haven-green-deep">
        <CheckCircle2 className="w-5 h-5 text-haven-green-deep shrink-0" />
        <span>VALID FOR TRADE • UNCLAIMED</span>
      </div>
      <p className="text-xs text-haven-green-deep/90 flex items-center gap-1">
        <ArrowLeftRight className="w-3.5 h-3.5" />
        <span>You can safely trade this voucher card with friends!</span>
      </p>
    </div>
  );
};
