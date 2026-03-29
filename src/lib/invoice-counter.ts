import Counter from '@/models/Counter';
import { connectToDatabase } from './mongodb';

/**
 * Gets the next invoice number in the sequence
 * Uses atomic increment to ensure uniqueness in concurrent environments
 * Starts from 100 and increments sequentially
 *
 * @returns The next invoice number
 */
export async function getNextInvoiceNumber(): Promise<number> {
  try {
    await connectToDatabase();

    // Use findOneAndUpdate with $inc for atomic increment
    // upsert: true ensures the counter is created if it doesn't exist
    // new: true returns the updated document
    const counter = await Counter.findOneAndUpdate(
      { name: 'invoice' },
      { $inc: { sequence: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );


    if (!counter) {
      throw new Error('Failed to generate invoice number');
    }

    return counter.sequence;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    throw new Error('Failed to generate invoice number');
  }
}

/**
 * Gets the current invoice number without incrementing
 * Useful for checking what the next number will be
 *
 * @returns The current invoice number
 */
export async function getCurrentInvoiceNumber(): Promise<number> {
  try {
    await connectToDatabase();

    const counter = await Counter.findOne({ name: 'invoice' });

    // If counter doesn't exist yet, return 99 (next will be 100)
    return counter?.sequence || 99;
  } catch (error) {
    console.error('Error getting current invoice number:', error);
    return 99;
  }
}
