import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Rocket, Award, Building2 } from 'lucide-react';
import { ProgramLogo } from './program-logo';

interface IncubatorAcceleratorBadgeProps {
  type: 'incubator' | 'accelerator';
  program: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const programConfig = {
  'Aggies Create Incubator': {
    type: 'incubator' as const,
    gradient: 'from-amber-500 to-gray-900',
    glow: 'shadow-gray-900/50',
    textColor: 'text-white'
  },
  'AggieX Accelerator': {
    type: 'accelerator' as const,
    gradient: 'from-white to-black',
    glow: 'shadow-[#500000]/50',
    textColor: 'text-white'
  }
};


export function IncubatorAcceleratorBadge({ 
  type, 
  program, 
  className = '', 
  size = 'md' 
}: IncubatorAcceleratorBadgeProps) {
  const config = programConfig[program as keyof typeof programConfig];
  
  if (!config) {
    // Fallback for unknown programs
    return (
      <Badge 
        variant="outline" 
        className={`${className} flex items-center gap-1`}
      >
        <Award className="h-3 w-3" />
        {program}
      </Badge>
    );
  }

  const sizeClasses = {
    sm: 'h-5 px-2 text-xs',
    md: 'h-6 px-2.5 text-sm',
    lg: 'h-7 px-3 text-base'
  };

  return (
    <Badge 
      className={`
        bg-gradient-to-r ${config.gradient} 
        ${config.textColor} 
        border-0 
        ${config.glow} 
        ${sizeClasses[size]} 
        ${className} 
        flex items-center gap-1 
        font-semibold
        shadow-lg
        hover:shadow-xl
        transition-all
        duration-200
      `}
    >
      <ProgramLogo program={program} size={size} />
      {program}
    </Badge>
  );
}

interface IncubatorAcceleratorBadgesProps {
  programs: string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
}

export function IncubatorAcceleratorBadges({ 
  programs, 
  className = '', 
  size = 'md',
  maxDisplay = 2 
}: IncubatorAcceleratorBadgesProps) {
  if (!programs || programs.length === 0) return null;

  const displayPrograms = programs.slice(0, maxDisplay);
  const remainingCount = programs.length - maxDisplay;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayPrograms.map((program) => {
        const config = programConfig[program as keyof typeof programConfig];
        const type = config?.type || 'incubator';
        
        return (
          <IncubatorAcceleratorBadge
            key={program}
            type={type}
            program={program}
            size={size}
          />
        );
      })}
      {remainingCount > 0 && (
        <Badge 
          variant="secondary" 
          className={`${size === 'sm' ? 'h-5 px-2 text-xs' : 'h-6 px-2.5 text-sm'}`}
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

interface ProjectProgramBadgeProps {
  programs: string[];
  className?: string;
}

export function ProjectProgramBadge({ 
  programs, 
  className = '' 
}: ProjectProgramBadgeProps) {
  if (!programs || programs.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="font-semibold text-sm">Program Affiliations</h3>
      <IncubatorAcceleratorBadges 
        programs={programs} 
        size="md"
        maxDisplay={3}
      />
    </div>
  );
} 