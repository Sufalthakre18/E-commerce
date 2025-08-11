import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { name: 'CUSTOMER' },
      { name: 'ADMIN' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Roles seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());