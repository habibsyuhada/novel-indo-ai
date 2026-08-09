export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 3-20 karakter, huruf/angka/underscore, harus diawali huruf
export const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
export const USERNAME_HINT = "3-20 karakter, diawali huruf, hanya huruf/angka/underscore";

// Minimal 8 karakter, ada huruf dan ada angka
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_HINT = "Minimal 8 karakter, mengandung huruf dan angka";

export function isPasswordValid(password: string): boolean {
  if (password.length < PASSWORD_MIN_LENGTH) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

export const COMMENT_MIN_LENGTH = 2;
export const COMMENT_MAX_LENGTH = 1000;
