import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OWNER_EMAIL = 'owner@ada.local';
const OWNER_PASSWORD = 'Owner@123';

async function main() {
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 10);

  const owner = await prisma.managerAccount.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: {
      email: OWNER_EMAIL,
      passwordHash,
      role: 'OWNER',
      isActive: true,
    },
  });

  console.log('Seeded OWNER account:');
  console.log({ email: owner.email, password: OWNER_PASSWORD });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
