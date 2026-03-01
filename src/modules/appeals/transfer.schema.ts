import { z } from 'zod';

export const transferParamsSchema = z.object({
  appealId: z.string().min(1)
});

export const parsedTransferMessageSchema = z.object({
  voucherEmail: z.string().email(),
  currentProviderId: z.string().uuid(),
  desiredProviderId: z.string().uuid(),
  currentSport: z.string().min(1),
  desiredSport: z.string().min(1)
});
