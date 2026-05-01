import { query } from './db';

export interface AuditContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditTrail(
  context: AuditContext,
  action: string,
  entityType: string,
  entityId?: string,
  oldValues?: any,
  newValues?: any
) {
  try {
    await query(
      `INSERT INTO audit_logs (
        action, entity_type, entity_id, user_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        action,
        entityType,
        entityId || null,
        context.userId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        context.ipAddress || null,
        context.userAgent || null,
      ]
    );
  } catch (error) {
    console.error('[Audit] Failed to log audit trail:', error);
  }
}
