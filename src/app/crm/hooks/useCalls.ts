import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "../lib/api";
import { authStorage } from "../lib/auth";

// ── Queries ────────────────────────────────────────────────────────────────
export function useCalls(filters: { page?: number; limit?: number; status?: string; from?: string; to?: string } = {}) {
  const params = new URLSearchParams({ page: String(filters.page || 1), limit: String(filters.limit || 50), ...(filters.status && { status: filters.status }), ...(filters.from && { from: filters.from }), ...(filters.to && { to: filters.to }) });
  return useQuery({ queryKey: ["calls", filters], queryFn: () => api.get(`/api/v1/calls?${params}`), staleTime: 30_000 });
}

export function useLiveCalls() {
  return useQuery({ queryKey: ["calls", "live"], queryFn: () => api.get("/api/v1/calls/live"), refetchInterval: 10_000, staleTime: 0 });
}

export function useAgentAvailability() {
  return useQuery({ queryKey: ["availability"], queryFn: () => api.get("/api/v1/calls/availability"), refetchInterval: 15_000, staleTime: 0 });
}

// ── Mutations ──────────────────────────────────────────────────────────────
export function useStartCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { leadId?: string; clientId?: string; direction?: string }) => api.post("/api/v1/calls/start", dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calls"] }); qc.invalidateQueries({ queryKey: ["availability"] }); },
  });
}

export function useEndCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { callId: string; durationSeconds: number; state?: string }) => api.post("/api/v1/calls/end", dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calls"] }); qc.invalidateQueries({ queryKey: ["availability"] }); },
  });
}

export function useCallResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { callId: string; status: string; agentNotes?: string; aiSummary?: string }) => api.post("/api/v1/calls/result", dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["calls"] }); qc.invalidateQueries({ queryKey: ["approvals"] }); },
  });
}

export function useSetAgentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => api.patch("/api/v1/calls/availability", { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availability"] }),
  });
}

// ── Real-time Socket.IO integration ───────────────────────────────────────
export function useCallCenterSocket(onEvent: (event: string, data: any) => void) {
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) return;

    // Dynamic import of socket.io-client (add to package.json if not present)
    import("socket.io-client").then(({ io }) => {
      const socket = io(window.location.origin, { auth: { token }, transports: ["websocket"] });
      socketRef.current = socket;

      ["call_started","call_ended","call_missed","call_wrapped","agent_status_changed","manager_monitoring_started","approval_required","compliance_alert"].forEach(event => {
        socket.on(event, (data: any) => onEvent(event, data));
      });

      socket.on("connect_error", (err: any) => console.warn("[Socket] Connect error:", err.message));
    }).catch(() => { /* socket.io-client not installed - silent degradation */ });

    return () => { socketRef.current?.disconnect(); };
  }, [onEvent]);

  return socketRef;
}
