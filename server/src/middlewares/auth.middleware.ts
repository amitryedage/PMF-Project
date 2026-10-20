import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token';
import { sendError } from '../utils/response';
import { query } from '../config/db';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized: Missing or malformed token', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);

    // Defense-in-depth: Immediate invalidation if user is deactivated or locked
    const userRes = await query(
      `SELECT is_active, locked_until FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.userId]
    );

    if (userRes.rowCount === 0 || !userRes.rows[0].is_active) {
      return sendError(res, 'Unauthorized: Account deactivated or not found', 401);
    }

    if (userRes.rows[0].locked_until && new Date(userRes.rows[0].locked_until) > new Date()) {
      return sendError(res, 'Unauthorized: Account is temporarily locked', 401);
    }

    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Unauthorized: Invalid or expired token', 401);
  }
};
