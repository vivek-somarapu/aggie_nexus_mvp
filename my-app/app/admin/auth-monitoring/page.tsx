import { Metadata } from 'next';
import AuthMonitoringDashboard from '@/components/auth-monitoring-dashboard';

export const metadata: Metadata = {
  title: 'Authentication Monitoring | Aggie Nexus',
  description: 'Monitor authentication system health and performance',
};

/**
 * Authentication Monitoring Page (Phase 5)
 * 
 * Provides comprehensive monitoring and testing capabilities
 * for the authentication system. Accessible to managers only.
 */
export default function AuthMonitoringPage() {
  return (
    <div className="min-h-screen bg-background">
      <AuthMonitoringDashboard />
    </div>
  );
} 