export const logger = {
  info: (message: string, ...meta: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] [Marketplace] ${message}`, ...meta);
    }
  },
  warn: (message: string, ...meta: unknown[]) => {
    console.warn(`[WARN] [Marketplace] ${message}`, ...meta);
  },
  error: (message: string, ...meta: unknown[]) => {
    console.error(`[ERROR] [Marketplace] ${message}`, ...meta);
  },
};
