const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Log colors for console
const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m'
};

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.logLevel];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message} ${metaString}`.trim();
  }

  writeToFile(level, formattedMessage) {
    const filename = level === 'ERROR' ? 'error.log' : 'combined.log';
    const filepath = path.join(this.logDir, filename);
    
    fs.appendFileSync(filepath, formattedMessage + '\n', 'utf8');
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    if (process.env.NODE_ENV !== 'test') {
      const color = LOG_COLORS[level] || LOG_COLORS.INFO;
      console.log(`${color}${formattedMessage}${LOG_COLORS.RESET}`);
    }
    
    // File output
    this.writeToFile(level, formattedMessage);
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // Database operation logging
  dbQuery(query, duration, meta = {}) {
    this.debug(`DB Query: ${query}`, { 
      duration: `${duration}ms`, 
      ...meta 
    });
  }

  // API request logging
  apiRequest(method, url, statusCode, duration, meta = {}) {
    const level = statusCode >= 400 ? 'WARN' : 'INFO';
    this.log(level, `${method} ${url} - ${statusCode}`, {
      duration: `${duration}ms`,
      ...meta
    });
  }

  // Authentication logging
  authEvent(event, userId, success, meta = {}) {
    const level = success ? 'INFO' : 'WARN';
    this.log(level, `Auth ${event}: ${success ? 'SUCCESS' : 'FAILED'}`, {
      userId,
      ...meta
    });
  }

  // Error with stack trace
  errorWithStack(error, meta = {}) {
    this.error(`${error.message}`, {
      stack: error.stack,
      ...meta
    });
  }

  // Performance monitoring
  performance(operation, duration, meta = {}) {
    const level = duration > 1000 ? 'WARN' : 'INFO';
    this.log(level, `Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...meta
    });
  }
}

// Singleton instance
const logger = new Logger();

// Performance monitoring helper
const withTiming = (operation, fn) => {
  return async (...args) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      logger.performance(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.performance(`${operation} (FAILED)`, duration);
      throw error;
    }
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.apiRequest(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
      }
    );
  });
  
  next();
};

// Database query logging for Sequelize
const sequelizeLogger = (query, duration) => {
  // Only log slow queries in production
  if (process.env.NODE_ENV === 'production' && duration < 100) {
    return;
  }
  
  logger.dbQuery(query, duration);
};

// Replace console methods in production
if (process.env.NODE_ENV === 'production') {
  console.log = (...args) => logger.info(args.join(' '));
  console.error = (...args) => logger.error(args.join(' '));
  console.warn = (...args) => logger.warn(args.join(' '));
  console.debug = (...args) => logger.debug(args.join(' '));
}

module.exports = {
  logger,
  withTiming,
  requestLogger,
  sequelizeLogger,
  LOG_LEVELS
};
