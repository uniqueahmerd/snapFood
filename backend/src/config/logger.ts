import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import { env }  from './env';

const { combine, timestamp, colorize, printf, json } = winston.format;

const logDirectory = path.resolve(process.cwd(), 'logs');
const logFilePath = path.join(logDirectory, 'backend.log');

fs.mkdirSync(logDirectory, { recursive: true });

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

const prodFormat = combine(
  timestamp(),
  json()
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: logFilePath,
      maxsize: 1024 * 1024,
      maxFiles: 5,
      tailable: true,
      format: prodFormat,
    }),
  ],
});

export { logFilePath };