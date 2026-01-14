'use server';

/**
 * @fileOverview Summarizes audit logs to identify trends and concerns.
 *
 * - summarizeAuditLogs - A function that summarizes audit logs.
 * - SummarizeAuditLogsInput - The input type for the summarizeAuditLogs function.
 * - SummarizeAuditLogsOutput - The return type for the summarizeAuditLogs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAuditLogsInputSchema = z.object({
  logs: z.string().describe('The audit logs to summarize.'),
});

export type SummarizeAuditLogsInput = z.infer<typeof SummarizeAuditLogsInputSchema>;

const SummarizeAuditLogsOutputSchema = z.object({
  summary: z.string().describe('A summary of the audit logs.'),
});

export type SummarizeAuditLogsOutput = z.infer<typeof SummarizeAuditLogsOutputSchema>;

export async function summarizeAuditLogs(input: SummarizeAuditLogsInput): Promise<SummarizeAuditLogsOutput> {
  return summarizeAuditLogsFlow(input);
}

const summarizeAuditLogsPrompt = ai.definePrompt({
  name: 'summarizeAuditLogsPrompt',
  input: {schema: SummarizeAuditLogsInputSchema},
  output: {schema: SummarizeAuditLogsOutputSchema},
  prompt: `You are a quality assurance auditor. Summarize the following audit logs to identify trends and potential areas of concern:\n\nLogs: {{{logs}}}`,
});

const summarizeAuditLogsFlow = ai.defineFlow(
  {
    name: 'summarizeAuditLogsFlow',
    inputSchema: SummarizeAuditLogsInputSchema,
    outputSchema: SummarizeAuditLogsOutputSchema,
  },
  async input => {
    const {output} = await summarizeAuditLogsPrompt(input);
    return output!;
  }
);
