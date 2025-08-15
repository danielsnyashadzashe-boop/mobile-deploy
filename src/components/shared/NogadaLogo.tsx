
import React from 'react';

interface NogadaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const NogadaLogo: React.FC<NogadaLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="bg-nogada-primary text-white font-bold rounded-lg px-2 py-1 mr-2">
        <span className={`${sizeClasses[size]}`}>N</span>
      </div>
      <div className="font-bold text-nogada-dark">
        <span className={`${sizeClasses[size]}`}>Nogada</span>
      </div>
    </div>
  );
};

export default NogadaLogo;
