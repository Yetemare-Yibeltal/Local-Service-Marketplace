import { CronJob } from "cron";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { createGzip } from "zlib";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify as promisifyStream } from "stream";
import logger from "../../utils/logger";
import { redisService } from "../../services/redis.service";
import env from "../../config/env";

const execAsync = promisify(exec);
const pipelineAsync = promisifyStream(pipeline);

// ============================================================
// TYPES
// ============================================================

export interface BackupResult {
  success: boolean;
  message: string;
  databaseBackup?: {
    path: string;
    size: number;
  };
  fileBackup?: {
    path: string;
    size: number;
  };
  configBackup?: {
    path: string;
    size: number;
  };
  codeBackup?: {
    path: string;
    size: number;
  };
  oldBackupsRemoved?: number;
  totalSize: number;
  duration: number;
  errors: string[];
}

export interface BackupConfig {
  backupDirectory: string;
  databaseBackupEnabled: boolean;
  fileBackupEnabled: boolean;
  configBackupEnabled: boolean;
  codeBackupEnabled: boolean;
  retentionDays: number;
  maxBackupCount: number;
}

// ============================================================
// JOB CONFIGURATION
// ============================================================

const JOB_NAME = "system-backup";
const CRON_EXPRESSION = "0 3 * * *"; // Run at 3:00 AM daily
const ENABLED = true;

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

const DEFAULT_CONFIG: BackupConfig = {
  backupDirectory: path.join(process.cwd(), "backups"),
  databaseBackupEnabled: true,
  fileBackupEnabled: true,
  configBackupEnabled: true,
  codeBackupEnabled: false, // Disabled by default for security
  retentionDays: 7,
  maxBackupCount: 30,
};

// ============================================================
// JOB STATE
// ============================================================

let cronJob: CronJob | null = null;
let isRunning = false;
let lastRun: Date | null = null;
let nextRun: Date | null = null;

const BACKUP_CACHE_KEY = "job:backup:last_run";
const BACKUP_LOCK_KEY = "job:backup:lock";
const BACKUP_STATUS_PREFIX = "backup:status:";

// ============================================================
// MAIN EXECUTION FUNCTION
// ============================================================

/**
 * Execute the backup job
 */
async function execute(
  config: BackupConfig = DEFAULT_CONFIG,
): Promise<BackupResult> {
  const startTime = Date.now();
  const result: BackupResult = {
    success: false,
    message: "",
    errors: [],
    totalSize: 0,
    duration: 0,
  };

  try {
    logger.info("Starting system backup job...");

    // Acquire lock
    const lock = await redisService.set(BACKUP_LOCK_KEY, "locked", 3600);
    if (!lock) {
      logger.warn("Backup job lock already acquired, skipping");
      result.message = "Backup job already running, skipping";
      result.success = true;
      return result;
    }

    // Ensure backup directory exists
    await ensureBackupDirectory(config.backupDirectory);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPrefix = `backup-${timestamp}`;

    // 1. Database backup
    if (config.databaseBackupEnabled) {
      try {
        const dbBackup = await backupDatabase(
          config.backupDirectory,
          backupPrefix,
        );
        result.databaseBackup = dbBackup;
        result.totalSize += dbBackup.size;
        logger.info(
          `Database backup created: ${dbBackup.path} (${dbBackup.size} bytes)`,
        );
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Database backup failed: ${errMsg}`);
        logger.error("Database backup failed:", error);
      }
    }

    // 2. File uploads backup
    if (config.fileBackupEnabled) {
      try {
        const fileBackup = await backupUploads(
          config.backupDirectory,
          backupPrefix,
        );
        result.fileBackup = fileBackup;
        result.totalSize += fileBackup.size;
        logger.info(
          `Uploads backup created: ${fileBackup.path} (${fileBackup.size} bytes)`,
        );
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Uploads backup failed: ${errMsg}`);
        logger.error("Uploads backup failed:", error);
      }
    }

    // 3. Configuration backup
    if (config.configBackupEnabled) {
      try {
        const configBackup = await backupConfigs(
          config.backupDirectory,
          backupPrefix,
        );
        result.configBackup = configBackup;
        result.totalSize += configBackup.size;
        logger.info(
          `Configuration backup created: ${configBackup.path} (${configBackup.size} bytes)`,
        );
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Configuration backup failed: ${errMsg}`);
        logger.error("Configuration backup failed:", error);
      }
    }

    // 4. Code backup (optional)
    if (config.codeBackupEnabled) {
      try {
        const codeBackup = await backupCode(
          config.backupDirectory,
          backupPrefix,
        );
        result.codeBackup = codeBackup;
        result.totalSize += codeBackup.size;
        logger.info(
          `Code backup created: ${codeBackup.path} (${codeBackup.size} bytes)`,
        );
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Code backup failed: ${errMsg}`);
        logger.error("Code backup failed:", error);
      }
    }

    // 5. Clean up old backups
    const oldBackupsRemoved = await cleanupOldBackups(
      config.backupDirectory,
      config.retentionDays,
      config.maxBackupCount,
    );
    result.oldBackupsRemoved = oldBackupsRemoved;
    logger.info(`Removed ${oldBackupsRemoved} old backups`);

    // Update cache
    await redisService.set(BACKUP_CACHE_KEY, new Date().toISOString(), 86400);

    // Release lock
    await redisService.delete(BACKUP_LOCK_KEY);

    const duration = Date.now() - startTime;
    result.duration = duration;
    result.success = result.errors.length === 0;
    result.message =
      result.errors.length === 0
        ? "Backup completed successfully"
        : `Backup completed with ${result.errors.length} errors`;

    logger.info(`Backup job completed in ${duration}ms`);

    // Store backup status
    await storeBackupStatus(result);

    return result;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errMsg);
    result.message = "Backup job failed";
    result.duration = Date.now() - startTime;
    logger.error("Backup job execution failed:", error);
    await redisService.delete(BACKUP_LOCK_KEY);
    return result;
  }
}

