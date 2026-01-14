'use server';

/**
 * @fileOverview A flow to generate actionable items from audit logs.
 *
 * - generateActionItems - A function that generates actionable items from audit logs.
 * - GenerateActionItemsInput - The input type for the generateActionItems function.
 * - GenerateActionItemsOutput - The return type for the generateActionItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateActionItemsInputSchema = z.object({
  auditLogs: z
    .string()
    .describe('The audit logs to generate actionable items from.'),
});
export type GenerateActionItemsInput = z.infer<typeof GenerateActionItemsInputSchema>;

const GenerateActionItemsOutputSchema = z.object({
  actionItems: z
    .string()
    .describe('The generated actionable items from the audit logs.'),
});
export type GenerateActionItemsOutput = z.infer<typeof GenerateActionItemsOutputSchema>;

export async function generateActionItems(
  input: GenerateActionItemsInput
): Promise<GenerateActionItemsOutput> {
  return generateActionItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActionItemsPrompt',
  input: {schema: GenerateActionItemsInputSchema},
  output: {schema: GenerateActionItemsOutputSchema},
  prompt: `You are an auditor tasked with generating a list of actionable items from audit logs.

  Audit Logs: {{{auditLogs}}}

  Generate a list of actionable items that can be used to improve audit effectiveness. Be clear and concise.
  `,
});

const generateActionItemsFlow = ai.defineFlow(
  {
    name: 'generateActionItemsFlow',
    inputSchema: GenerateActionItemsInputSchema,
    outputSchema: GenerateActionItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
