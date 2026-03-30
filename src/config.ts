/** Replace with your Pump.fun coin URL after launch */
export const PUMP_FUN_URL =
  import.meta.env.VITE_PUMP_FUN_URL ?? 'https://pump.fun'

/** Optional: X (Twitter), Telegram, Discord */
export const SOCIAL = {
  x: import.meta.env.VITE_SOCIAL_X ?? 'https://x.com/until_i_winX',
  telegram: import.meta.env.VITE_SOCIAL_TELEGRAM ?? '',
  discord: import.meta.env.VITE_SOCIAL_DISCORD ?? '',
} as const

/** Solana contract address (optional) */
export const TOKEN_CA =
  import.meta.env.VITE_TOKEN_CA ?? '3ti4A5yXh9iaQ4zNkpq6vKtyzqY1xcD8DdddcGKrpump'
