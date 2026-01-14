'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAudit as dbCreateAudit, deleteAudit as dbDeleteAudit } from '@/lib/db';
import { auditSchema } from '@/lib/schema';
import type { Audit } from '@/lib/types';
import { summarizeAuditLogs } from '@/ai/flows/summarize-audit-logs';
import { generateActionItems } from '@/ai/flows/generate-action-items';
import { z } from 'zod';

export async function createAuditAction(values: z.infer<typeof auditSchema>) {
  const validatedFields = auditSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid data provided.' };
  }
  
  try {
    await dbCreateAudit(validatedFields.data);
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create audit in the database.' };
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
    console.error('Failed to delete audit:', error);
    return { error: 'Failed to delete audit from the database.' };
  }
}

export async function getAiSummary(audit: Audit) {
    const auditLogString = `
      Auditor: ${audit.auditorName}
      Patient: ${audit.patientName}
      Document: ${audit.documentType} - ${audit.documentNumber}
      Event: ${audit.event} (${audit.eventDetails})
      Follow-up Date: ${audit.followUpDate.toDateString()}
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
      return { error: "Failed to generate AI analysis." };
    }
}
