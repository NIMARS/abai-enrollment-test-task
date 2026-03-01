import type { ServerResponse } from 'node:http';
import { badRequest } from '../../shared/errors.js';
import { transferParamsSchema } from './transfer.schema.js';
import { transferAppealService } from './transfer.service.js';

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export async function transferController(appealIdRaw: string, res: ServerResponse): Promise<void> {
  const parsedParams = transferParamsSchema.safeParse({ appealId: appealIdRaw });
  if (!parsedParams.success) {
    throw badRequest('Invalid appeal id', parsedParams.error.flatten());
  }

  const result = await transferAppealService(parsedParams.data.appealId);
  sendJson(res, 200, result);
}
