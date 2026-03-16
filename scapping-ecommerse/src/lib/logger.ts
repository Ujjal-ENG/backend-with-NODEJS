import config from '../config.js';

const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const defaultLevel = config.env === 'development' ? 'debug' : 'info';
const configuredLevel = process.env.LOG_LEVEL || defaultLevel;
const threshold = LEVELS[configuredLevel] ?? LEVELS.info;

function shouldLog(level) {
  return (LEVELS[level] ?? LEVELS.info) >= threshold;
}

function log(level, message, meta) {
  if (!shouldLog(level)) return;
  const payload = {
    level,
    time: new Date().toISOString(),
    message,
    ...(meta ? { meta } : {})
  };
  const line = JSON.stringify(payload);
  if (level === 'error' || level === 'warn') {
    console.error(line);
    return;
  }
  console.log(line);
}

const logger = {
  debug(message, meta) {
    log('debug', message, meta);
  },
  info(message, meta) {
    log('info', message, meta);
  },
  warn(message, meta) {
    log('warn', message, meta);
  },
  error(message, meta) {
    log('error', message, meta);
  }
};

export default logger;
