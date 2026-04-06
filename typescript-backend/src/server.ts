import { app } from './app.js';
import { initializeMongo } from './db.js';
import { env } from './env.js';

async function startServer(): Promise<void> {
  await initializeMongo();
  app.listen(env.port, () => {
    console.log(`Leaflens TypeScript backend listening on port ${env.port}`);
  });
}

void startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error(`Failed to start server: ${message}`);
  process.exit(1);
});
