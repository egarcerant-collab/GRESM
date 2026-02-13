'use server';

import fs from 'fs/promises';
import path from 'path';
import type { Audit } from '@/lib/types';

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

const auditsFilePath = path.join(process.cwd(), 'public', 'data', 'audits.json');

async function readAudits(): Promise<Audit[]> {
    try {
        const fileData = await fs.readFile(auditsFilePath, 'utf-8');
        return JSON.parse(fileData) as Audit[];
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            await writeAudits([]);
            return [];
        }
        console.error("Error reading audits file:", error);
        throw new Error("Could not read audits data.");
    }
}

async function writeAudits(audits: Audit[]): Promise<void> {
    try {
        const dir = path.dirname(auditsFilePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(auditsFilePath, JSON.stringify(audits, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing audits file:", error);
        throw new Error("Could not save audits data.");
    }
}

export async function saveAuditAction(audit: Audit): Promise<{success: boolean, message?: string}> {
    try {
        const audits = await readAudits();
        audits.unshift(audit); // Add new audit to the beginning
        await writeAudits(audits);
        return { success: true };
    } catch(e: any) {
        return { success: false, message: e.message };
    }
}

export async function deleteAuditAction(id: string): Promise<{success: boolean, message?: string}> {
    try {
        let audits = await readAudits();
        const initialLength = audits.length;
        audits = audits.filter(a => a.id !== id);
        if (audits.length === initialLength) {
             return { success: false, message: "Audit not found." };
        }
        await writeAudits(audits);
        return { success: true };
    } catch(e: any) {
        return { success: false, message: e.message };
    }
}
