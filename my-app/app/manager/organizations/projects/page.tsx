"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, XCircle, Search, Clock, Calendar, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

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

  const handleTabChange = (value: string) => {
    setActiveTab(value as "pending" | "approved" | "rejected");
  };

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
          decided_at: new Date().toISOString(),
          decided_by: authUser?.id
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
      console.error("Error rejecting project organization claim:", err);
      setError("Failed to reject project organization claim. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openConfirmDialog = (claim: ProjectOrganizationClaim, action: "approve" | "reject") => {
    setClaimToManage(claim);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const filteredProjects = projectClaims.filter(claim =>
    claim.project?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (role !== 'admin' && role !== 'manager') {
    return null;
  }

  return (
    <motion.div
      className="container mx-auto p-6 space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Project Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Review and approve pending project submissions
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/manager/organizations')}>
            Back to Dashboard
          </Button>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Success Alert */}
      {success && (
        <motion.div variants={itemVariants}>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Search */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects by title or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Projects Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Pending Projects ({filteredProjects.length})</CardTitle>
            <CardDescription>
              Projects awaiting approval for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending projects found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{claim.project?.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {claim.project?.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(claim.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => openConfirmDialog(claim, "approve")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openConfirmDialog(claim, "reject")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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