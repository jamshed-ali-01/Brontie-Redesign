import Stripe from 'stripe';
import { getMaintenanceStatus } from './mongodb';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

// Default export uses LIVE key for build time safety
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

// Dynamic getter for API routes
export const getStripe = async () => {
  const { maintenanceMode } = await getMaintenanceStatus();

  let secretKey = process.env.STRIPE_SECRET_KEY;
  if (maintenanceMode) {
    if (!process.env.STRIPE_SECRET_KEY_LOCAL) {
      throw new Error('CRITICAL SECURITY ERROR: Maintenance Mode is ON but STRIPE_SECRET_KEY_LOCAL is not defined. Cannot safely process payments.');
    }
    secretKey = process.env.STRIPE_SECRET_KEY_LOCAL;
  }

  if (!secretKey) throw new Error('Stripe Secret Key missing');

  return new Stripe(secretKey, {
    apiVersion: '2025-05-28.basil',
  });
}

export const getStripePublishableKey = async () => {
  const { maintenanceMode } = await getMaintenanceStatus();

  if (maintenanceMode) {
    if (!process.env.STRIPE_PUBLISHABLE_KEY_LOCAL) {
      throw new Error('CRITICAL SECURITY ERROR: Maintenance Mode is ON but STRIPE_PUBLISHABLE_KEY_LOCAL is not defined.');
    }
    return process.env.STRIPE_PUBLISHABLE_KEY_LOCAL;
  }

  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new Error('STRIPE_PUBLISHABLE_KEY is not set');
  }
  return process.env.STRIPE_PUBLISHABLE_KEY;
};