// ============================================================
// BACKUP FUNCTIONS
// ============================================================

/**
 * Ensure backup directory exists
 */
async function ensureBackupDirectory(dir: string): Promise<void> {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created backup directory: ${dir}`);
    }
  } catch (error) {
    logger.error(`Failed to create backup directory: ${dir}`, error);
    throw error;
  }
}

/**
 * Backup database using pg_dump
 */
async function backupDatabase(
  backupDir: string,
  prefix: string,
): Promise<{ path: string; size: number }> {
  try {
    const filename = `${prefix}-database.sql.gz`;
    const filePath = path.join(backupDir, filename);

    // Get database URL from env
    const dbUrl = env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL environment variable not set");
    }

    // Use pg_dump to backup database
    const command = `pg_dump "${dbUrl}" | gzip > "${filePath}"`;
    await execAsync(command, { shell: true });

    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      size: stats.size,
    };
  } catch (error) {
    logger.error("Database backup failed:", error);
    throw error;
  }
}

/**
 * Backup uploaded files
 */
async function backupUploads(
  backupDir: string,
  prefix: string,
): Promise<{ path: string; size: number }> {
  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      logger.warn("Uploads directory does not exist, skipping backup");
      return { path: "", size: 0 };
    }

    const filename = `${prefix}-uploads.tar.gz`;
    const filePath = path.join(backupDir, filename);

    // Create tar archive of uploads directory
    const command = `tar -czf "${filePath}" -C "${path.dirname(uploadsDir)}" "${path.basename(uploadsDir)}" 2>/dev/null || echo "No files to backup"`;
    await execAsync(command, { shell: true });

    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      size: stats.size,
    };
  } catch (error) {
    logger.error("Uploads backup failed:", error);
    throw error;
  }
}

/**
 * Backup configuration files
 */
async function backupConfigs(
  backupDir: string,
  prefix: string,
): Promise<{ path: string; size: number }> {
  try {
    const configDir = path.join(process.cwd(), "config");
    if (!fs.existsSync(configDir)) {
      logger.warn("Config directory does not exist, skipping backup");
      return { path: "", size: 0 };
    }

    const filename = `${prefix}-config.tar.gz`;
    const filePath = path.join(backupDir, filename);

    // Create tar archive of config directory
    const command = `tar -czf "${filePath}" -C "${path.dirname(configDir)}" "${path.basename(configDir)}" 2>/dev/null || echo "No files to backup"`;
    await execAsync(command, { shell: true });

    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      size: stats.size,
    };
  } catch (error) {
    logger.error("Configuration backup failed:", error);
    throw error;
  }
}

/**
 * Backup source code
 */
async function backupCode(
  backupDir: string,
  prefix: string,
): Promise<{ path: string; size: number }> {
  try {
    const codeDir = path.join(process.cwd(), "src");
    if (!fs.existsSync(codeDir)) {
      logger.warn("Source code directory does not exist, skipping backup");
      return { path: "", size: 0 };
    }

    const filename = `${prefix}-code.tar.gz`;
    const filePath = path.join(backupDir, filename);

    // Create tar archive of src directory (excluding node_modules)
    const command = `tar -czf "${filePath}" -C "${path.dirname(codeDir)}" --exclude=node_modules --exclude=dist "${path.basename(codeDir)}" 2>/dev/null || echo "No files to backup"`;
    await execAsync(command, { shell: true });

    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      size: stats.size,
    };
  } catch (error) {
    logger.error("Code backup failed:", error);
    throw error;
  }
}

// ============================================================
// CLEANUP FUNCTIONS
// ============================================================

/**
 * Clean up old backup files
 */
async function cleanupOldBackups(
  backupDir: string,
  retentionDays: number,
  maxCount: number,
): Promise<number> {
  try {
    if (!fs.existsSync(backupDir)) {
      return 0;
    }

    const files = fs.readdirSync(backupDir);
    const backupFiles = files
      .filter(
        (f) =>
          f.startsWith("backup-") && (f.endsWith(".gz") || f.endsWith(".sql")),
      )
      .map((f) => ({
        name: f,
        path: path.join(backupDir, f),
        stats: fs.statSync(path.join(backupDir, f)),
      }))
      .sort((a, b) => a.stats.mtime.getTime() - b.stats.mtime.getTime());

    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    let removedCount = 0;

    // Remove files older than retention period
    for (const file of backupFiles) {
      if (now - file.stats.mtime.getTime() > retentionMs) {
        fs.unlinkSync(file.path);
        removedCount++;
      }
    }

    // If still too many, remove oldest files
    const remainingFiles = fs
      .readdirSync(backupDir)
      .filter(
        (f) =>
          f.startsWith("backup-") && (f.endsWith(".gz") || f.endsWith(".sql")),
      )
      .map((f) => path.join(backupDir, f))
      .sort(
        (a, b) =>
          fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime(),
      );

    while (remainingFiles.length > maxCount) {
      const oldest = remainingFiles.shift();
      if (oldest) {
        fs.unlinkSync(oldest);
        removedCount++;
      }
    }

    return removedCount;
  } catch (error) {
    logger.error("Failed to cleanup old backups:", error);
    return 0;
  }
}

// ============================================================
// STATUS STORAGE
// ============================================================

/**
 * Store backup status
 */
async function storeBackupStatus(result: BackupResult): Promise<void> {
  try {
    const statusKey = `${BACKUP_STATUS_PREFIX}${new Date().toISOString().split("T")[0]}`;
    const status = {
      timestamp: new Date().toISOString(),
      success: result.success,
      message: result.message,
      totalSize: result.totalSize,
      duration: result.duration,
      errors: result.errors,
      databaseBackup: result.databaseBackup
        ? {
            size: result.databaseBackup.size,
            path: result.databaseBackup.path,
          }
        : null,
      fileBackup: result.fileBackup
        ? {
            size: result.fileBackup.size,
            path: result.fileBackup.path,
          }
        : null,
      configBackup: result.configBackup
        ? {
            size: result.configBackup.size,
            path: result.configBackup.path,
          }
        : null,
      codeBackup: result.codeBackup
        ? {
            size: result.codeBackup.size,
            path: result.codeBackup.path,
          }
        : null,
      oldBackupsRemoved: result.oldBackupsRemoved || 0,
    };

    await redisService.set(statusKey, status, 2592000); // 30 days TTL
  } catch (error) {
    logger.error("Failed to store backup status:", error);
  }
}

/**
 * Get backup status for a specific date
 */
export async function getBackupStatus(date: string): Promise<any> {
  try {
    const statusKey = `${BACKUP_STATUS_PREFIX}${date}`;
    return await redisService.get(statusKey);
  } catch (error) {
    logger.error(`Failed to get backup status for ${date}:`, error);
    return null;
  }
}

// ============================================================
// JOB MANAGEMENT FUNCTIONS
// ============================================================

/**
 * Start the cron job
 */
export function start(): void {
  if (cronJob) {
    logger.warn("Backup job is already running");
    return;
  }

  if (!ENABLED) {
    logger.warn("Backup job is disabled");
    return;
  }

  try {
    cronJob = new CronJob(
      CRON_EXPRESSION,
      async () => {
        try {
          isRunning = true;
          lastRun = new Date();
          await execute();
        } catch (error) {
          logger.error("Backup job execution failed:", error);
        } finally {
          isRunning = false;
        }
      },
      null,
      true,
      "Africa/Addis_Ababa",
    );

    nextRun = cronJob.nextDate().toDate();
    logger.info(`Backup job started. Next run: ${nextRun.toISOString()}`);
  } catch (error) {
    logger.error("Failed to start backup job:", error);
    throw error;
  }
}

/**
 * Stop the cron job
 */
export function stop(): void {
  if (!cronJob) {
    logger.warn("Backup job is not running");
    return;
  }

  try {
    cronJob.stop();
    cronJob = null;
    isRunning = false;
    nextRun = null;
    logger.info("Backup job stopped");
  } catch (error) {
    logger.error("Failed to stop backup job:", error);
    throw error;
  }
}

/**
 * Get job status
 */
export function getStatus(): {
  name: string;
  running: boolean;
  enabled: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  cronExpression: string;
} {
  return {
    name: JOB_NAME,
    running: isRunning,
    enabled: ENABLED,
    lastRun: lastRun,
    nextRun: nextRun,
    cronExpression: CRON_EXPRESSION,
  };
}

// ============================================================
// EXPORTED FUNCTIONS
// ============================================================

export const backupJob = {
  name: JOB_NAME,
  cronExpression: CRON_EXPRESSION,
  enabled: ENABLED,
  running: isRunning,
  lastRun,
  nextRun,
  start,
  stop,
  execute,
  getStatus,
  getBackupStatus,
};

export default backupJob;
