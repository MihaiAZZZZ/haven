import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TradeStatusBadge } from '../src/components/claim/TradeStatusBadge';
import { PrintableVoucherCard } from '../src/components/print/PrintableVoucherCard';

describe('TradeStatusBadge Component', () => {
  it('renders VALID FOR TRADE when isRedeemed is false', () => {
    render(<TradeStatusBadge isRedeemed={false} />);
    expect(screen.getByText(/VALID FOR TRADE/i)).toBeDefined();
    expect(screen.getByText(/safely trade this voucher/i)).toBeDefined();
  });

  it('renders ALREADY CLAIMED when isRedeemed is true', () => {
    render(<TradeStatusBadge isRedeemed={true} redeemedAt="2026-11-13T20:00:00Z" />);
    expect(screen.getByText(/ALREADY CLAIMED/i)).toBeDefined();
    expect(screen.getByText(/Not valid for trading/i)).toBeDefined();
  });
});

describe('PrintableVoucherCard Component', () => {
  it('renders game title and instructions', () => {
    render(
      <PrintableVoucherCard
        voucherId="test-voucher-uuid-12345"
        gameTitle="Celeste"
        imageUrl="https://example.com/celeste.jpg"
      />
    );

    expect(screen.getByText('Celeste')).toBeDefined();
    expect(screen.getByText(/Scan to redeem on your phone!/i)).toBeDefined();
    expect(screen.getByText(/Single-use only/i)).toBeDefined();
  });
});
