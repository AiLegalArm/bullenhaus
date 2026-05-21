/**
 * worker.guard.ts — API key authentication for the Worker service
 *
 * The Worker service is NOT a JWT-based user.
 * It authenticates via the X-API-Key header using WORKER_API_KEY from .env.
 *
 * Worker endpoints are under /api/v1/internal/* and must NEVER
 * be reachable from the public internet — place them behind a firewall
 * or internal network in production.
 */

import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { WORKER_API_KEY } from '../../config/env.js';

/**
 * requireWorkerApiKey — validates the X-API-Key header.
 *
 * Uses timing-safe comparison to prevent timing attacks.
 * Returns 401 if the key is missing or wrong.
 *
 * Apply to all /api/v1/internal/* routes.
 */
export function requireWorkerApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const provided = req.headers['x-api-key'];

  if (!provided || typeof provided !== 'string') {
    res.status(401).json({ message: 'X-API-Key header is required' });
    return;
  }

  // Timing-safe comparison
  let isValid = false;
  try {
    const expected = Buffer.from(WORKER_API_KEY, 'utf8');
    const given = Buffer.from(provided, 'utf8');
    isValid =
      expected.length === given.length &&
      timingSafeEqual(expected, given);
  } catch {
    isValid = false;
  }

  if (!isValid) {
    // Deliberate delay to slow brute-force — don't remove
    setTimeout(() => {
      res.status(401).json({ message: 'Invalid API key' });
    }, 200);
    return;
  }

  next();
}

/**
 * validateSyncWebhook — validates the X-Sync-Signature header.
 *
 * For CRM↔Trading webhook calls that carry a HMAC-SHA256 signature.
 * The signature is computed as: HMAC-SHA256(SYNC_WEBHOOK_SECRET, body).
 */
export async function validateSyncWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const signature = req.headers['x-sync-signature'];
  if (!signature || typeof signature !== 'string') {
    res.status(401).json({ message: 'X-Sync-Signature header is required' });
    return;
  }

  try {
    const { createHmac } = await import('crypto');
    const secret = process.env['SYNC_WEBHOOK_SECRET'];
    if (!secret) {
      res.status(500).json({ message: 'Webhook secret not configured' });
      return;
    }

    const body =
      req.body && typeof req.body === 'object'
        ? JSON.stringify(req.body)
        : String(req.body ?? '');

    const expected = createHmac('sha256', secret).update(body).digest('hex');
    const expectedBuf = Buffer.from(`sha256=${expected}`, 'utf8');
    const givenBuf = Buffer.from(signature, 'utf8');

    const match =
      expectedBuf.length === givenBuf.length &&
      timingSafeEqual(expectedBuf, givenBuf);

    if (!match) {
      res.status(401).json({ message: 'Webhook signature invalid' });
      return;
    }

    next();
  } catch (err) {
    console.error('[worker.guard] Webhook validation error:', err);
    res.status(500).json({ message: 'Internal error validating webhook' });
  }
}
