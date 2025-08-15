
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface TipVolumeChartProps {
  locationFilter?: string;
}

const TipVolumeChart: React.FC<TipVolumeChartProps> = ({ locationFilter }) => {
  // Mock data for the last 7 days
  const data = [
    { date: '2024-05-22', tips: 245, amount: 2450 },
    { date: '2024-05-23', tips: 312, amount: 3120 },
    { date: '2024-05-24', tips: 189, amount: 1890 },
    { date: '2024-05-25', tips: 278, amount: 2780 },
    { date: '2024-05-26', tips: 356, amount: 3560 },
    { date: '2024-05-27', tips: 423, amount: 4230 },
    { date: '2024-05-28', tips: 389, amount: 3890 },
  ];

  const chartConfig = {
    amount: {
      label: "Tip Amount (R)",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
          />
          <YAxis />
          <ChartTooltip 
            content={<ChartTooltipContent />}
            labelFormatter={(value) => new Date(value).toLocaleDateString('en-ZA')}
          />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="var(--color-amount)" 
            strokeWidth={2}
            dot={{ fill: "var(--color-amount)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default TipVolumeChart;
