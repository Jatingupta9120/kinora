/** Maturity ratings, lowest to highest. Order matters: it defines what a ceiling allows. */
export const MATURITY = ['all', '7+', '13+', '16+', '18+'] as const;
export type Maturity = (typeof MATURITY)[number];

/** `free` titles play on any plan; `premium` titles need the Premium plan. */
export const TIERS = ['free', 'premium'] as const;
export type Tier = (typeof TIERS)[number];
