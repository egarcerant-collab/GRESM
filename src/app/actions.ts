'use server';

import fs from 'fs/promises';
import path from 'path';

// This function is kept for PDF generation.
export async function getImageAsBase64Action(imagePath: string): Promise<string | null> {
  const publicDir = path.join(process.cwd(), 'public');
  const fullPath = path.join(publicDir, imagePath);
  
  try {
    const file = await fs.readFile(fullPath);
    const base64 = file.toString('base64');
    const extension = path.extname(imagePath).substring(1).toLowerCase();
    let mimeType = '';
    switch (extension) {
      case 'jpg': case 'jpeg': mimeType = 'image/jpeg'; break;
      case 'png': mimeType = 'image/png'; break;
      case 'gif': mimeType = 'image/gif'; break;
      default: 
        console.error(`Unsupported image extension: ${extension}`);
        return null;
    }
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error(`Image file not found at ${fullPath}. Make sure the image exists in the 'public' directory and the path is correct.`);
    } else {
        console.error(`Error reading image from ${fullPath}:`, error);
    }
    return null;
  }
}

// saveAuditAction and deleteAuditAction have been removed.
// Data is now handled on the client-side using localStorage.
// See src/lib/audit-data-manager.ts
