import fs from 'fs';
import path from 'path';

/**
 * Finds the data directory, whether the app is started from the project root
 * or from a parent directory (e.g. via launch.json).
 */
export function getDataDir(): string {
  // First try: running directly from project root (npm run dev)
  const direct = path.join(process.cwd(), 'data');
  if (fs.existsSync(direct)) return direct;

  // Second try: started from parent directory with GRESM as subdir
  const fromParent = path.join(process.cwd(), 'GRESM', 'data');
  if (fs.existsSync(fromParent)) return fromParent;

  // Fallback: return the direct path anyway and let it fail with a clear error
  return direct;
}
