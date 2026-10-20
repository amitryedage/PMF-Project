import crypto from 'crypto';
import { query } from '../config/db';

export interface AuditEventParams {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO audit_logs (
        id, actor_user_id, action, entity_type, entity_id, 
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        params.actorUserId || null,
        params.action,
        params.entityType,
        params.entityId,
        params.oldValues ? JSON.stringify(params.oldValues) : null,
        params.newValues ? JSON.stringify(params.newValues) : null,
        params.ipAddress || null,
        params.userAgent || null,
      ]
    );
  } catch (err) {
    // Non-blocking log failure
    console.error('Failed to write audit log event:', err);
  }
}
