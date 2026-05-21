import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTradingStore } from '../stores/tradingStore';

export const useWalletSync = (pollMs = 30000) => {
  const setWallet = useTradingStore((state) => state.setWallet);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) return;

      const response = await fetch('/api/users?scope=wallet', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to load wallet');

      if (result.wallet) {
        setWallet({
          balance: result.wallet.balance,
          realizedPnL: result.wallet.realizedPnL,
          marginUsed: result.wallet.marginUsed,
        });
      } else {
        setWallet({ balance: 0, realizedPnL: 0, marginUsed: 0 });
      }
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [setWallet]);

  useEffect(() => {
    refetch();
    if (!pollMs) return undefined;
    const interval = window.setInterval(refetch, pollMs);
    return () => window.clearInterval(interval);
  }, [pollMs, refetch]);

  return { loading, error, refetch };
};
