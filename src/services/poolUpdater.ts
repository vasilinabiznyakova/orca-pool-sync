import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function upsertPools(pools: any[]) {
    console.log("here we will add pools to DB");
    
//   for (const pool of pools) {
//     await prisma.pool.upsert({
//       where: { address: pool.address },
//       update: {
//         tokenA: pool.tokenA,
//         tokenB: pool.tokenB,
//         liquidity: pool.liquidity,
//       },
//       create: {
//         address: pool.address,
//         tokenA: pool.tokenA,
//         tokenB: pool.tokenB,
//         liquidity: pool.liquidity,
//       },
//     });
//   }
}
