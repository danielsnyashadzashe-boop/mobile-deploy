
import React from 'react';
import { Wifi } from 'lucide-react';

interface TippaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TippaLogo: React.FC<TippaLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const iconSizes = {
    sm: 14,
    md: 20,
    lg: 28
  };

  const containerSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const cardSizes = {
    sm: 'w-4 h-5',
    md: 'w-5 h-6',
    lg: 'w-7 h-8'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Phone/Card Container */}
        <div className={`bg-white rounded-lg shadow-sm border-2 border-tippa-secondary p-1 ${containerSizes[size]}`}>
          {/* Screen with tippa green */}
          <div className={`bg-tippa-primary rounded-sm relative ${cardSizes[size]}`}>
            {/* Screen details */}
            <div className="absolute inset-x-0 top-0.5 h-0.5 bg-tippa-accent rounded-sm mx-0.5"></div>
            <div className="absolute bottom-0.5 left-0.5 right-0.5 h-0.5 bg-tippa-accent rounded-sm"></div>
          </div>
        </div>
        
        {/* WiFi Signal Icon */}
        <Wifi 
          size={iconSizes[size]} 
          className="absolute -top-1 -right-1 text-tippa-secondary drop-shadow-sm"
        />
      </div>
      
      {/* Brand Text */}
      <div className={`font-black text-tippa-accent ${sizeClasses[size]} tracking-tight`}>
        tippa
      </div>
    </div>
  );
};

export default TippaLogo;
