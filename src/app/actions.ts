
'use server';

import fs from 'fs/promises';
import path from 'path';

/**
 * Este archivo ahora solo maneja la lectura de la imagen de fondo.
 * El guardado de auditorías se ha movido al cliente (Firestore) 
 * para garantizar la persistencia en entornos como Vercel.
 */

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
        return null;
    }
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Error reading image:", error);
    return null;
  }
}
