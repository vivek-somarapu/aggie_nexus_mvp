"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, XCircle, Clock, Calendar, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { OrganizationBadge } from "@/components/ui/organization-badge";

// Define Project Organization Claim type for this page
interface ProjectOrganizationClaim {
  id: string;
  project_id: string;
  org_id: string;
  status: string;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
  
  project?: {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  };
  
  organization?: {
    id: string;
    name: string;
    description: string | null;
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

export default function OrganizationProjectManagement() {
  const { authUser, isLoading: authLoading, role } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orgId = params.id as string;
  
  const [projectClaims, setProjectClaims] = useState<ProjectOrganizationClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [claimToManage, setClaimToManage] = useState<ProjectOrganizationClaim | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject">("approve");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [organization, setOrganization] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check if user is authorized to manage this organization
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!authUser || !orgId) return;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organization_managers')
        .select('org_id')
        .eq('user_id', authUser.id)
        .eq('org_id', orgId)
        .single();
      
      if (error || !data) {
        router.push('/manager/organizations');
        return;
      }
      
      setIsAuthorized(true);
      
      // Fetch organization details
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, description')
        .eq('id', orgId)
        .single();
      
      setOrganization(orgData);
    };
    
    checkAuthorization();
  }, [authUser, orgId, router]);

  // Redirect non-organization managers
  useEffect(() => {
    if (!authLoading && role === 'user') {
      router.push('/');
    }
  }, [authLoading, role, router]);

  // Fetch projects for this specific organization
  const fetchProjects = async (status: "pending" | "approved" | "rejected" = "pending") => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Fetch project organization claims for this specific organization
      const { data, error } = await supabase
        .from('project_organization_claims')
        .select(`
          *,
          project:projects!project_organization_claims_project_id_fkey(
            id,
            title,
            description,
            created_at,
            updated_at
          ),
          organization:organizations!project_organization_claims_org_id_fkey(
            id,
            name,
            description
          )
        `)
        .eq('status', status)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setProjectClaims(data as ProjectOrganizationClaim[]);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch projects when component mounts or tab changes
  useEffect(() => {
    if (!authLoading && role !== 'user' && isAuthorized) {
      fetchProjects(activeTab);
    }
  }, [authLoading, role, activeTab, isAuthorized]);

  const handleApproveProject = async (projectId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const supabase = createClient();

      // First, update the project organization claim to approved
      const { error } = await supabase
        .from('project_organization_claims')
        .update({ 
          status: 'approved',
          decided_by: authUser?.id,
          decided_at: new Date().toISOString()
        })
        .eq('id', projectId);
      
      if (error) {
        throw error;
      }

      // Then, update the project to be associated with the organization via the project_organizations table
      const claim = projectClaims.find(c => c.id === projectId);
      if (claim) {
        const { error: orgError } = await supabase
          .from('project_organizations')
          .insert({
            project_id: claim.project_id,
            org_id: claim.org_id,
            verified_at: new Date().toISOString(),
            verified_by: authUser?.id
          });
        
        if (orgError) {
          throw orgError;
        }
      }
      
      setSuccess("Project organization claim approved successfully!");
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh the data
      fetchProjects(activeTab);
    } catch (err) {
      console.error("Error approving project:", err);
      setError("Failed to approve project. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectProject = async (projectId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const supabase = createClient();

      // Update the project organization claim to rejected
      const { error } = await supabase
        .from('project_organization_claims')
        .update({ 
          status: 'rejected',
          decided_by: authUser?.id,
          decided_at: new Date().toISOString()
        })
        .eq('id', projectId);
      
      if (error) {
        throw error;
      }
      
      setSuccess("Project organization claim rejected successfully!");
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh the data
      fetchProjects(activeTab);
    } catch (err) {
      console.error("Error rejecting project:", err);
      setError("Failed to reject project. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openConfirmDialog = (claim: ProjectOrganizationClaim, action: "approve" | "reject") => {
    setClaimToManage(claim);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!claimToManage) return;
    
    if (confirmAction === "approve") {
      await handleApproveProject(claimToManage.id);
    } else {
      await handleRejectProject(claimToManage.id);
    }
    
    setConfirmDialogOpen(false);
    setClaimToManage(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || !isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Organization not found.</AlertDescription>
        </Alert>
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
        <div className="flex items-center gap-4 mb-4">
          <OrganizationBadge organization={organization.name} variant="default" />
          <h1 className="text-3xl font-bold">Project Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage project organization claims for {organization.name}
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "pending" | "approved" | "rejected")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {(["pending", "approved", "rejected"] as const).map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : projectClaims.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center">
                  <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No {status} project claims</p>
                </CardContent>
              </Card>
            ) : (
              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {projectClaims
                  .filter((claim) =>
                    claim.project?.title?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((claim) => (
                    <motion.div
                      key={claim.id}
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">
                              Project Claim
                            </Badge>
                            {getStatusBadge(claim.status)}
                          </div>
                          <CardTitle className="pt-2">{claim.project?.title}</CardTitle>
                          <CardDescription>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">
                                {new Date(claim.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {claim.project?.description && (
                            <p className="text-sm line-clamp-3">
                              {claim.project.description}
                            </p>
                          )}
                        </CardContent>
                        {status === "pending" && (
                          <CardFooter className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => openConfirmDialog(claim, "reject")}
                              className="flex-1"
                            >
                              <XCircle className="mr-1 h-4 w-4" /> Reject
                            </Button>
                            <Button
                              onClick={() => openConfirmDialog(claim, "approve")}
                              className="flex-1"
                            >
                              <CheckCircle className="mr-1 h-4 w-4" /> Approve
                            </Button>
                          </CardFooter>
                        )}
                        {status === "approved" && (
                          <CardFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setClaimToManage(claim);
                                setConfirmDialogOpen(true);
                              }}
                            >
                              View Details
                            </Button>
                          </CardFooter>
                        )}
                        {status === "rejected" && (
                          <CardFooter>
                            <Button
                              variant="outline"
                              onClick={() => openConfirmDialog(claim, "approve")}
                            >
                              Move to Approved
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    </motion.div>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "approve" ? "Approve Project" : "Reject Project"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction} "{claimToManage?.project?.title}"?
              {confirmAction === "approve" 
                ? " This will associate the project with your organization."
                : " This will reject the project organization claim."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAction}
              disabled={isProcessing}
              variant={confirmAction === "approve" ? "default" : "destructive"}
            >
              {isProcessing ? "Processing..." : confirmAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 