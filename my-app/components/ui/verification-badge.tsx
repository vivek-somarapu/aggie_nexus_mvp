import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { getOrganizationVerificationStatus } from '@/lib/utils/organization-verification';
import { Profile } from '@/lib/auth';

interface VerificationBadgeProps {
  organization: string;
  profile: Profile | null;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function VerificationBadge({ 
  organization, 
  profile, 
  size = 'sm', 
  showText = true,
  className = '' 
}: VerificationBadgeProps) {
  const status = getOrganizationVerificationStatus(profile, organization);
  
  if (status === 'not_claimed') {
    return null; // Don't show badge if not claimed
  }

  const getBadgeConfig = () => {
    switch (status) {
      case 'verified':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Verified'
        };
      case 'pending':
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-3 w-3" />,
          text: 'Pending'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="h-3 w-3" />,
          text: 'Rejected'
        };
      default:
        return {
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Unknown'
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses = {
    sm: 'h-5 px-2 text-xs',
    md: 'h-6 px-2.5 text-sm',
    lg: 'h-7 px-3 text-base'
  };

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} ${className} flex items-center gap-1`}
    >
      {config.icon}
      {showText && config.text}
    </Badge>
  );
}

interface OrganizationWithVerificationProps {
  organization: string;
  profile: Profile | null;
  className?: string;
}

export function OrganizationWithVerification({ 
  organization, 
  profile, 
  className = '' 
}: OrganizationWithVerificationProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-medium">{organization}</span>
      <VerificationBadge 
        organization={organization} 
        profile={profile} 
        size="sm" 
        showText={false}
      />
    </div>
  );
} 