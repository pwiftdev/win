/** Replace with your Pump.fun coin URL after launch */
export const PUMP_FUN_URL =
  import.meta.env.VITE_PUMP_FUN_URL ?? 'https://pump.fun'

/** Optional: X (Twitter), Telegram, Discord */
export const SOCIAL = {
  x: import.meta.env.VITE_SOCIAL_X ?? '',
  telegram: import.meta.env.VITE_SOCIAL_TELEGRAM ?? '',
  discord: import.meta.env.VITE_SOCIAL_DISCORD ?? '',
} as const
