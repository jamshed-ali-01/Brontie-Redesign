import { stripe } from './stripe';

/**
 * Get actual Stripe fee from balance transaction
 * This replaces the estimated 1.4% fee with the real fee from Stripe
 */
export async function getActualStripeFee(paymentIntentId: string): Promise<number> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent.latest_charge) {
      console.warn('No latest charge found for payment intent:', paymentIntentId);
      return 0;
    }
    
    const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
    
    if (!charge.balance_transaction) {
      console.warn('No balance transaction found for charge:', charge.id);
      return 0;
    }
    
    const balanceTransaction = await stripe.balanceTransactions.retrieve(charge.balance_transaction as string);
    
    // Find the Stripe platform fee (not merchant-specific fees)
    const stripeFee = balanceTransaction.fee_details.find(fee => fee.type === 'stripe_fee');
    
    if (stripeFee) {
      const actualFee = stripeFee.amount / 100; // Convert from cents
      console.log('Actual Stripe fee retrieved:', actualFee, 'for payment intent:', paymentIntentId);
      return actualFee;
    }
    
    console.warn('No Stripe fee found in balance transaction:', balanceTransaction.id);
    return 0;
    
  } catch (error) {
    console.error('Error retrieving actual Stripe fee:', error);
    // Return 0 instead of throwing to avoid breaking the flow
    return 0;
  }
}

/**
 * Get estimated Stripe fee as fallback
 * Uses the standard 1.4% + €0.25 fee structure
 */
export function getEstimatedStripeFee(amount: number): number {
  return (amount * 0.014) + 0.25;
}

/**
 * Get Stripe fee (actual if possible, estimated as fallback)
 */
export async function getStripeFee(paymentIntentId: string, amount: number): Promise<number> {
  const actualFee = await getActualStripeFee(paymentIntentId);
  
  if (actualFee > 0) {
    return actualFee;
  }
  
  // Fallback to estimated fee
  console.warn('Using estimated Stripe fee for payment intent:', paymentIntentId);
  return getEstimatedStripeFee(amount);
}
