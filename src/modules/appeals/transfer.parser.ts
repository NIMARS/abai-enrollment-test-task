import { badRequest } from '../../shared/errors.js';
import { parsedTransferMessageSchema } from './transfer.schema.js';
import type { ParsedTransferMessage } from './transfer.types.js';

function pick(label: string, text: string): string {
  const re = new RegExp(`${label}\\s*:\\s*(.+)$`, 'im');
  const match = text.match(re);
  if (!match?.[1]) throw badRequest(`Missing field in message: ${label}`);
  return match[1].trim().replace(/^<|>$/g, '');
}

export function parseTransferMessage(message: string): ParsedTransferMessage {
  const raw = {
    voucherEmail: pick('Email ваучера', message),
    currentProviderId: pick('ID текущего поставщика', message),
    desiredProviderId: pick('ID желаемого поставщика', message),
    currentSport: pick('Текущий вид спорта', message),
    desiredSport: pick('Желаемый вид спорта', message)
  };

  const parsed = parsedTransferMessageSchema.safeParse(raw);
  if (!parsed.success) {
    throw badRequest('Invalid transfer message format', parsed.error.flatten());
  }

  return parsed.data;
}
