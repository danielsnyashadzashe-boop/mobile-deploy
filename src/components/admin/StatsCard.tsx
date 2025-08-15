
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, positive, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border-2 border-tippa-secondary/20 hover:border-tippa-secondary/40 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-tippa-neutral mb-1">{title}</div>
          <div className="text-2xl font-bold text-tippa-accent">{value}</div>
          
          {change && (
            <div className={`text-xs mt-1 font-medium ${positive ? 'text-green-600' : 'text-tippa-danger'}`}>
              {positive ? '↗' : '↘'} {change} from last period
            </div>
          )}
        </div>
        
        {icon && (
          <div className="bg-tippa-secondary/10 rounded-lg p-3 border border-tippa-secondary/20">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
