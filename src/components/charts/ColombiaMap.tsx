'use client';
import React from 'react';

export default function ColombiaMap({ data, dataKey }: { data: any[], dataKey: string }) {
    return (
        <div className="h-full w-full flex items-center justify-center bg-gray-200">
            <p>Colombia Map Component (Under Development)</p>
            <p>Displaying KPI: {dataKey}</p>
        </div>
    );
}
