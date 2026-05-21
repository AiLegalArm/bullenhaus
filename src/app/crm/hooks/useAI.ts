import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useAIInsights(entityId: string, type?: string) {
  return useQuery({ queryKey: ["ai","insights",entityId,type], queryFn: () => api.get(`/api/v1/ai/insights/${entityId}${type ? `?type=${type}` : ""}`), staleTime: 120_000, enabled: !!entityId });
}

export function useClientSummary() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (clientId: string) => api.post("/api/v1/ai/client-summary", { clientId }), onSuccess: (_, clientId) => qc.invalidateQueries({ queryKey: ["ai","insights",clientId] }) });
}

export function useNextAction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (clientId: string) => api.post("/api/v1/ai/next-action", { clientId }), onSuccess: (_, clientId) => qc.invalidateQueries({ queryKey: ["ai","insights",clientId] }) });
}

export function useChurnRisk() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (clientId: string) => api.post("/api/v1/ai/churn-risk", { clientId }), onSuccess: (_, clientId) => qc.invalidateQueries({ queryKey: ["ai","insights",clientId] }) });
}

export function useCallScript() {
  return useMutation({ mutationFn: (dto: { clientId?: string; leadId?: string; context?: string }) => api.post("/api/v1/ai/call-script", dto) });
}
