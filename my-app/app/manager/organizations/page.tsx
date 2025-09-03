"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Building2, Users, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { OrganizationBadge } from "@/components/ui/organization-badge";

interface ManagedOrganization {
  org_id: string;
  organization: {
    id: string;
    name: string;
    description: string | null;
  };
  stats: {
    pendingProjects: number;
    pendingUsers: number;
    totalProjects: number;
    totalUsers: number;
  };
}

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 12, stiffness: 100 }
  }
};

export default function OrganizationSelector() {
  const { authUser, isLoading: authLoading, role } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<ManagedOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-organization managers
  useEffect(() => {
    if (!authLoading && role === 'user') {
      router.push('/');
    }
  }, [authLoading, role, router]);

  // Fetch organizations the user manages
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!authUser || authLoading) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const supabase = createClient();
        
        // Get all organizations the user manages
        const { data: managerData, error: managerError } = await supabase
          .from('organization_managers')
          .select(`
            org_id,
            organization:organizations!organization_managers_org_id_fkey(
              id,
              name,
              description
            )
          `)
          .eq('user_id', authUser.id);
        
        if (managerError) {
          throw managerError;
        }
        
        if (!managerData || managerData.length === 0) {
          setError('You are not authorized to manage any organizations.');
          setIsLoading(false);
          return;
        }
        
        // Fetch stats for each organization
        const organizationsWithStats = await Promise.all(
          managerData.map(async (item) => {
            const orgId = item.org_id;
            
            // Get pending project claims
            const { count: pendingProjects } = await supabase
              .from('project_organization_claims')
              .select('*', { count: 'exact', head: true })
              .eq('org_id', orgId)
              .eq('status', 'pending');
            
            // Get pending user claims
            const { count: pendingUsers } = await supabase
              .from('organization_affiliation_claims')
              .select('*', { count: 'exact', head: true })
              .eq('org_id', orgId)
              .eq('status', 'pending');
            
            // Get total approved projects
            const { count: totalProjects } = await supabase
              .from('project_organization_claims')
              .select('*', { count: 'exact', head: true })
              .eq('org_id', orgId)
              .eq('status', 'approved');
            
            // Get total approved users
            const { count: totalUsers } = await supabase
              .from('organization_affiliation_claims')
              .select('*', { count: 'exact', head: true })
              .eq('org_id', orgId)
              .eq('status', 'approved');
            
            return {
              org_id: orgId,
              organization: item.organization,
              stats: {
                pendingProjects: pendingProjects || 0,
                pendingUsers: pendingUsers || 0,
                totalProjects: totalProjects || 0,
                totalUsers: totalUsers || 0,
              }
            };
          })
        );
        
        setOrganizations(organizationsWithStats);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError("Failed to load organizations. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrganizations();
  }, [authUser, authLoading]);

  const handleSelectOrganization = (orgId: string) => {
    router.push(`/manager/organizations/${orgId}/projects`);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="container mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Organization Management</h1>
        <p className="text-muted-foreground">
          Select an organization to manage its projects and users
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <motion.div
              key={org.org_id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <OrganizationBadge organization={org.organization.name} variant="default" />
                  </div>
                  <CardTitle className="text-xl">{org.organization.name}</CardTitle>
                  <CardDescription>
                    {org.organization.description || "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {org.stats.pendingProjects}
                      </div>
                      <div className="text-sm text-blue-600">Pending Projects</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {org.stats.pendingUsers}
                      </div>
                      <div className="text-sm text-green-600">Pending Users</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {org.stats.totalProjects}
                      </div>
                      <div className="text-sm text-gray-600">Total Projects</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {org.stats.totalUsers}
                      </div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => handleSelectOrganization(org.org_id)}
                      className="flex-1"
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Manage Projects
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/manager/organizations/${org.org_id}/users`)}
                      className="flex-1"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && organizations.length === 0 && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
            <p className="text-muted-foreground mb-4">
              You are not currently managing any organizations.
            </p>
            <Button onClick={() => router.push('/')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
} 