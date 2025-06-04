import dotenv from 'dotenv';
import { runInitialSync, startCronJob } from './jobs/syncPools';

dotenv.config();

async function bootstrap() {
  console.log('🚀 Starting Orca Pool Sync Service...');
  console.time('⏱️ Initial Sync Time');
  await runInitialSync();
  console.timeEnd('⏱️ Initial Sync Time');


  startCronJob();
}

bootstrap();
