/** Order: tiktok23 first, then 1–14, 16–22 (no tiktok15 in repo). */
const AFTER_23 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22] as const

export const TIKTOK_FEED_SOURCES: string[] = [
  '/tiktok23.mp4',
  ...AFTER_23.map((n) => `/tiktok${n}.mp4`),
]
