import type { ILogger, LogContext, LogLevel } from "@/application/ports/ILogger";
import { getAppConfig } from "@/infrastructure/config/appConfig";

const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class ConsoleLogger implements ILogger {
  constructor(
    private readonly baseContext: LogContext = {},
    private readonly minLevel: LogLevel = getAppConfig().logLevel,
  ) {}

  debug(message: string, context?: LogContext): void {
    this.write("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write("warn", message, context);
  }

  error(message: string, context?: LogContext, error?: unknown): void {
    this.write("error", message, {
      ...context,
      ...(error instanceof Error
        ? { errorName: error.name, errorMessage: error.message }
        : error !== undefined
          ? { error }
          : {}),
    });
  }

  child(context: LogContext): ILogger {
    return new ConsoleLogger({ ...this.baseContext, ...context }, this.minLevel);
  }

  private write(level: LogLevel, message: string, context?: LogContext): void {
    if (LOG_LEVEL_WEIGHT[level] < LOG_LEVEL_WEIGHT[this.minLevel]) {
      return;
    }

    const payload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...this.baseContext,
      ...context,
    };

    const line = JSON.stringify(payload);

    if (level === "error") {
      console.error(line);
      return;
    }

    if (level === "warn") {
      console.warn(line);
      return;
    }

    console.log(line);
  }
}
