'use client';

import { useState } from 'react';
import type { Audit } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getAiSummary } from '@/app/actions';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Separator } from './ui/separator';

type Analysis = {
  summary: string;
  actionItems: string;
} | null;

export function AiAnalysis({ audit }: { audit: Audit }) {
  const [analysis, setAnalysis] = useState<Analysis>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getAiSummary(audit);
    if (result.error) {
      setError(result.error);
    } else if (result.summary && result.actionItems) {
      setAnalysis(result as { summary: string; actionItems: string });
    } else {
      setError("Received an empty response from the AI.");
    }
    setIsLoading(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">AI Analysis</CardTitle>
        <CardDescription>
          Generate a summary and actionable items using AI based on the audit log.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && !isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
             <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
             <h3 className="text-lg font-semibold text-foreground">Ready for analysis</h3>
             <p className="text-muted-foreground max-w-sm mx-auto mt-1 mb-4">Click the button to process this audit log and generate an intelligent summary and suggested action items.</p>
            <Button onClick={handleAnalysis} disabled={isLoading}>
              <BrainCircuit className="mr-2 h-4 w-4" />
              Generate Analysis
            </Button>
          </div>
        )}
        {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8">
                 <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
                 <p className="mt-4 text-muted-foreground">Generating analysis, please wait...</p>
            </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Analysis Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {analysis && (
          <div className="space-y-6 animate-in fade-in-50 duration-500">
            <div>
              <h3 className="text-lg font-semibold mb-2 font-headline">Summary</h3>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap bg-secondary/50 p-4 rounded-md">
                {analysis.summary}
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-2 font-headline">Action Items</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-foreground/90 bg-secondary/50 p-4 rounded-md">
                {analysis.actionItems.split('\n').filter(item => item.trim() !== '').map((item, index) => (
                  <li key={index} className="pl-2">{item.replace(/^\d+\.\s*/, '')}</li>
                ))}
              </ol>
            </div>
            <Separator />
            <div className="flex justify-center">
                <Button variant="outline" onClick={handleAnalysis} disabled={isLoading}>
                  {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Re-generating...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Re-generate Analysis
                      </>
                    )
                  }
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
