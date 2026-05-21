/**
 * domain.guard.ts — Domain isolation middleware
 *
 * Enforces that CRM users cannot reach Trading routes and vice versa.
 * This is the second layer of defense (after RLS at the DB level).
 *
 * Usage:
 *   router.use(requireAuth, requireCrmDomain)   // all CRM routes
 *   router.use(requireAuth, requireTradingDomain) // all Trading routes
 *   router.use(requireAuth, requireSuperAdmin)  // admin-only routes
 */

import type { Request, Response, NextFunction } from 'express';
import { canAccessCrm, canAccessTrading, canAccessAdmin } from '../../lib/rbac/access.js';

/**
 * Allows only users with domain = 'CRM' or 'BOTH' (Super Admin).
 */
export function requireCrmDomain(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!canAccessCrm(req.user.domain)) {
    res.status(403).json({
      message: 'Forbidden: CRM domain access required',
      yourDomain: req.user.domain,
    });
    return;
  }

  next();
}

/**
 * Allows only users with domain = 'TRADING' or 'BOTH' (Super Admin).
 */
export function requireTradingDomain(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!canAccessTrading(req.user.domain)) {
    res.status(403).json({
      message: 'Forbidden: Trading domain access required',
      yourDomain: req.user.domain,
    });
    return;
  }

  next();
}

/**
 * Allows only SUPER_ADMIN users.
 */
export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!canAccessAdmin(req.user.systemRole)) {
    res.status(403).json({
      message: 'Forbidden: Super Admin access required',
    });
    return;
  }

  next();
}

/**
 * Validates that the requested resource belongs to the user's own domain.
 * E.g., a TRADER can only access their own trading account (scoped by userId).
 *
 * Apply this AFTER requireAuth and AFTER domain guards.
 * Returns a 403 if req.user.id !== the resource's ownerId.
 */
export function requireOwnership(getOwnerId: (req: Request) => string | undefined) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const ownerId = getOwnerId(req);
    if (ownerId && ownerId !== req.user.id && req.user.systemRole !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Forbidden: resource belongs to another user' });
      return;
    }

    next();
  };
}
