import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl })
});


function transferMessage(currentProviderId: string, desiredProviderId: string) {
  return [
    '- Email ваучера:            parent@example.com',
    `- ID текущего поставщика:   ${currentProviderId}`,
    `- ID желаемого поставщика:  ${desiredProviderId}`,
    '- Текущий вид спорта:       Футбол',
    '- Желаемый вид спорта:      Баскетбол'
  ].join('\n');
}

async function main() {
  await prisma.enrollment.deleteMany();
  await prisma.appealChild.deleteMany();
  await prisma.appeal.deleteMany();
  await prisma.athleteProfile.deleteMany();
  await prisma.sportsCenterProgram.deleteMany();

  await prisma.sportsCenterProgram.createMany({
    data: [
      { id: 'prog-1', sportsCenterId: 'center-1', sportType: 'FOOTBALL', capacity: 10 },
      { id: 'prog-2', sportsCenterId: 'center-2', sportType: 'BASKETBALL', capacity: 10 },
      { id: 'prog-3', sportsCenterId: 'center-2', sportType: 'FOOTBALL', capacity: 8 },
      { id: 'prog-4', sportsCenterId: 'center-3', sportType: 'BASKETBALL', capacity: 3 },
      { id: 'prog-5', sportsCenterId: 'center-3', sportType: 'SWIMMING', capacity: 12 }
    ]
  });

  await prisma.athleteProfile.createMany({
    data: [
      { id: 'ath-1', iin: '111111111111' },
      { id: 'ath-2', iin: '222222222222' },
      { id: 'ath-3', iin: '333333333333' },
      { id: 'ath-4', iin: '444444444444' },
      { id: 'ath-5', iin: '555555555555' }
    ]
  });

  await prisma.appeal.createMany({
    data: [
      {
        id: 'appeal-1',
        category: 'CHANGE_PROVIDER',
        status: 'OPEN',
        message: transferMessage('center-1', 'center-2')
      },
      {
        id: 'appeal-2',
        category: 'CHANGE_PROVIDER',
        status: 'OPEN',
        message: transferMessage('center-1', 'center-3')
      },
      {
        id: 'appeal-3',
        category: 'CHANGE_PROVIDER',
        status: 'RESOLVED',
        message: transferMessage('center-2', 'center-1')
      }
    ]
  });

  await prisma.appealChild.createMany({
    data: [
      { id: 'child-1', appealId: 'appeal-1', childIin: '111111111111', childName: 'Child One' },
      { id: 'child-2', appealId: 'appeal-1', childIin: '222222222222', childName: 'Child Two' },
      { id: 'child-3', appealId: 'appeal-2', childIin: '333333333333', childName: 'Child Three' },
      { id: 'child-4', appealId: 'appeal-2', childIin: '444444444444', childName: 'Child Four' },
      { id: 'child-5', appealId: 'appeal-3', childIin: '555555555555', childName: 'Child Five' }
    ]
  });

  await prisma.enrollment.createMany({
    data: [
      {
        id: 'enr-1',
        athleteProfileId: 'ath-1',
        sportsCenterId: 'center-1',
        programId: 'prog-1',
        status: 'APPROVED',
        parent: 'parent-1'
      },
      {
        id: 'enr-2',
        athleteProfileId: 'ath-2',
        sportsCenterId: 'center-1',
        programId: 'prog-1',
        status: 'APPROVED',
        parent: 'parent-1'
      },
      {
        id: 'enr-3',
        athleteProfileId: 'ath-3',
        sportsCenterId: 'center-1',
        programId: 'prog-1',
        status: 'APPROVED',
        parent: 'parent-2'
      },
      {
        id: 'enr-4',
        athleteProfileId: 'ath-4',
        sportsCenterId: 'center-2',
        programId: 'prog-2',
        status: 'PENDING',
        parent: 'parent-3'
      },
      {
        id: 'enr-5',
        athleteProfileId: 'ath-5',
        sportsCenterId: 'center-2',
        programId: 'prog-2',
        status: 'APPROVED',
        parent: 'parent-4'
      }
    ]
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
