// Shared constants — single source of truth for pricing, limits, and validation

// --- Pricing ---
export const PRICING = {
  BOT_ACTIVATION_AMOUNT_PAISE: 1999 * 100, // Amount in smallest currency unit (paise)
  BOT_ACTIVATION_AMOUNT_INR: 1999,
  CURRENCY: "INR",
} as const;

// --- Limits ---
export const LIMITS = {
  MAX_BOTS_PER_USER: 10,
  MAX_SYSTEM_PROMPT_LENGTH: 4000,
  MAX_CHAT_MESSAGE_LENGTH: 2000,
  MAX_CHAT_HISTORY_ITEMS: 20,
  MAX_NAME_LENGTH: 100,
  MAX_LEADS_PER_PAGE: 50,
} as const;

// --- Validation ---
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Digits and optional + sign, 7-20 chars
  PHONE_REGEX: /^\+?[\d\s-]{7,20}$/,
  PASSWORD_MIN_LENGTH: 8,
} as const;

// --- SSRF Protection ---
// Block requests to private/reserved IP ranges and common internal hostnames
export const SSRF_BLOCKED_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/0\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,             // AWS metadata
  /^https?:\/\/\[::1\]/,               // IPv6 loopback
  /^https?:\/\/metadata\.google/i,      // GCP metadata
  /^https?:\/\/100\.100\.100\.200/,     // Alibaba metadata
] as const;

export function isSSRFTarget(url: string): boolean {
  return SSRF_BLOCKED_PATTERNS.some(pattern => pattern.test(url));
}
