import { randomBytes, createHash } from "crypto";

export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
export const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000; // 1 menit

export function generateVerificationToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  return { rawToken, tokenHash, expiresAt };
}

export function hashVerificationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
