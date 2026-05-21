import { useState, useEffect, useCallback } from 'react';
import { apiFetch, authStorage } from '../lib/auth';

export function useLeads(page = 1, limit = 50, search = '') {
  const [data, setData]       = useState<any[]>([]);
  const [meta, setMeta]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/v1/leads?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      const res = await apiFetch(url);

      if (res.status === 401) {
        authStorage.clear();
        window.location.reload();
        return;
      }

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const result = await res.json();
      const leads  = result.data as any[];

      const grouped = {
        'New Inquiries': leads.filter(l => l.stage === 'NEW_INQUIRY'),
        'In Discussion': leads.filter(l => l.stage === 'IN_DISCUSSION'),
        'Pending KYC':   leads.filter(l => l.stage === 'PENDING_KYC'),
        'Funded (FTD)':  leads.filter(l => l.stage === 'FUNDED'),
      };

      setData(leads);
      setMeta({ ...result.meta, grouped });
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchLeads().catch(() => {});
  }, [fetchLeads]);

  return { leads: data, meta, loading, error, refetch: fetchLeads };
}
