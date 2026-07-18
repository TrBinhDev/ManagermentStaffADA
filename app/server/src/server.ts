import { app } from './app.js';
import { env } from './config/env.js';
import { redisClient } from './config/redis.js';
import { prisma } from './config/prisma.js';

async function bootstrap() {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected');

    await prisma.$connect();
    console.log('✅ Postgres connected');

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
});