import React, { useEffect, useState } from 'react';
import { ClaimHeader } from '../components/claim/ClaimHeader';
import { TradeStatusBadge } from '../components/claim/TradeStatusBadge';
import { KeyRevealedCard } from '../components/claim/KeyRevealedModal';
import { getVoucherStatus, redeemVoucher } from '../services/voucherService';
import type { VoucherStatusResult, RedeemResult } from '../types/database';
import { Gift, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClaimPageProps {
  voucherId?: string;
}

export const ClaimPage: React.FC<ClaimPageProps> = ({ voucherId: propVoucherId }) => {
  // Extract voucher ID from URL if not passed as prop
  const pathParts = window.location.pathname.split('/');
  const claimIndex = pathParts.indexOf('claim');
  const urlVoucherId = claimIndex !== -1 && pathParts[claimIndex + 1] ? pathParts[claimIndex + 1] : undefined;
  const voucherId = propVoucherId || urlVoucherId;

  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [statusData, setStatusData] = useState<VoucherStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redeemedKey, setRedeemedKey] = useState<string | null>(null);

  // Check local cache
  const localCacheKey = voucherId ? `haven_claim_${voucherId}` : null;

  const loadStatus = async () => {
    if (!voucherId) {
      setError('No voucher UUID provided.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Check local storage first
    if (localCacheKey) {
      try {
        const cached = localStorage.getItem(localCacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.key_code) {
            setRedeemedKey(parsed.key_code);
          }
        }
      } catch {
        // Ignore cache parse error
      }
    }

    try {
      const data = await getVoucherStatus(voucherId);
      if (!data) {
        setError("This voucher card was not found. Please check your QR code.");
      } else {
        setStatusData(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Haven server.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [voucherId]);

  const handleRedeem = async () => {
    if (!voucherId || redeeming) return;

    setRedeeming(true);
    setError(null);

    try {
      const res: RedeemResult = await redeemVoucher(voucherId);

      if (res.success) {
        setRedeemedKey(res.key_code);
        // Save to phone's localStorage
        if (localCacheKey) {
          try {
            localStorage.setItem(
              localCacheKey,
              JSON.stringify({
                key_code: res.key_code,
                game_title: res.game_title,
                redeemed_at: res.redeemed_at,
              })
            );
          } catch {
            // Ignore storage failure
          }
        }

        // Fire festive celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ed5615', '#b8c220', '#ffd059', '#ffe382'],
        });

        // Update local status state
        if (statusData) {
          setStatusData({
            ...statusData,
            is_redeemed: true,
            redeemed_at: res.redeemed_at,
          });
        }
      } else {
        setError(res.message || 'Unable to redeem this voucher.');
        if (res.error === 'ALREADY_REDEEMED' && statusData) {
          setStatusData({
            ...statusData,
            is_redeemed: true,
            redeemed_at: res.redeemed_at || new Date().toISOString(),
          });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error during redemption.';
      setError(message);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf0] text-haven-brown-dark flex flex-col items-center justify-between pb-8 px-4 font-body">
      <div className="w-full max-w-md flex flex-col items-center">
        <ClaimHeader />

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-10 h-10 text-haven-orange-deep animate-spin" />
            <p className="font-display text-base text-haven-brown-dark">
              Verifying Haven voucher...
            </p>
          </div>
        )}

        {/* Error / Not Found State */}
        {!loading && error && !statusData && (
          <div className="bg-white border-2 border-red-300 rounded-3xl p-6 shadow-tactile flex flex-col items-center text-center gap-4 mt-4 w-full">
            <img
              src="/images/daven.webp"
              alt="Daven the hedgehog"
              className="w-24 h-auto drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/daven.webp';
              }}
            />
            <div className="flex items-center gap-2 text-red-600 font-display text-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Voucher Not Found</span>
            </div>
            <p className="text-xs text-haven-brown-dark leading-relaxed">
              {error}
            </p>
            <button
              onClick={loadStatus}
              className="flex items-center gap-1.5 bg-haven-butter hover:bg-haven-yellow text-haven-brown-dark font-display px-4 py-2 rounded-xl text-xs shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Main Content Card */}
        {!loading && statusData && (
          <div className="w-full flex flex-col items-center gap-5 mt-2 animate-in fade-in duration-200">
            {/* Mascot Greeting */}
            <div className="flex items-center gap-3 bg-white/80 border border-haven-brown-light/30 rounded-2xl p-2.5 shadow-sm w-full">
              <img
                src="/images/daven.webp"
                alt="Daven"
                className="w-12 h-12 object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/daven.webp';
                }}
              />
              <div className="text-left">
                <p className="text-xs text-haven-brown-light leading-none">Competition Winner Card</p>
                <h2 className="font-display text-sm text-haven-orange-deep mt-0.5">
                  Daven says: Great job at Haven! 🦔
                </h2>
              </div>
            </div>

            {/* Game Artwork & Details Card */}
            <div className="bg-white border-2 border-haven-brown-dark/20 rounded-3xl overflow-hidden shadow-card w-full flex flex-col">
              {statusData.game.image_url ? (
                <div className="w-full h-44 bg-haven-butter/30 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={statusData.game.image_url}
                    alt={statusData.game.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <h1 className="font-display text-2xl text-white tracking-wide drop-shadow-md">
                      {statusData.game.title}
                    </h1>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-gradient-to-r from-haven-orange-deep to-haven-orange-bright p-6 text-center text-white">
                  <h1 className="font-display text-2xl tracking-wide drop-shadow-sm">
                    {statusData.game.title}
                  </h1>
                </div>
              )}

              <div className="p-5 flex flex-col items-center gap-4">
                {/* Trade Status Badge */}
                <TradeStatusBadge
                  isRedeemed={statusData.is_redeemed}
                  redeemedAt={statusData.redeemed_at}
                />

                {/* Inline Error Message */}
                {error && (
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-xs w-full text-center">
                    {error}
                  </div>
                )}

                {/* If key already revealed (from current redeem or local cache) */}
                {redeemedKey ? (
                  <KeyRevealedCard
                    gameTitle={statusData.game.title}
                    keyCode={redeemedKey}
                    redeemedAt={statusData.redeemed_at || undefined}
                  />
                ) : (
                  /* Action Button: Claim Game */
                  !statusData.is_redeemed && (
                    <div className="w-full flex flex-col gap-2 pt-1">
                      <button
                        onClick={handleRedeem}
                        disabled={redeeming}
                        className="w-full py-4 px-6 bg-haven-orange-deep hover:bg-haven-orange-bright active:translate-y-0.5 text-white font-display text-lg rounded-2xl shadow-tactile active:shadow-tactile-active transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {redeeming ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Claiming Game Key...</span>
                          </>
                        ) : (
                          <>
                            <Gift className="w-5 h-5" />
                            <span>Claim & Reveal Game Key</span>
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-haven-brown-light text-center">
                        ⚠️ Pressing this will permanently mark this voucher as redeemed!
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
