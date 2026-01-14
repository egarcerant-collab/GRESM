'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAudit as dbCreateAudit, deleteAudit as dbDeleteAudit, getAuditById as dbGetAuditById, getAudits as dbGetAudits } from '@/lib/db';
import { auditSchema } from '@/lib/schema';
import type { Audit } from '@/lib/types';
import { summarizeAuditLogs } from '@/ai/flows/summarize-audit-logs';
import { generateActionItems } from '@/ai/flows/generate-action-items';
import { z } from 'zod';

export async function createAuditAction(values: z.infer<typeof auditSchema>) {
  const validatedFields = auditSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Datos inválidos proporcionados.' };
  }

  const { visitType, documentNumber } = validatedFields.data;

  if (visitType === 'PRIMERA VEZ') {
    const existingAudits = await dbGetAudits();
    const patientExists = existingAudits.some(audit => audit.documentNumber === documentNumber);
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

export async function getAiSummary(audit: Audit) {
    const auditLogString = `
      Auditor: ${audit.auditorName}
      Patient: ${audit.patientName}
      Document: ${audit.documentType} - ${audit.documentNumber}
      Event: ${audit.event} (${audit.eventDetails})
      Follow-up Date: ${new Date(audit.followUpDate).toDateString()}
      Visit Type: ${audit.visitType}
      Location: ${audit.municipality}, ${audit.department}
      Follow-up Notes: ${audit.followUpNotes}
      Next Steps: ${audit.nextSteps}
    `;
    
    try {
      const summaryPromise = summarizeAuditLogs({ logs: auditLogString });
      const actionItemsPromise = generateActionItems({ auditLogs: auditLogString });
  
      const [summaryResult, actionItemsResult] = await Promise.all([summaryPromise, actionItemsPromise]);
      
      return {
        summary: summaryResult.summary,
        actionItems: actionItemsResult.actionItems,
      };
    } catch (error) {
      console.error("AI generation failed:", error);
      return { error: "Error al generar el análisis de IA." };
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
