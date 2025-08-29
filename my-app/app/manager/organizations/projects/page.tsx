"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, XCircle, Search, Clock, Calendar, MapPin, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";

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

  // Redirect non-organization managers
  useEffect(() => {
    if (!authLoading && role === 'user') {
      router.push('/');
    }
  }, [authLoading, role, router]);

  // Fetch projects
  const fetchProjects = async (status: "pending" | "approved" | "rejected" = "pending") => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // First, fetch the organization the user manages
      const { data: managerData, error: managerError } = await supabase
        .from('organization_managers')
        .select('org_id')
        .eq('user_id', authUser?.id)
        .single();
      
      if (managerError) {
        throw new Error('You are not authorized to manage any organization');
      }
      
      const orgId = managerData.org_id;
      
      // Now fetch project organization claims for that organization with the specified status
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
    if (!authLoading && role !== 'user') {
      fetchProjects(activeTab);
    }
  }, [authLoading, role, activeTab]);

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
      setProjectClaims(projectClaims.filter(p => p.id !== projectId));
      setConfirmDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
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
      setProjectClaims(projectClaims.filter(p => p.id !== projectId));
      setConfirmDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (role === 'user') {
    return null;
  }

  return (
    <motion.div
      className="container mx-auto max-w-7xl p-4 space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Project Organization Management</h1>
        <p className="text-muted-foreground">
          Review, approve, or reject project organization claims
        </p>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {success && (
        <motion.div variants={itemVariants}>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          {/* 🔎 Search Bar */}
          <input
            type="text"
            placeholder="Search by project title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md w-full sm:w-64"
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "pending" | "approved" | "rejected")}
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          {(["pending", "approved", "rejected"] as const).map((status) => (
            <TabsContent key={status} value={status}>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-40 w-full" />
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
      </motion.div>

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
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (claimToManage) {
                  if (confirmAction === "approve") {
                    handleApproveProject(claimToManage.id);
                  } else {
                    handleRejectProject(claimToManage.id);
                  }
                }
              }}
              disabled={isProcessing}
              className={confirmAction === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isProcessing ? "Processing..." : confirmAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 