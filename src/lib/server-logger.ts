/**
 * サーバーサイド専用ロガー
 * デバッグモード時にログをファイルに保存する
 *
 * 環境変数:
 * - DEBUG_LOG_TO_FILE=true: ログをファイルに保存
 *
 * 使用方法（APIルート等で）:
 * import { serverLogger } from "@/lib/server-logger";
 * serverLogger.info("メッセージ", { data: "value" });
 */

import * as fs from "fs";
import * as path from "path";
import {
  formatMessage,
  logToConsole,
  type LogLevel,
  type LoggerInterface,
} from "./logger";

class ServerLogger implements LoggerInterface {
  private logDir: string;
  private shouldLogToFile: boolean;

  constructor() {
    this.shouldLogToFile = process.env.DEBUG_LOG_TO_FILE === "true";
    this.logDir = path.join(process.cwd(), "logs");

    if (this.shouldLogToFile) {
      this.ensureLogDir();
    }
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(): string {
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    return path.join(this.logDir, `${date}.log`);
  }

  private writeToFile(formattedMessage: string): void {
    if (!this.shouldLogToFile) return;

    try {
      const logFile = this.getLogFileName();
      fs.appendFileSync(logFile, formattedMessage + "\n", "utf8");
    } catch (error) {
      console.error("Failed to write log to file:", error);
    }
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    // コンソール出力
    logToConsole(level, message, ...args);

    // ファイル出力（デバッグモード時のみ）
    if (this.shouldLogToFile) {
      const formattedMessage = formatMessage(level, message, ...args);
      this.writeToFile(formattedMessage);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log("error", message, ...args);
  }
}

// シングルトンインスタンス
export const serverLogger = new ServerLogger();

// デフォルトエクスポート
export default serverLogger;
