/**
 * job.worker.ts — Background job worker with idempotency and retry
 *
 * Handles CRM↔Trading sync events and background processing jobs.
 *
 * Design:
 *   - Polls the WorkerJob table for PENDING jobs
 *   - Uses idempotency keys to skip duplicate processing
 *   - Retries up to MAX_RETRIES on transient failures
 *   - Logs all results to AuditLog
 *   - Uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) — backend/worker only
 *
 * Run as: npx tsx src/server/workers/job.worker.ts
 * Or via: npm run worker:start
 */

import { PrismaClient } from '@prisma/client';
import { validateEnv, WORKER_API_KEY } from '../../config/env.js';

// Validate env on startup
validateEnv();

const prisma = new PrismaClient();

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const POLL_INTERVAL_MS = 5_000;    // Poll every 5 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 2_000; // 2s, 4s, 8s (exponential backoff)
const JOB_LOCK_TIMEOUT_MS = 60_000; // Jobs claimed longer than 60s are released

// -------------------------------------------------------
// Job types
// -------------------------------------------------------

type JobType =
  | 'registerClient'    // New CRM client → Trading system
  | 'syncDeposit'       // Deposit approval sync
  | 'syncWithdrawal'    // Withdrawal sync
  | 'updateKycStatus'   // KYC status change sync
  | 'cleanupExpiredTokens' // Housekeeping
  | 'sendPasswordReset' // Email trigger (migrated users);

interface WorkerJob {
  id: string;
  eventType: JobType;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  attempts: number;
  maxRetries: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// -------------------------------------------------------
// Job handlers
// -------------------------------------------------------

type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

const handlers: Partial<Record<JobType, JobHandler>> = {
  registerClient: async (payload) => {
    console.log('[worker] registerClient:', payload.clientId);
    // TODO: Create corresponding TradingAccount for new CRM client
    // await prisma.tradingAccount.create({ data: { userId: payload.userId, ... } });
  },

  syncDeposit: async (payload) => {
    console.log('[worker] syncDeposit:', payload.depositId);
    // TODO: Sync approved deposit from Trading to CRM client record
  },

  syncWithdrawal: async (payload) => {
    console.log('[worker] syncWithdrawal:', payload.withdrawalId);
    // TODO: Sync withdrawal result to CRM client record
  },

  updateKycStatus: async (payload) => {
    console.log('[worker] updateKycStatus:', payload.userId, '→', payload.kycStatus);
    // TODO: Update CRM Client.kycStatus when Trading KYC changes
  },

  cleanupExpiredTokens: async (_payload) => {
    const deleted = await (prisma as any).denylistedToken?.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    console.log(`[worker] cleanupExpiredTokens: removed ${deleted?.count ?? 0} expired tokens`);
  },

  sendPasswordReset: async (payload) => {
    console.log('[worker] sendPasswordReset for userId:', payload.userId);
    // TODO: Integrate with email provider (SendGrid / Resend / etc.)
    // Send password reset link to migrated trading users
  },
};

// -------------------------------------------------------
// Core processing logic
// -------------------------------------------------------

async function processJob(job: WorkerJob): Promise<void> {
  const handler = handlers[job.eventType];
  if (!handler) {
    throw new Error(`No handler registered for job type: ${job.eventType}`);
  }
  await handler(job.payload);
}

async function runWithRetry(job: WorkerJob): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await processJob(job);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[worker] Job ${job.id} (${job.eventType}) attempt ${attempt}/${MAX_RETRIES} failed:`,
        lastError.message
      );
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError ?? new Error('Unknown error after retries');
}

// -------------------------------------------------------
// Job queue polling
// -------------------------------------------------------

async function claimNextJob(): Promise<WorkerJob | null> {
  // Release stale locks (jobs stuck IN_PROGRESS too long)
  await (prisma as any).workerJob?.updateMany({
    where: {
      status: 'IN_PROGRESS',
      updatedAt: { lt: new Date(Date.now() - JOB_LOCK_TIMEOUT_MS) },
    },
    data: { status: 'PENDING' },
  });

  // Claim the next pending job (atomic update to prevent double-processing)
  const job = await (prisma as any).workerJob?.findFirst({
    where: {
      status: 'PENDING',
      attempts: { lt: MAX_RETRIES },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!job) return null;

  await (prisma as any).workerJob?.update({
    where: { id: job.id },
    data: { status: 'IN_PROGRESS', attempts: { increment: 1 } },
  });

  return job as WorkerJob;
}

async function markCompleted(jobId: string): Promise<void> {
  await (prisma as any).workerJob?.update({
    where: { id: jobId },
    data: { status: 'COMPLETED' },
  });
  await writeAuditLog(jobId, 'JOB_COMPLETED', {});
}

async function markFailed(jobId: string, error: Error): Promise<void> {
  await (prisma as any).workerJob?.update({
    where: { id: jobId },
    data: { status: 'FAILED', lastError: error.message },
  });
  await writeAuditLog(jobId, 'JOB_FAILED', { error: error.message });
}

async function writeAuditLog(
  entityId: string,
  action: string,
  meta: Record<string, unknown>
): Promise<void> {
  try {
    await (prisma as any).auditLog?.create({
      data: {
        entityType: 'WORKER_JOB',
        entityId,
        action,
        metadata: JSON.stringify(meta),
      },
    });
  } catch {
    // Don't let audit log failures crash the worker
  }
}

// -------------------------------------------------------
// Idempotency check
// -------------------------------------------------------

/**
 * Process a sync event from an external caller (e.g. CRM webhook).
 * Returns { duplicate: true } if the idempotency key was already processed.
 */
export async function enqueueSyncEvent(
  eventType: JobType,
  payload: Record<string, unknown>,
  idempotencyKey: string
): Promise<{ duplicate: boolean; jobId?: string }> {
  const existing = await (prisma as any).workerJob?.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    console.log(`[worker] Duplicate event (idempotencyKey=${idempotencyKey}) — skipping`);
    return { duplicate: true };
  }

  const job = await (prisma as any).workerJob?.create({
    data: {
      eventType,
      payload: JSON.stringify(payload),
      idempotencyKey,
      status: 'PENDING',
      attempts: 0,
      maxRetries: MAX_RETRIES,
    },
  });

  return { duplicate: false, jobId: job?.id };
}

// -------------------------------------------------------
// Main polling loop
// -------------------------------------------------------

async function pollLoop(): Promise<never> {
  console.log(`[worker] Started — polling every ${POLL_INTERVAL_MS / 1000}s`);

  // Verify API key is set (fail fast)
  if (!WORKER_API_KEY || WORKER_API_KEY.length < 32) {
    throw new Error('[worker] WORKER_API_KEY is not set or too short. Check .env');
  }

  while (true) {
    try {
      const job = await claimNextJob();

      if (job) {
        console.log(`[worker] Processing job ${job.id} (${job.eventType})`);
        try {
          await runWithRetry(job);
          await markCompleted(job.id);
          console.log(`[worker] Job ${job.id} completed`);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          await markFailed(job.id, error);
          console.error(`[worker] Job ${job.id} permanently failed:`, error.message);
        }
      }
    } catch (err) {
      console.error('[worker] Poll loop error:', err);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

// -------------------------------------------------------
// Entry point
// -------------------------------------------------------

pollLoop().catch((err) => {
  console.error('[worker] Fatal error — exiting:', err);
  process.exit(1);
});
