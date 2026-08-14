import { randomBytes, createHash } from "crypto";

export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 jam
export const PASSWORD_RESET_RESEND_COOLDOWN_MS = 60 * 1000; // 1 menit

export function generatePasswordResetToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
  return { rawToken, tokenHash, expiresAt };
}

export function hashPasswordResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
