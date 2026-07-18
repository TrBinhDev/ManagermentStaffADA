// Script chi dung cho test thu cong (test-department.ps1, test-position.ps1), khong phai code app.
// Cac module lien quan (position, employee) chua code het nen can insert/xoa truc tiep
// qua Prisma de test cac case DELETE bi chan boi Restrict khi con record tham chieu.
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
  } else if (cmd === 'create-employee') {
    const stamp = Date.now().toString();
    const employee = await prisma.employee.create({
      data: {
        code: `TEST-${stamp}`,
        cccdHash: `test-hash-${stamp}`,
        fullName: 'Test Employee Fixture',
        positionId: arg,
      },
    });
    console.log(employee.id);
  } else if (cmd === 'delete-employee') {
    await prisma.employee.delete({ where: { id: arg } });
    console.log('deleted');
  } else if (cmd === 'get-employee-profile') {
    const profile = await prisma.employeeProfile.findUnique({ where: { employeeId: arg } });
    console.log(JSON.stringify(profile));
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
