'use client';

import { useEffect, useState } from 'react';
import { useAuraxToken } from '../hooks/useAuraxToken';
import { useTokenTransfer } from '../hooks/useTokenTransfer';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';

export default function TokensPage() {
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();
  const { balance, symbol, refetchBalance } = useAuraxToken();
  const { sendTokens, isTransferring, error } = useTokenTransfer();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleGetTokens = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    try {
      await sendTokens(address);
      await refetchBalance(); // Refresh balance after successful transfer
      toast.success('Successfully received 10 AURX tokens!');
    } catch (error) {
      toast.error('Failed to get tokens. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">AURX Tokens</h1>
          
          {mounted && address && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col gap-4">
                <div className="text-lg">
                  <span className="font-semibold">Balance: </span>
                  <span>
                    {typeof balance === 'number' ? balance.toFixed(2) : '0.00'} {symbol}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {address && `Connected: ${address}`}
                </div>
                <button
                  onClick={handleGetTokens}
                  disabled={isTransferring}
                  className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors ${
                    isTransferring ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isTransferring ? 'Getting Tokens...' : 'Get AURX'}
                </button>
              </div>
            </div>
          )}

          {mounted && !address && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-700">
                Please connect your wallet to view and manage your AURX tokens.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 