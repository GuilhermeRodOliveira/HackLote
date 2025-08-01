// src/app/wallet/page.tsx
import WalletDashboard from '@/components/WalletDashboard/WalletDashboard';
import React from 'react';

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-10">
      <WalletDashboard />
    </div>
  );
}