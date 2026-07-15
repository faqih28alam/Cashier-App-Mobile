import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {requestStoragePermission} from './permissions';

const DB_NAME = 'cashier_app_mobile.db';

export type BackupMethod = 'sdcard' | 'internal' | 'share';

export interface BackupResult {
  path: string;
  method: BackupMethod;
}

function backupFileName(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  return `cashier-backup-${stamp}.db`;
}

/**
 * The on-device SQLite file lives in the app's private "databases" folder
 * (a sibling of DocumentDirectoryPath's "files" folder on Android), since
 * react-native-sqlite-storage was opened with location: 'default'.
 */
function getDbFilePath(): string {
  const filesDir = RNFS.DocumentDirectoryPath;
  const appDataDir = filesDir.substring(0, filesDir.lastIndexOf('/'));
  return `${appDataDir}/databases/${DB_NAME}`;
}

/**
 * Exports (backs up) the local database file. Tries the SD card / shared
 * external storage first; if it is unavailable or not writable (denied
 * permission, read-only, no such volume), falls back to the app's internal
 * storage and offers the Android share sheet so the user can still save the
 * file to a location of their choice. Never throws a hard failure for the
 * "no SD card" case — only for truly unrecoverable errors (e.g. missing DB).
 */
export async function exportBackup(): Promise<BackupResult> {
  const dbPath = getDbFilePath();
  const dbExists = await RNFS.exists(dbPath);
  if (!dbExists) {
    throw new Error('Berkas database tidak ditemukan');
  }

  const filename = backupFileName();
  await requestStoragePermission();

  // 1. Primary target: SD card / shared external storage.
  try {
    const sdDir = `${RNFS.ExternalStorageDirectoryPath}/CashierAppMobile/backups`;
    await RNFS.mkdir(sdDir);
    const destPath = `${sdDir}/${filename}`;
    await RNFS.copyFile(dbPath, destPath);
    return {path: destPath, method: 'sdcard'};
  } catch {
    // No SD card, not writable, or permission denied — fall through.
  }

  // 2. Fallback: internal app storage (always available, no permission needed).
  let internalPath: string | null = null;
  try {
    const internalDir = `${RNFS.DocumentDirectoryPath}/backups`;
    await RNFS.mkdir(internalDir);
    internalPath = `${internalDir}/${filename}`;
    await RNFS.copyFile(dbPath, internalPath);
  } catch {
    internalPath = null;
  }

  // 3. Also offer the share sheet so the user can save a copy to a real SD
  // card, cloud storage, etc. Cancelling the share sheet is not an error.
  const shareSourcePath = internalPath ?? dbPath;
  try {
    await Share.open({
      url: `file://${shareSourcePath}`,
      type: 'application/octet-stream',
      filename,
      failOnCancel: false,
    });
  } catch {
    // Share sheet dismissed/unavailable — the internal copy (if any) stands.
  }

  if (internalPath) {
    return {path: internalPath, method: 'internal'};
  }
  return {path: dbPath, method: 'share'};
}
