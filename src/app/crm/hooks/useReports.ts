import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

type DateFilter = { from?: string; to?: string };

export const useRevenueReport      = (f: DateFilter = {}) => useQuery({ queryKey: ["reports","revenue",f],           queryFn: () => api.get(`/api/v1/reports/revenue?${new URLSearchParams(f as any)}`),           staleTime: 300_000 });
export const useAcquisitionReport  = (f: DateFilter = {}) => useQuery({ queryKey: ["reports","acquisition",f],        queryFn: () => api.get(`/api/v1/reports/acquisition?${new URLSearchParams(f as any)}`),        staleTime: 300_000 });
export const useTeamPerfReport     = (f: DateFilter = {}) => useQuery({ queryKey: ["reports","team-performance",f],   queryFn: () => api.get(`/api/v1/reports/team-performance?${new URLSearchParams(f as any)}`),   staleTime: 300_000 });
export const useAgentPerfReport    = (f: DateFilter & { agentId?: string } = {}) => useQuery({ queryKey: ["reports","agent-performance",f], queryFn: () => api.get(`/api/v1/reports/agent-performance?${new URLSearchParams(f as any)}`), staleTime: 300_000 });
export const useCallCenterReport   = (f: DateFilter = {}) => useQuery({ queryKey: ["reports","call-center",f],        queryFn: () => api.get(`/api/v1/reports/call-center?${new URLSearchParams(f as any)}`),        staleTime: 60_000  });
export const useRetentionReport    = (f: DateFilter = {}) => useQuery({ queryKey: ["reports","retention",f],          queryFn: () => api.get(`/api/v1/reports/retention?${new URLSearchParams(f as any)}`),          staleTime: 300_000 });
