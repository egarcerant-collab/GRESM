import fs from 'fs';
import path from 'path';

/**
 * Finds the data directory, whether the app is started from the project root
 * or from a parent directory (e.g. via launch.json).
 */
export function getDataDir(): string {
  const direct = path.join(process.cwd(), 'data');
  if (fs.existsSync(direct)) return direct;
  const fromParent = path.join(process.cwd(), 'GRESM', 'data');
  if (fs.existsSync(fromParent)) return fromParent;
  return direct;
}

/**
 * Finds the public directory.
 */
export function getPublicDir(): string {
  const direct = path.join(process.cwd(), 'public');
  if (fs.existsSync(direct)) return direct;
  const fromParent = path.join(process.cwd(), 'GRESM', 'public');
  if (fs.existsSync(fromParent)) return fromParent;
  return direct;
}
