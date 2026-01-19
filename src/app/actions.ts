'use server';

import fs from 'fs/promises';
import path from 'path';

// This function is kept for PDF generation, but other data actions are removed.
export async function getImageAsBase64Action(imagePath: string): Promise<string | null> {
  const publicDir = path.join(process.cwd(), 'public');
  const fullPath = path.join(publicDir, imagePath);
  
  try {
    await fs.access(fullPath);
    const file = await fs.readFile(fullPath);
    const base64 = file.toString('base64');
    const extension = path.extname(imagePath).substring(1).toLowerCase();
    let mimeType = '';
    switch (extension) {
      case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break;
      case 'png': mimeType = 'image/png'; break;
      case 'gif': mimeType = 'image/gif'; break;
      default: console.error(`Unsupported image extension: ${extension}`); return null;
    }
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error reading image from ${fullPath}:`, error);
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        console.log(`Created directory ${path.dirname(fullPath)} as it did not exist.`);
      } catch (mkdirError) {
        console.error(`Failed to create directory for image at ${path.dirname(fullPath)}:`, mkdirError);
      }
    }
    return null;
  }
}
