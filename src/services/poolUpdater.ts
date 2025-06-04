import { PrismaClient } from '@prisma/client';
import pLimit from 'p-limit';

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 30000,
    timeout: 30000,
  },
});
const limit = pLimit(3); // 3 parallel chunks

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function safeUpsert(fn: () => Promise<any>, logContext: string) {
  try {
    await fn();
  } catch (error) {
    const err = error as Error;
    console.error(`❌ Error during upsert ${logContext}:`, err.message || err);
    console.error(err.stack);
  }
}

async function processPoolChunk(poolChunk: any[], chunkIndex: number) {
  console.log(
    `🚀 Processing chunk #${chunkIndex + 1} (${poolChunk.length} pools)...`
  );

  const tokensMap = new Map<string, any>();
  const pools = [];
  const rewards = [];
  const stats = [];

  for (const pool of poolChunk) {
    if (pool.tokenA) {
      tokensMap.set(pool.tokenA.address, {
        address: pool.tokenA.address,
        program_id: pool.tokenA.programId,
        image_url: pool.tokenA.imageUrl,
        name: pool.tokenA.name,
        symbol: pool.tokenA.symbol,
        decimals: pool.tokenA.decimals,
      });
    }
    if (pool.tokenB) {
      tokensMap.set(pool.tokenB.address, {
        address: pool.tokenB.address,
        program_id: pool.tokenB.programId,
        image_url: pool.tokenB.imageUrl,
        name: pool.tokenB.name,
        symbol: pool.tokenB.symbol,
        decimals: pool.tokenB.decimals,
      });
    }

    pools.push({
      address: pool.address,
      tick_spacing: pool.tickSpacing,
      fee_rate: pool.feeRate,
      liquidity: pool.liquidity,
      sqrt_price: pool.sqrtPrice,
      tick_current_index: pool.tickCurrentIndex,
      has_warning: pool.hasWarning,
      price: pool.price ?? null,
      tvl_usdc: pool.tvlUsdc ?? null,
      yield_over_tvl: pool.yieldOverTvl ?? null,
      trade_enable_timestamp: pool.tradeEnableTimestamp
        ? pool.tradeEnableTimestamp
        : '',
      token_mint_a: pool.tokenMintA,
      token_mint_b: pool.tokenMintB,
      token_vault_a: pool.tokenVaultA,
      token_vault_b: pool.tokenVaultB,
      token_balance_a: pool.tokenBalanceA,
      token_balance_b: pool.tokenBalanceB,
    });

    if (Array.isArray(pool.rewards)) {
      for (const reward of pool.rewards) {
        rewards.push({
          pool_address: pool.address,
          mint: reward.mint,
          vault: reward.vault,
          growth_global_x64: reward.growth_global_x64 ?? null,
          active: reward.active,
        });
      }
    }

    if (pool.stats) {
      const periods = ['24h', '7d', '30d'];
      for (const period of periods) {
        const stat = pool.stats[period];
        if (stat) {
          stats.push({
            pool_address: pool.address,
            period,
            volume: stat.volume ?? null,
            fees: stat.fees ?? null,
            rewards: stat.rewards ?? null,
            yield_over_tvl: stat.yieldOverTvl ?? null,
          });
        }
      }
    }
  }

  const tokens = Array.from(tokensMap.values());

  // 1. First tokens - in the transaction
  await prisma.$transaction(async (tx) => {
    await Promise.all(
      tokens.map((token) =>
        safeUpsert(
          () =>
            tx.token.upsert({
              where: { address: token.address },
              update: {
                program_id: token.program_id,
                image_url: token.image_url,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
              },
              create: token,
            }),
          `token ${token.address}`
        )
      )
    );
  });

  // 2. Now the pools - we are waiting for the end
  await Promise.all(
    pools.map((pool) =>
      safeUpsert(
        () =>
          prisma.pool.upsert({
            where: { address: pool.address },
            update: {
              fee_rate: pool.fee_rate,
              liquidity: pool.liquidity,
              sqrt_price: pool.sqrt_price,
              tick_current_index: pool.tick_current_index,
              has_warning: pool.has_warning,
              price: pool.price,
              tvl_usdc: pool.tvl_usdc,
              yield_over_tvl: pool.yield_over_tvl,
              trade_enable_timestamp: pool.trade_enable_timestamp,
            },
            create: {
              address: pool.address,
              tick_spacing: pool.tick_spacing,
              fee_rate: pool.fee_rate,
              liquidity: pool.liquidity,
              sqrt_price: pool.sqrt_price,
              tick_current_index: pool.tick_current_index,
              has_warning: pool.has_warning,
              price: pool.price,
              tvl_usdc: pool.tvl_usdc,
              yield_over_tvl: pool.yield_over_tvl,
              trade_enable_timestamp: pool.trade_enable_timestamp,
              token_vault_a: pool.token_vault_a,
              token_vault_b: pool.token_vault_b,
              token_balance_a: pool.token_balance_a,
              token_balance_b: pool.token_balance_b,
              tokenA: {
                connect: { address: pool.token_mint_a },
              },
              tokenB: {
                connect: { address: pool.token_mint_b },
              },
            },
          }),
        `pool ${pool.address}`
      )
    )
  );

  // 3. Now you can safely insert rewards
  await Promise.all(
    rewards.map((reward) =>
      safeUpsert(
        () =>
          prisma.reward.upsert({
            where: {
              pool_address_mint: {
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
          }),
        `reward ${reward.pool_address}/${reward.mint}`
      )
    )
  );

  // 4. And then stats
  await Promise.all(
    stats.map((stat) =>
      safeUpsert(
        () =>
          prisma.stat.upsert({
            where: {
              pool_address_period: {
                pool_address: stat.pool_address,
                period: stat.period,
              },
            },
            update: {
              volume: stat.volume,
              fees: stat.fees,
              rewards: stat.rewards,
              yield_over_tvl: stat.yield_over_tvl,
            },
            create: stat,
          }),
        `stat ${stat.pool_address}/${stat.period}`
      )
    )
  );

  console.log(`✅ Successfully processed chunk #${chunkIndex + 1}`);
}

export async function upsertAllPoolsData(pools: any[]) {
  console.log(`🚀 Starting full upsert for ${pools.length} pools...`);

  const chunkSize = 500;
  const chunkedPools = chunkArray(pools, chunkSize);
  const upsertChunkPromises = chunkedPools.map((poolChunk, chunkIndex) =>
    limit(() => processPoolChunk(poolChunk, chunkIndex))
  );

  await Promise.all(upsertChunkPromises);

  await prisma.$disconnect();
  console.log(`🎉 Full upsert finished for ${pools.length} pools.`);
}
