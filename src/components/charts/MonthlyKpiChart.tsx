'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ChartDataItem = {
  name: string;
  [key: string]: number | string;
};

interface MonthlyKpiChartProps {
  data: ChartDataItem[];
  dataKey: string;
  fillColor: string;
}

export function MonthlyKpiChart({ data, dataKey, fillColor }: MonthlyKpiChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{dataKey}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full flex items-center justify-center bg-muted rounded-md">
          <p>Chart for {dataKey} is under development.</p>
        </div>
      </CardContent>
    </Card>
  );
}
