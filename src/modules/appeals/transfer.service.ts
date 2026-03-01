import { prisma } from '../../lib/prisma.js';
import { badRequest, conflict, notFound } from '../../shared/errors.js';
import { parseTransferMessage } from './transfer.parser.js';
import type { ChildTransferResult, TransferResponse } from './transfer.types.js';

const normalize = (s: string) => s.trim().toLowerCase();

export async function transferAppealService(appealId: string): Promise<TransferResponse> {
  const appeal = await prisma.appeal.findUnique({
    where: { id: appealId },
    include: { children: true }
  });

  if (!appeal) throw notFound('Appeal not found');
  if (appeal.category !== 'CHANGE_PROVIDER') throw badRequest('Appeal category must be CHANGE_PROVIDER');

  const parsed = parseTransferMessage(appeal.message);

  const programs = await prisma.sportsCenterProgram.findMany({
    where: { sportsCenterId: parsed.desiredProviderId },
    include: { _count: { select: { enrollments: true } } }
  });

  const targetProgram = programs.find(
    (p) =>
      normalize(p.sportType) === normalize(parsed.desiredSport) &&
      p._count.enrollments < p.capacity
  );

  if (!targetProgram) {
    throw conflict('No available program in desired provider');
  }

  const results: ChildTransferResult[] = [];

  for (const child of appeal.children) {
    try {
      const athlete = await prisma.athleteProfile.findUnique({ where: { iin: child.childIin } });
      if (!athlete) {
        results.push({
          childId: child.id,
          childIin: child.childIin,
          childName: child.childName,
          transferred: false,
          error: { code: 'ATHLETE_NOT_FOUND', message: 'Athlete profile not found' }
        });
        continue;
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          athleteProfileId: athlete.id,
          sportsCenterId: parsed.currentProviderId,
          status: 'APPROVED'
        }
      });

      if (!enrollment) {
        results.push({
          childId: child.id,
          childIin: child.childIin,
          childName: child.childName,
          transferred: false,
          error: { code: 'ENROLLMENT_NOT_FOUND', message: 'APPROVED enrollment not found' }
        });
        continue;
      }

      const countNow = await prisma.enrollment.count({
  where: { programId: targetProgram.id }
});

if (countNow >= targetProgram.capacity) {
  results.push({
    childId: child.id,
    childIin: child.childIin,
    childName: child.childName,
    transferred: false,
    error: { code: 'PROGRAM_FULL', message: 'Target program is full' }
  });
  continue;
}

const updated = await prisma.enrollment.update({
  where: { id: enrollment.id },
  data: {
    sportsCenterId: parsed.desiredProviderId,
    programId: targetProgram.id,
    status: 'PENDING'
  }
});

results.push({
  childId: child.id,
  childIin: child.childIin,
  childName: child.childName,
  transferred: true,
  enrollmentId: updated.id
});

    } catch (e) {
      results.push({
        childId: child.id,
        childIin: child.childIin,
        childName: child.childName,
        transferred: false,
        error: { code: 'UNKNOWN_ERROR', message: e instanceof Error ? e.message : 'Unknown error' }
      });
    }
  }

  const allTransferred = results.length > 0 && results.every((r) => r.transferred);

  if (allTransferred) {
    await prisma.appeal.update({
      where: { id: appeal.id },
      data: { status: 'RESOLVED' }
    });
  }

  return {
    success: true,
    allTransferred,
    results
  };
}
