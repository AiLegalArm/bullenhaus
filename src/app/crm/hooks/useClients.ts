import { useState, useEffect, useCallback } from 'react';
import { apiFetch, authStorage } from '../lib/auth';

export function useClients(page = 1, limit = 50, search = '') {
  const [data, setData]       = useState<any[]>([]);
  const [meta, setMeta]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/v1/clients?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      const res = await apiFetch(url);

      if (res.status === 401) {
        // apiFetch already tried refresh — session truly expired
        authStorage.clear();
        window.location.reload();
        return;
      }

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const result = await res.json();
      setData(result.data);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    let alive = true;
    fetchClients().then(() => {}).catch(() => {});
    return () => { alive = false; };
  }, [fetchClients]);

  return { clients: data, meta, loading, error, refetch: fetchClients };
}
