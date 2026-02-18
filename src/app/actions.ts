'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Audit } from '@/lib/types';

const JSON_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'audits.json');

async function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  try {
    await fs.access(dirname);
  } catch {
    await fs.mkdir(dirname, { recursive: true });
  }
}

export async function getAuditsAction(): Promise<Audit[]> {
  try {
    const data = await fs.readFile(JSON_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Si el archivo no existe o está vacío, retornamos un array vacío
    return [];
  }
}

export async function saveAuditAction(audit: Audit): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureDirectoryExistence(JSON_FILE_PATH);
    const audits = await getAuditsAction();
    audits.push(audit);
    await fs.writeFile(JSON_FILE_PATH, JSON.stringify(audits, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error("Error saving audit to JSON:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAuditAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const audits = await getAuditsAction();
    const filteredAudits = audits.filter(a => a.id !== id);
    await fs.writeFile(JSON_FILE_PATH, JSON.stringify(filteredAudits, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAuditByIdAction(id: string): Promise<Audit | null> {
  const audits = await getAuditsAction();
  return audits.find(a => a.id === id) || null;
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
        return null;
    }
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    return null;
  }
}
