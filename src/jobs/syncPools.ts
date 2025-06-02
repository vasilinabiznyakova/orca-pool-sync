import cron from 'node-cron';
import { fetchAllPools } from '../services/orcaService';

const cronExpression = process.env.SYNC_CRON || '*/5 * * * *'; // every 5 minutes

// Run once at startup
export async function runInitialSync() {
  console.log('🔄 Initial full sync started...');
  await fetchAllPools();
  console.log('✅ Initial full sync completed.');
}

// Start scheduled job
export function startCronJob() {
  console.log('🕒 Setting up scheduled sync job...');
  cron.schedule(cronExpression, async () => {
    console.log('🕒 Scheduled sync job started...');
    try {
      await fetchAllPools();
      console.log('✅ Scheduled sync job completed.');
    } catch (error) {
      console.error(`❌ Scheduled sync job failed:`, error);
    }
  });
}
