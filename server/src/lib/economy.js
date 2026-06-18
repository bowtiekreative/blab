// Economy constants (api/tokens.md, api/monetization.md).

export const TOKENS_PER_DOLLAR = 100; // 100 ⏣ = $1.00

export const CASH_OUT = {
  minTokens: 1000, // 1,000 ⏣ ($10)
  platformFeeRate: 0.15, // 15% on token → cash
  maxCentsPerMonth: 50000, // $500
};

// Recipient's share of a gift's value, credited as earnings.
// NOTE: api/tokens.md's earning table says "10% of value"; the flow diagram in
// monetization.md implies 85% (after a 15% fee). We follow the explicit earning
// table here — change this one constant to switch models.
export const GIFT_EARN_RATE = 0.1;

export const CLAP_EARN_TOKENS = 1; // ⏣ earned per clap received
export const FREE_CLAPS_PER_ROOM = 20; // free clap cap per user per room

/** Gift catalog: type -> { icon, cost (⏣), animation }. */
export const GIFT_CATALOG = {
  fire: { icon: '🔥', cost: 50, animation: 'flame' },
  heart: { icon: '❤️', cost: 100, animation: 'floating_hearts' },
  crown: { icon: '👑', cost: 500, animation: 'crown' },
  rocket: { icon: '🚀', cost: 1000, animation: 'rocket' },
  diamond: { icon: '💎', cost: 2500, animation: 'diamond_burst' },
  hustle_zone: { icon: '🏆', cost: 5000, animation: 'trophy' },
  spotlight: { icon: '⭐', cost: 10000, animation: 'pin_fullscreen' },
};

export const tokensToCents = (tokens) => Math.round((tokens / TOKENS_PER_DOLLAR) * 100);
