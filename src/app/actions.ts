'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAudit as dbCreateAudit, deleteAudit as dbDeleteAudit, getAuditById as dbGetAuditById, getAudits as dbGetAudits } from '@/lib/data/audits';
import { findUserByFullName as dbFindUserByFullName, getUsers as dbGetUsers } from '@/lib/data/users';
import { auditSchema } from '@/lib/schema';
import type { Audit, User } from '@/lib/types';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

export async function createAuditAction(values: z.infer<typeof auditSchema>) {
  const validatedFields = auditSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Datos inválidos proporcionados.' };
  }

  const { visitType, documentNumber } = validatedFields.data;

  if (visitType === 'PRIMERA VEZ') {
    const existingAudits = await dbGetAudits();
    const patientExists = existingAudits.some(audit => audit.documentNumber === documentNumber && audit.visitType === 'PRIMERA VEZ');
    if (patientExists) {
      return { error: 'Ya existe un registro de primera vez para este número de documento.' };
    }
  }
  
  try {
    await dbCreateAudit(validatedFields.data);
  } catch (error) {
    console.error(error);
    return { error: 'Error al crear la auditoría en la base de datos.' };
  }

  revalidatePath('/logs');
  redirect('/logs');
}

export async function deleteAuditAction(id: string) {
  try {
    await dbDeleteAudit(id);
    revalidatePath('/logs');
    revalidatePath(`/logs/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar la auditoría:', error);
    return { error: 'Error al eliminar la auditoría de la base de datos.' };
  }
}

export async function getAuditByIdAction(id: string): Promise<{ audit: Audit | null, error?: string }> {
  try {
    const audit = await dbGetAuditById(id);
    if (!audit) {
      return { audit: null, error: 'Auditoría no encontrada' };
    }
    // The date objects are not serializable from server actions to client components directly.
    // We need to convert them to string or number.
    return { audit: JSON.parse(JSON.stringify(audit)) };
  } catch (error) {
    console.error('Error al obtener la auditoría:', error);
    return { audit: null, error: 'Error al recuperar la auditoría de la base de datos.' };
  }
}

export async function getAuditsAction(): Promise<{ audits: Audit[], error?: string }> {
  try {
    const audits = await dbGetAudits();
    return { audits: JSON.parse(JSON.stringify(audits)) };
  } catch (error) {
    console.error('Error al obtener las auditorías:', error);
    return { audits: [], error: 'Error al recuperar las auditorías de la base de datos.' };
  }
}

export async function checkExistingPatientAction(documentNumber: string): Promise<{ exists: boolean }> {
  if (!documentNumber) {
    return { exists: false };
  }
  try {
    const existingAudits = await dbGetAudits();
    const patientExists = existingAudits.some(audit => audit.documentNumber === documentNumber && audit.visitType === 'PRIMERA VEZ');
    return { exists: patientExists };
  } catch (error) {
    console.error('Error checking for existing patient:', error);
    // In case of a DB error, we don't block the user, the final validation on submit will catch it.
    return { exists: false };
  }
}

export async function getImageAsBase64Action(imagePath: string): Promise<string | null> {
  const publicDir = path.join(process.cwd(), 'public');
  const fullPath = path.join(publicDir, imagePath);
  
  try {
    // Check if file exists. If not, access will throw and we'll go to the catch block.
    await fs.access(fullPath);
    
    const file = await fs.readFile(fullPath);
    const base64 = file.toString('base64');
    
    // Determine MIME type from file extension
    const extension = path.extname(imagePath).substring(1).toLowerCase();
    let mimeType = '';
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      default:
        // If the extension is unknown, we can't form a valid data URI.
        console.error(`Unsupported image extension: ${extension}`);
        return null;
    }

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    // This will catch errors from fs.access (file not found) or fs.readFile
    console.error(`Error reading image from ${fullPath}:`, error);
    
    // If the file doesn't exist, we ensure the directory exists for future uploads.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        console.log(`Created directory ${path.dirname(fullPath)} as it did not exist.`);
      } catch (mkdirError) {
        console.error(`Failed to create directory for image at ${path.dirname(fullPath)}:`, mkdirError);
      }
    }
    return null; // Return null on any error (e.g., file not found)
  }
}

export async function findUserByFullNameAction(fullName: string): Promise<User | null> {
  try {
    const user = await dbFindUserByFullName(fullName);
    if (!user) {
      return null;
    }
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error finding user by full name:', error);
    return null;
  }
}

export async function getUsersAction(): Promise<{ users: Omit<User, 'password'>[], error?: string }> {
  try {
    const users = await dbGetUsers();
    return { users: users as Omit<User, 'password'>[] };
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    return { users: [], error: 'Error al recuperar los usuarios de la base de datos.' };
  }
}
