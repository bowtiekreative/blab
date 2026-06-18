import { config } from '../config.js';

let client = null;

export function stripeEnabled() {
  return config.stripe.enabled;
}

/**
 * Lazily construct the Stripe client (only when a key is configured). Returns
 * null in dev/simulated mode so callers can branch without crashing at startup.
 */
export async function getStripe() {
  if (!config.stripe.enabled) return null;
  if (!client) {
    const { default: Stripe } = await import('stripe');
    client = new Stripe(config.stripe.secretKey);
  }
  return client;
}
