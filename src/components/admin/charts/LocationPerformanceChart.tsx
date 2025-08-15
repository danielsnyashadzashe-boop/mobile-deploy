
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface LocationPerformanceChartProps {
  transactionTypes?: string[];
}

const LocationPerformanceChart: React.FC<LocationPerformanceChartProps> = ({ transactionTypes }) => {
  // Mock data for top performing locations
  const data = [
    { location: 'Sandton City', tips: 1234, amount: 12340 },
    { location: 'Canal Walk', tips: 987, amount: 9870 },
    { location: 'Gateway', tips: 876, amount: 8760 },
    { location: 'Menlyn Park', tips: 765, amount: 7650 },
    { location: 'V&A Waterfront', tips: 654, amount: 6540 },
  ];

  const chartConfig = {
    amount: {
      label: "Total Tips (R)",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="location" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <ChartTooltip 
            content={<ChartTooltipContent />}
          />
          <Bar 
            dataKey="amount" 
            fill="var(--color-amount)" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default LocationPerformanceChart;
