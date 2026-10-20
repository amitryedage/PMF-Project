import crypto from 'crypto';
import { query } from '../../config/db';
import { comparePassword, hashPassword } from '../../utils/crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from '../../utils/token';
import { LoginInput, ChangePasswordInput } from './auth.schema';

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export class AuthService {
  async login(input: LoginInput) {
    const userRes = await query(
      `SELECT id, email, roll_number, password_hash, role, must_change_password, 
              is_active, failed_login_attempts, locked_until
       FROM users 
       WHERE (LOWER(email) = LOWER($1) OR roll_number = $1) AND deleted_at IS NULL`,
      [input.identifier.trim()]
    );

    if (userRes.rowCount === 0) {
      throw new Error('Invalid credentials');
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      throw new Error('Account is deactivated. Contact administration.');
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('Account is temporarily locked due to failed attempts. Try again later.');
    }

    const isPasswordValid = await comparePassword(input.password, user.password_hash);

    if (!isPasswordValid) {
      const attempts = user.failed_login_attempts + 1;
      const shouldLock = attempts >= 5;
      const lockedUntil = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await query(
        `UPDATE users 
         SET failed_login_attempts = $1, locked_until = $2 
         WHERE id = $3`,
        [attempts, lockedUntil, user.id]
      );

      throw new Error('Invalid credentials');
    }

    if (user.failed_login_attempts > 0 || user.locked_until) {
      await query(
        `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
        [user.id]
      );
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      rollNumber: user.roll_number,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    const refreshTokenHash = hashToken(refreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshTokenHash, expiresAt]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        rollNumber: user.roll_number,
        mustChangePassword: user.must_change_password,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(oldRefreshToken: string) {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const oldTokenHash = hashToken(oldRefreshToken);
    const tokenRes = await query(
      `SELECT id, revoked_at, expires_at 
       FROM refresh_tokens 
       WHERE user_id = $1 AND token_hash = $2`,
      [payload.userId, oldTokenHash]
    );

    if (tokenRes.rowCount === 0) {
      throw new Error('Refresh token not recognized');
    }

    const tokenRecord = tokenRes.rows[0];

    // Reuse detection: if a revoked token is used, revoke all sessions
    if (tokenRecord.revoked_at !== null) {
      await query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1`,
        [payload.userId]
      );
      throw new Error('Suspicious session activity detected. Please login again.');
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw new Error('Refresh token has expired');
    }

    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`,
      [tokenRecord.id]
    );

    const tokenPayload: TokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      rollNumber: payload.rollNumber,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);
    const newTokenHash = hashToken(newRefreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [payload.userId, newTokenHash, expiresAt]
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await query(
        `UPDATE refresh_tokens SET revoked_at = NOW() 
         WHERE user_id = $1 AND token_hash = $2`,
        [userId, tokenHash]
      );
    } else {
      await query(
        `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1`,
        [userId]
      );
    }
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const userRes = await query(
      `SELECT id, password_hash FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (userRes.rowCount === 0) {
      throw new Error('User not found');
    }

    const user = userRes.rows[0];
    const isCurrentValid = await comparePassword(input.currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw new Error('Current password is incorrect');
    }

    const newHash = await hashPassword(input.newPassword);
    await query(
      `UPDATE users 
       SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() 
       WHERE id = $2`,
      [newHash, userId]
    );

    // Invalidate other active sessions on password change
    await query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1`,
      [userId]
    );
  }

  async getCurrentUser(userId: string) {
    const userRes = await query(
      `SELECT u.id, u.email, u.roll_number, u.role, u.must_change_password,
              s.first_name, s.last_name, s.current_year, s.current_division, s.status as student_status,
              p.name as program_name, p.code as program_code
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id AND s.deleted_at IS NULL
       LEFT JOIN programs p ON p.id = s.program_id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId]
    );

    if (userRes.rowCount === 0) {
      throw new Error('User not found');
    }

    return userRes.rows[0];
  }
}

export const authService = new AuthService();
