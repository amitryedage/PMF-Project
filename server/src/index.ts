import { createApp } from './app';
import { env } from './config/env';
import { pool, initSqliteDatabase } from './config/db';

const startServer = async () => {
  if (!env.TURSO_DATABASE_URL) {
    await initSqliteDatabase();
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    const dbSource = env.TURSO_DATABASE_URL ? 'Turso Cloud Serverless libSQL' : 'SQLite local database';
    console.log(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode (${dbSource} ready)`);
  });

  const handleShutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await pool.end();
        console.log('Database client closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch(console.error);
