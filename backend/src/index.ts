import 'reflect-metadata';
import dotenv from 'dotenv';

dotenv.config();

import app               from './app';
import { env }           from './config/env';
import { logger }        from './config/logger';
import { AppDataSource } from './config/database.config';


// start the server
const startServer = async (): Promise<void> => {
  try {
    
    // Connect to the database
    await AppDataSource.initialize();
    logger.info('✅  Database connected successfully');
    
    // Start Express server
    app.listen(env.PORT, () => {
      logger.info(`✅  Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`📡  API available at http://localhost:${env.PORT}/api/v1`);
    });

  } catch (error) {
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };
    logger.error('❌  Failed to start server', errorDetails);
    process.exit(1);
  }
};

// Handle uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('UNHANDLED REJECTION — shutting down', { reason });
  process.exit(1);
});

startServer();