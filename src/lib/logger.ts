/**
 * ロガーユーティリティ（クライアント/サーバー共通部分）
 * デバッグモード時にログをファイルに保存する（サーバーサイドのみ）
 *
 * 環境変数:
 * - DEBUG_LOG_TO_FILE=true: ログをファイルに保存（サーバーサイドのみ）
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};

const RESET_COLOR = "\x1b[0m";

interface LoggerInterface {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

function formatMessage(
  level: LogLevel,
  message: string,
  ...args: unknown[]
): string {
  const timestamp = new Date().toISOString();
  const formattedArgs = args
    .map((arg) => {
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");

  return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs ? " " + formattedArgs : ""}`;
}

function logToConsole(
  level: LogLevel,
  message: string,
  ...args: unknown[]
): void {
  const formattedMessage = formatMessage(level, message, ...args);
  const color = LOG_COLORS[level];
  const consoleMethod =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  consoleMethod(`${color}${formattedMessage}${RESET_COLOR}`);
}

// クライアントサイド用のロガー（コンソール出力のみ）
class ClientLogger implements LoggerInterface {
  debug(message: string, ...args: unknown[]): void {
    logToConsole("debug", message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    logToConsole("info", message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    logToConsole("warn", message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    logToConsole("error", message, ...args);
  }
}

// シングルトンインスタンス（クライアント用）
export const logger: LoggerInterface = new ClientLogger();

// デフォルトエクスポート
export default logger;

// ヘルパー関数をエクスポート（サーバーロガーでも使用）
export { formatMessage, logToConsole, type LogLevel, type LoggerInterface };
