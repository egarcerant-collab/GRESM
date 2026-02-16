'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Audit } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const dataPath = path.join(process.cwd(), 'public', 'data', 'audits.json');

async function readAudits(): Promise<Audit[]> {
  try {
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist, return an empty array.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await fs.writeFile(dataPath, '[]', 'utf-8');
        return [];
      } catch (writeError) {
         console.error('Error creating audits file:', writeError);
         throw new Error('No se pudo crear el archivo de datos de auditoría.');
      }
    }
    console.error('Error leyendo el archivo de auditorías:', error);
    throw new Error('No se pudieron leer los datos de auditoría.');
  }
}

async function writeAudits(audits: Audit[]): Promise<void> {
  try {
    await fs.writeFile(dataPath, JSON.stringify(audits, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo el archivo de auditorías:', error);
    throw new Error('No se pudo guardar la auditoría. El servidor no tiene permisos para escribir archivos.');
  }
}

export async function getAuditsAction(): Promise<Audit[]> {
  return await readAudits();
}

export async function getAuditByIdAction(id: string): Promise<Audit | null> {
    const audits = await readAudits();
    return audits.find(a => a.id === id) || null;
}

export async function saveAuditAction(audit: Audit): Promise<{success: boolean, message?: string}> {
  try {
    const audits = await readAudits();
    audits.unshift(audit); // Add to the beginning
    await writeAudits(audits);
    revalidatePath('/logs');
    revalidatePath(`/logs/${audit.id}`);
    return { success: true };
  } catch(e: any) {
    return { success: false, message: e.message };
  }
}

export async function deleteAuditAction(id: string): Promise<void> {
    let audits = await readAudits();
    audits = audits.filter(a => a.id !== id);
    await writeAudits(audits);
    revalidatePath('/logs');
}

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
