import type { AuditAction, AuditLogEntry, EngineState } from './types';

const makeId = () => crypto.randomUUID();

export class AuditLogService {
  constructor(private state: EngineState) {}

  record(userId: string, action: AuditAction, entityId: string, payload: Record<string, unknown>) {
    const entry: AuditLogEntry = {
      id: makeId(),
      userId,
      action,
      entityId,
      payload,
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.push(entry);
    return entry;
  }
}
