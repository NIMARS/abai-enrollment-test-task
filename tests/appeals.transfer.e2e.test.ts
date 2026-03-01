import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const APPEAL_ID      = 'a1111111-1111-4111-8111-111111111111';
const OLD_CENTER_ID  = 'b1111111-1111-4111-8111-111111111111';
const NEW_CENTER_ID  = 'c1111111-1111-4111-8111-111111111111';
const OLD_PROGRAM_ID = 'd1111111-1111-4111-8111-111111111111';
const NEW_PROGRAM_ID = 'e1111111-1111-4111-8111-111111111111';

const transferMessage = `
- Email ваучера:            parent@example.com
- ID текущего поставщика:   ${OLD_CENTER_ID}
- ID желаемого поставщика:  ${NEW_CENTER_ID}
- Текущий вид спорта:       Футбол
- Желаемый вид спорта:      Баскетбол
`.trim();

async function cleanDb() {
  await prisma.enrollment.deleteMany();
  await prisma.appealChild.deleteMany();
  await prisma.appeal.deleteMany();
  await prisma.athleteProfile.deleteMany();
  await prisma.sportsCenterProgram.deleteMany();
}

describe('POST /api/appeals/:id/transfer', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanDb();
  });

  it('Переносит всех детей и закрывает обращение', async () => {
    await prisma.sportsCenterProgram.createMany({
      data: [
        { id: OLD_PROGRAM_ID, sportsCenterId: OLD_CENTER_ID, sportType: 'Футбол', capacity: 10 },
        { id: NEW_PROGRAM_ID, sportsCenterId: NEW_CENTER_ID, sportType: 'Баскетбол', capacity: 10 }
      ]
    });

    await prisma.athleteProfile.createMany({
      data: [
        { id: 'ath-1', iin: '111111111111' },
        { id: 'ath-2', iin: '222222222222' }
      ]
    });

    await prisma.enrollment.createMany({
      data: [
        {
          id: 'enr-1',
          athleteProfileId: 'ath-1',
          sportsCenterId: OLD_CENTER_ID,
          programId: OLD_PROGRAM_ID,
          status: 'APPROVED',
          parent: 'enr-1-pt'
        },
        {
          id: 'enr-2',
          athleteProfileId: 'ath-2',
          sportsCenterId: OLD_CENTER_ID,
          programId: OLD_PROGRAM_ID,
          status: 'APPROVED',
          parent: 'enr-2-pt'
        }
      ]
    });

    await prisma.appeal.create({
      data: {
        id: APPEAL_ID,
        category: 'CHANGE_PROVIDER',
        status: 'OPEN',
        message: transferMessage,
        children: {
          create: [
            { id: 'ch-1', childIin: '111111111111', childName: 'Child 1' },
            { id: 'ch-2', childIin: '222222222222', childName: 'Child 2' }
          ]
        }
      }
    });

    const res = await request(app).post(`/api/appeals/${APPEAL_ID}/transfer`).send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.allTransferred).toBe(true);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results.every((r: any) => r.transferred === true)).toBe(true);

    const moved = await prisma.enrollment.findMany({
      where: { programId: NEW_PROGRAM_ID, status: 'PENDING' }
    });
    expect(moved).toHaveLength(2);

    const appeal = await prisma.appeal.findUnique({ where: { id: APPEAL_ID } });
    expect(appeal?.status).toBe('RESOLVED');
  });

  it('Продолжает перенос при ошибке одного ребенка (partial success)', async () => {
    await prisma.sportsCenterProgram.createMany({
      data: [
        { id: OLD_PROGRAM_ID, sportsCenterId: OLD_CENTER_ID, sportType: 'Футбол', capacity: 10 },
        { id: NEW_PROGRAM_ID, sportsCenterId: NEW_CENTER_ID, sportType: 'Баскетбол', capacity: 10 }
      ]
    });

    await prisma.athleteProfile.create({ data: { id: 'ath-1', iin: '111111111111' } });

    await prisma.enrollment.create({
      data: {
        id: 'enr-1',
        athleteProfileId: 'ath-1',
        sportsCenterId: OLD_CENTER_ID,
        programId: OLD_PROGRAM_ID,
        status: 'APPROVED',
        parent: 'enr-1-pt'
      }
    });

    await prisma.appeal.create({
      data: {
        id: APPEAL_ID,
        category: 'CHANGE_PROVIDER',
        status: 'OPEN',
        message: transferMessage,
        children: {
          create: [
            { id: 'ch-1', childIin: '111111111111', childName: 'Child 1' },
            { id: 'ch-2', childIin: '999999999999', childName: 'Child 2' }
          ]
        }
      }
    });

    const res = await request(app).post(`/api/appeals/${APPEAL_ID}/transfer`).send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.allTransferred).toBe(false);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results.some((r: any) => r.transferred === false)).toBe(true);

    const appeal = await prisma.appeal.findUnique({ where: { id: APPEAL_ID } });
    expect(appeal?.status).not.toBe('RESOLVED');
  });

  it('Возвращает ошибку, если в желаемой программе нет мест', async () => {
    await prisma.sportsCenterProgram.create({
      data: {
        id: NEW_PROGRAM_ID,
        sportsCenterId: NEW_CENTER_ID,
        sportType: 'Баскетбол',
        capacity: 1
      }
    });

    await prisma.athleteProfile.create({ data: { id: 'ath-fill', iin: '555555555555' } });
    await prisma.enrollment.create({
      data: {
        id: 'enr-fill',
        athleteProfileId: 'ath-fill',
        sportsCenterId: NEW_CENTER_ID,
        programId: NEW_PROGRAM_ID,
        status: 'APPROVED',
        parent: 'enr-1-pt'
      }
    });

    await prisma.appeal.create({
      data: {
        id: APPEAL_ID,
        category: 'CHANGE_PROVIDER',
        status: 'OPEN',
        message: transferMessage,
        children: {
          create: [{ id: 'ch-1', childIin: '111111111111', childName: 'Child 1' }]
        }
      }
    });

    const res = await request(app).post(`/api/appeals/${APPEAL_ID}/transfer`).send();

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
