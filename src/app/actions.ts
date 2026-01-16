
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAudit as dbCreateAudit, deleteAudit as dbDeleteAudit, getAuditById as dbGetAuditById, getAudits as dbGetAudits } from '@/lib/data/audits';
import { findUserByFullName as dbFindUserByFullName, getUsers as dbGetUsers, createUser as dbCreateUser, updateUser as dbUpdateUser, deleteUser as dbDeleteUser, findUserByUsernameForLogin } from '@/lib/data/users';
import { auditSchema, userSchema, loginSchema } from '@/lib/schema';
import type { Audit, User } from '@/lib/types';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/session';

export async function loginAction(values: z.infer<typeof loginSchema>) {
    const validatedFields = loginSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: 'Datos inválidos.' };
    }

    const { username, password } = validatedFields.data;

    const user = await findUserByUsernameForLogin(username);

    if (!user || user.password !== password) {
        return { error: 'Nombre de usuario o contraseña incorrectos.' };
    }

    const session = await getSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, signature: __, ...userWithoutPassword } = user;
    session.user = userWithoutPassword;
    await session.save();

    return { success: true };
}

export async function logoutAction() {
    const session = await getSession();
    session.destroy();
    redirect('/login');
}

export async function getCurrentUser() {
    const session = await getSession();
    return session.user;
}

export async function createAuditAction(values: z.infer<typeof auditSchema>) {
  const session = await getSession();
  if (!session.user) return { error: 'No autorizado' };

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
  const session = await getSession();
  if (!session.user) return { error: 'No autorizado' };
  
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
  const session = await getSession();
  if (!session.user) return { audit: null, error: 'No autorizado' };
  
  try {
    const audit = await dbGetAuditById(id);
    if (!audit) {
      return { audit: null, error: 'Auditoría no encontrada' };
    }
    return { audit: JSON.parse(JSON.stringify(audit)) };
  } catch (error) {
    console.error('Error al obtener la auditoría:', error);
    return { audit: null, error: 'Error al recuperar la auditoría de la base de datos.' };
  }
}

export async function getAuditsAction(): Promise<{ audits: Audit[], error?: string }> {
    const session = await getSession();
    if (!session.user) return { audits: [], error: 'No autorizado' };

  try {
    const audits = await dbGetAudits();
    return { audits: JSON.parse(JSON.stringify(audits)) };
  } catch (error) {
    console.error('Error al obtener las auditorías:', error);
    return { audits: [], error: 'Error al recuperar las auditorías de la base de datos.' };
  }
}

export async function checkExistingPatientAction(documentNumber: string): Promise<{ exists: boolean }> {
  const session = await getSession();
  if (!session.user) return { exists: false };

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

export async function findUserByFullNameAction(fullName: string): Promise<User | null> {
  const session = await getSession();
  if (!session.user) return null;
  try {
    const user = await dbFindUserByFullName(fullName);
    if (!user) {
      return null;
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error finding user by full name:', error);
    return null;
  }
}

export async function getUsersAction(): Promise<{ users: Omit<User, 'password'>[], error?: string }> {
  const session = await getSession();
  if (!session.user || session.user.role !== 'admin') {
    return { users: [], error: 'No autorizado' };
  }
  try {
    const users = await dbGetUsers();
    return { users: users as Omit<User, 'password'>[] };
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    return { users: [], error: 'Error al recuperar los usuarios de la base de datos.' };
  }
}

export async function createUserAction(values: z.infer<typeof userSchema>) {
  const session = await getSession();
  if (!session.user || session.user.role !== 'admin') {
    return { error: 'No autorizado para crear usuarios.' };
  }
  if (!values.password || values.password.length < 1) {
    return { error: 'La contraseña es requerida para crear un usuario.' };
  }
  
  const validatedFields = userSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Datos inválidos proporcionados.' };
  }

  try {
    await dbCreateUser(validatedFields.data as User);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: 'Ocurrió un error inesperado al crear el usuario.' };
  }
}

export async function updateUserAction(username: string, values: z.infer<typeof userSchema>) {
  const session = await getSession();
  if (!session.user || session.user.role !== 'admin') {
    return { error: 'No autorizado para actualizar usuarios.' };
  }
  const { username: formUsername, ...updateValues } = values;

  const validatedFields = userSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Datos inválidos proporcionados.' };
  }
  
  const dataToUpdate: Partial<User> = { ...updateValues };

  if (!dataToUpdate.password) {
    delete dataToUpdate.password;
  }
  
  try {
    await dbUpdateUser(username, dataToUpdate);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
     if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: 'Ocurrió un error inesperado al actualizar el usuario.' };
  }
}

export async function deleteUserAction(username: string) {
  const session = await getSession();
  if (!session.user || session.user.role !== 'admin') {
    return { error: 'No autorizado para eliminar usuarios.' };
  }
  try {
    await dbDeleteUser(username);
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: 'Ocurrió un error inesperado al eliminar el usuario.' };
  }
}
