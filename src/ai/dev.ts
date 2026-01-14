import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-audit-logs.ts';
import '@/ai/flows/generate-action-items.ts';