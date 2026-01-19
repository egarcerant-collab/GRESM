import fs from 'fs/promises';
import path from 'path';
import type { Audit } from '../types';

// NOTE: This file-based "database" is for demonstration purposes and works in a Node.js environment.
// It is not suitable for serverless environments like Vercel or Firebase App Hosting's default setup
// due to the ephemeral and read-only nature of their filesystems. For production, use a proper database like Firestore.

const dataPath = path.join(process.cwd(), 'data', 'audits.json');

async function readData(): Promise<Audit[]> {
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    const audits = JSON.parse(data);
    // Dates are stored as strings in JSON, so we need to parse them back.
    return audits.map((audit: any) => ({
      ...audit,
      followUpDate: new Date(audit.followUpDate),
      createdAt: new Date(audit.createdAt),
      birthDate: audit.birthDate ? new Date(audit.birthDate) : undefined,
    }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If file does not exist, create it with an empty array.
      await writeData([]);
      return [];
    }
    console.error('Failed to read data file:', error);
    // Return empty array on read error to prevent app crash
    return [];
  }
}

async function writeData(data: Audit[]): Promise<void> {
  try {
    // Ensure the directory exists
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write data file:', error);
    throw new Error('Could not write to the database.');
  }
}

export async function getAudits(): Promise<Audit[]> {
  const audits = await readData();
  // Sort by creation date, newest first
  return audits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getAuditById(id: string): Promise<Audit | undefined> {
  const audits = await readData();
  return audits.find(audit => audit.id === id);
}

export async function createAudit(auditData: Omit<Audit, 'id' | 'createdAt'>): Promise<Audit> {
  const audits = await readData();
  const newId = audits.length > 0 ? String(Math.max(...audits.map(a => parseInt(a.id, 10) || 0)) + 1) : "1";
  
  const newAudit: Audit = {
    ...auditData,
    id: newId,
    createdAt: new Date(),
  };
  
  const updatedAudits = [...audits, newAudit];
  await writeData(updatedAudits);
  return newAudit;
}

export async function deleteAudit(id: string): Promise<void> {
  const audits = await readData();
  const updatedAudits = audits.filter(audit => audit.id !== id);
  await writeData(updatedAudits);
}
