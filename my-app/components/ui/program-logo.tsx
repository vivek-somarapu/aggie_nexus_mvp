import React from 'react';
import Image from 'next/image';
import { Building2, Rocket, Award } from 'lucide-react';
import incubatorLogo from '@/public/images/incubatorlogoblack.png';
import aggiexLogo from '@/public/images/AggieX_logo_X.png';

interface ProgramLogoProps {
  program: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const programConfig = {
  'Aggies Create Incubator': {
    icon: <Building2 className="h-3 w-3" />,
    logo: incubatorLogo,
    fallbackIcon: <Building2 className="h-3 w-3" />
  },
  'AggieX Accelerator': {
    icon: <Rocket className="h-3 w-3" />,
    logo: aggiexLogo,
    fallbackIcon: <Rocket className="h-3 w-3" />
  }
};

export function ProgramLogo({ 
  program, 
  size = 'md', 
  className = '' 
}: ProgramLogoProps) {
  const config = programConfig[program as keyof typeof programConfig];
  
  if (!config) {
    return <Award className="h-3 w-3" />;
  }

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4.5 w-4.5', 
    lg: 'h-5.5 w-5.5'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <Image
        src={config.logo}
        alt={`${program} logo`}
        width={size === 'sm' ? 8 : size === 'lg' ? 12 : 10}
        height={size === 'sm' ? 8 : size === 'lg' ? 12 : 10}
        className="object-contain max-w-full max-h-full"
      />
    </div>
  );
} 