import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { transferController } from './modules/appeals/transfer.controller.js';
import { isAppError } from './shared/errors.js';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

function sendJson(res: ServerResponse, statusCode: number, payload: JsonObject): void {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function pathname(req: IncomingMessage): string {
  return new URL(req.url ?? '/', 'http://localhost').pathname;
}

const transferPath = /^\/api\/appeals\/([^/]+)\/transfer$/;

async function requestHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const path = pathname(req);

  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, { success: true, status: 'ok' });
    return;
  }

  const transferMatch = path.match(transferPath);
  if (req.method === 'POST' && transferMatch) {
    const appealIdRaw = transferMatch[1];
    if (!appealIdRaw) {
      sendJson(res, 400, { success: false, error: 'Invalid appeal id' });
      return;
    }

    const appealId = decodeURIComponent(appealIdRaw);
    await transferController(appealId, res);
    return;
  }

  sendJson(res, 404, { success: false, error: 'Route not found' });
}

export const app = createServer((req, res) => {
  void requestHandler(req, res).catch((error: unknown) => {
    if (isAppError(error)) {
      sendJson(res, error.statusCode, {
        success: false,
        code: error.code,
        message: error.message
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    sendJson(res, 500, { success: false, code: 'INTERNAL_ERROR', message });
  });
});
