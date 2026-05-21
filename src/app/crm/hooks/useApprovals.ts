import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useApprovals(filters: { page?: number; status?: string; type?: string; priority?: string } = {}) {
  const params = new URLSearchParams({ page: String(filters.page || 1), ...(filters.status && { status: filters.status }), ...(filters.type && { type: filters.type }), ...(filters.priority && { priority: filters.priority }) });
  return useQuery({ queryKey: ["approvals", filters], queryFn: () => api.get(`/api/v1/approvals?${params}`), staleTime: 15_000 });
}

export function usePendingApprovals() {
  return useQuery({ queryKey: ["approvals", "pending"], queryFn: () => api.get("/api/v1/approvals/pending"), refetchInterval: 30_000, staleTime: 0 });
}

export function useCreateApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { type: string; priority?: string; entityType: string; entityId: string; description?: string; oldValue?: any; newValue?: any; financialImpact?: number }) => api.post("/api/v1/approvals", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals"] }),
  });
}

export function useApproveCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => api.post(`/api/v1/approvals/${id}/approve`, { comment }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals"] }),
  });
}

export function useRejectCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => api.post(`/api/v1/approvals/${id}/reject`, { comment }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals"] }),
  });
}

export function useEscalateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => api.post(`/api/v1/approvals/${id}/escalate`, { comment }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approvals"] }),
  });
}
