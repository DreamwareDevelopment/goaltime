import Stripe from 'stripe';

const API_KEY = process.env.STRIPE_API_KEY
if (!API_KEY) {
  throw new Error('Stripe not configured correctly');
}

export const stripe = new Stripe(API_KEY);
