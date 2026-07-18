// Script chi dung cho test thu cong (test-department.ps1), khong phai code app.
// Position module chua code nen can insert/xoa truc tiep qua Prisma de test case
// DELETE /departments/:id bi chan boi Restrict khi con Position tham chieu.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const [, , cmd, arg] = process.argv;

async function main() {
  if (cmd === 'create-position') {
    const position = await prisma.position.create({
      data: { name: `TestPos-${Date.now()}`, departmentId: arg },
    });
    console.log(position.id);
  } else if (cmd === 'delete-position') {
    await prisma.position.delete({ where: { id: arg } });
    console.log('deleted');
  } else {
    throw new Error(`Unknown command: ${cmd}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
