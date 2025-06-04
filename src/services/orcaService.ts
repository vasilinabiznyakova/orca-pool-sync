import axios from 'axios';

import { upsertAllPoolsData } from '../services/poolUpdater';

// Small sleep helper
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ORCA_API_URL =
  process.env.ORCA_API_URL || 'https://api.orca.so/v2/solana';

// Fetch a single page with retry logic
async function fetchPoolsPage(
  afterCursor: string | null = null,
  attempt = 1
): Promise<any> {
  const params: Record<string, any> = {
    size: 1000, // max batch size
  };
  if (afterCursor) {
    params.after = afterCursor;
  }

  try {
    const response = await axios.get(`${ORCA_API_URL}/pools`, { params });
    return response.data;
  } catch (error: any) {
    console.error(
      `❌ Error fetching page (attempt ${attempt}):`,
      error?.response?.status || error.message
    );

    if (attempt < 3) {
      console.log(`🔄 Retrying after 3 seconds (attempt ${attempt + 1})...`);
      await sleep(2000);
      return fetchPoolsPage(afterCursor, attempt + 1); // retry same page
    } else {
      console.error(`❌ Failed after 3 attempts. Stopping sync.`);
      throw error; // rethrow to upper-level catch
    }
  }
}

// Fetch all pools with pagination
export async function fetchAllPools() {
  let afterCursor: string | null = null;
  let page = 1;
  let poolsQty = 0;

  try {
    do {
      console.log(`📦 Fetching page ${page}...`);
      const data = await fetchPoolsPage(afterCursor);

      if (!data?.data) {
        console.warn('⚠️ No data received, stopping.');
        break;
      }

      console.log(`✅ Received ${data.data.length} pools.`);
      poolsQty += data.data.length;

      // here we need update pools in db

      // await upsertAllPoolsData(data.data);
      //TO_DO REMOVE
      await upsertAllPoolsData([data.data[0]]);

      afterCursor = data.meta?.cursor?.next ?? null;

      if (afterCursor) {
        console.log(`➡️ Next cursor: ${afterCursor}`);
      } else {
        console.log('🏁 No more pages to fetch.');
      }

      page++;
    // } while (afterCursor);
    //TO_DO REMOVE
    } while (false);

    console.log(`Total quantity of pools fetched: ${poolsQty}`);
  } catch (error) {
    console.error('❌ Aborting full fetch due to repeated errors.');
  }
}

export async function upsertRewards(pools: any[]) {
  const rewards = [];

  for (const pool of pools) {
    if (pool.rewards && Array.isArray(pool.rewards)) {
      for (const reward of pool.rewards) {
        rewards.push({
          pool_address: pool.address,
          mint: reward.mint,
          vault: reward.vault,
          growth_global_x64: reward.growth_global_x64,
          active: reward.active,
        });
      }
    }
  }

  console.log(`🏆 Upserting ${rewards.length} rewards into DB...`);

  if (rewards.length > 0) {
    await prisma.$transaction(
      rewards.map((reward) =>
        prisma.reward.upsert({
          where: {
            pool_address_mint: {
              // 👈 composite unique key: pool_address + mint
              pool_address: reward.pool_address,
              mint: reward.mint,
            },
          },
          update: {
            vault: reward.vault,
            growth_global_x64: reward.growth_global_x64,
            active: reward.active,
          },
          create: reward,
        })
      )
    );
  }

  console.log(`✅ Rewards upsert complete.`);
}
