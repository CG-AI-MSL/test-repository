import 'dotenv/config';
import { createApp } from './app';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function main() {
  const { app, prisma } = createApp();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  app.listen(PORT, () => {
    console.log(`TaskList API running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
