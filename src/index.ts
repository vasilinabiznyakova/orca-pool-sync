import dotenv from 'dotenv';
import { runInitialSync, startCronJob } from './jobs/syncPools';

dotenv.config();

async function bootstrap() {
  console.log('🚀 Starting Orca Pool Sync Service...');

  await runInitialSync();
  startCronJob();
}

bootstrap();
