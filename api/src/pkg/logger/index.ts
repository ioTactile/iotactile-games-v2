import { pino } from 'pino';

const getLogLevel = () => {
  if (process.env.NODE_ENV === 'test') {
    return 'warn';
  }
  return 'info';
};

export const logger = pino({
  level: getLogLevel(),
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
});

export const loggerConfig = {
  level: getLogLevel(),
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
};
