import CronRun from '@/models/CronRun';
import { connectToDatabase } from './mongodb';

const BIWEEKLY_DAYS = 14;

/**
 * Check if a cron job should run (biweekly - every 14 days)
 * @param cronName - Name of the cron job ('send-reports' | 'process-payouts')
 * @returns Object with shouldRun flag and period dates
 */
export async function shouldRunBiweeklyCron(cronName: string): Promise<{
  shouldRun: boolean;
  periodStart: Date;
  periodEnd: Date;
  daysSinceLastRun?: number;
}> {
  await connectToDatabase();

  const cronRun = await CronRun.findOne({ name: cronName });

  const now = new Date();

  // If never run before, run it and set period to last 14 days
  if (!cronRun) {
    const periodEnd = new Date(now);
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - BIWEEKLY_DAYS);

    return {
      shouldRun: true,
      periodStart,
      periodEnd,
    };
  }

  // Calculate days since last successful run
  const lastRunDate = cronRun.lastSuccessAt || cronRun.lastRunAt;
  const daysSinceLastRun = Math.floor(
    (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Only run if 14+ days have passed
  if (daysSinceLastRun < BIWEEKLY_DAYS) {
    return {
      shouldRun: false,
      periodStart: cronRun.periodStart || lastRunDate,
      periodEnd: cronRun.periodEnd || lastRunDate,
      daysSinceLastRun,
    };
  }

  // Calculate new period (last 14 days from now)
  const periodEnd = new Date(now);
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - BIWEEKLY_DAYS);

  return {
    shouldRun: true,
    periodStart,
    periodEnd,
    daysSinceLastRun,
  };
}

/**
 * Record that a cron job has run
 * @param cronName - Name of the cron job
 * @param status - Status of the run ('success' | 'failed' | 'skipped')
 * @param periodStart - Start date of the period covered
 * @param periodEnd - End date of the period covered
 * @param notes - Optional notes about the run
 */
export async function recordCronRun(
  cronName: string,
  status: 'success' | 'failed' | 'skipped',
  periodStart?: Date,
  periodEnd?: Date,
  notes?: string
): Promise<void> {
  await connectToDatabase();

  const now = new Date();

  await CronRun.findOneAndUpdate(
    { name: cronName },
    {
      $set: {
        lastRunAt: now,
        ...(status === 'success' && { lastSuccessAt: now }),
        status,
        periodStart,
        periodEnd,
        notes,
      },
      $inc: { runCount: 1 },
    },
    { upsert: true, new: true }
  );
}

/**
 * Get the last successful cron run info
 * @param cronName - Name of the cron job
 * @returns The last cron run record or null
 */
export async function getLastCronRun(cronName: string) {
  await connectToDatabase();
  return await CronRun.findOne({ name: cronName });
}
