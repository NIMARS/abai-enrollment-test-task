import { app } from './app.js';
import { env } from './config/env.js';

const defaultPort = 3000;
const parsedPort = Number(env.PORT ?? defaultPort);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : defaultPort;

app.listen(port, () => {
  console.log(`API is running on http://localhost:${port}`);
});
