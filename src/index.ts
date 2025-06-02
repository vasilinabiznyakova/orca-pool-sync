import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRecord() {
  const tokenA = await prisma.token.upsert({
    where: { address: 'TestTokenMintA2' },
    update: {},
    create: {
      address: 'TestTokenMintA2',
      program_id: 'Program3',
      image_url: 'https://example.com/tokenA2.png',
      name: 'Test Token A2',
      symbol: 'TKA2',
      decimals: 9,
    },
  });

  const tokenB = await prisma.token.upsert({
    where: { address: 'TestTokenMintB2' },
    update: {},
    create: {
      address: 'TestTokenMintB2',
      program_id: 'Program4',
      image_url: 'https://example.com/tokenB2.png',
      name: 'Test Token B2',
      symbol: 'TKB2',
      decimals: 6,
    },
  });

  console.log(
    'Tokens created or already exist:',
    tokenA.address,
    tokenB.address
  );

  const newPool = await prisma.pool.create({
    data: {
      address: 'TestPoolAddress2',
      tick_spacing: 32,
      fee_rate: 2500,
      liquidity: '5000000',
      sqrt_price: '79228162514264337593543950336',
      tick_current_index: 1,
      token_mint_a: tokenA.address,
      token_mint_b: tokenB.address,
      token_vault_a: 'TestVaultA2',
      token_vault_b: 'TestVaultB2',
      has_warning: false,
      price: 2.3456,
      tvl_usdc: 200000.0,
      yield_over_tvl: 0.04,
      token_balance_a: 2500.0,
      token_balance_b: 2500.0,
      trade_enable_timestamp: new Date(),
      stats: {
        create: [
          {
            period: '24h',
            volume: 123456.78,
            fees: 1234.56,
            rewards: 567.89,
            yield_over_tvl: 0.02,
          },
        ],
      },
      rewards: {
        create: [
          {
            mint: 'RewardMint1',
            vault: 'RewardVault1',
            growth_global_x64: '5000000',
            active: true,
          },
          {
            mint: 'RewardMint2',
            vault: 'RewardVault2',
            growth_global_x64: '8000000',
            active: false,
          },
        ],
      },
    },
    include: {
      stats: true,
      rewards: true,
    },
  });

  console.log('Created Pool with Stats and Rewards:', newPool);

  const allPools = await prisma.pool.findMany({
    include: {
      tokenA: true,
      tokenB: true,
      stats: true,
      rewards: true,
    },
  });

  console.log('All Pools:', JSON.stringify(allPools, null, 2));
}

testRecord()
  .catch((e) => {
    console.error('Error during database access:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
