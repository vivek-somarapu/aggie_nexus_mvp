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
import { AlertCircle, CheckCircle, XCircle, Search, Clock, User, Calendar, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";

// Define Project type for this page
interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name: string;
    email: string;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectToManage, setProjectToManage] = useState<Project | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject">("approve");
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect non-organization managers
  useEffect(() => {
    if (!authLoading && role === 'user') {
      router.push('/');
    }
  }, [authLoading, role, router]);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Fetching all pending projects towards the organization
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          creator:users!projects_created_by_fkey(full_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setProjects(data as Project[]);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch projects when component mounts
  useEffect(() => {
    if (!authLoading && (role === 'admin' || role === 'manager')) {
      fetchProjects();
    }
  }, [authLoading, role]);

  const handleApproveProject = async (projectId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const supabase = createClient();
      
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: 'approved',
          approved_by: authUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', projectId);
      
      if (error) {
        throw error;
      }
      
      setSuccess("Project approved successfully!");
      setProjects(projects.filter(p => p.id !== projectId));
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
      
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: 'rejected',
          approved_by: authUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', projectId);
      
      if (error) {
        throw error;
      }
      
      setSuccess("Project rejected successfully!");
      setProjects(projects.filter(p => p.id !== projectId));
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

  const openConfirmDialog = (project: Project, action: "approve" | "reject") => {
    setProjectToManage(project);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.creator?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {project.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{project.creator?.full_name || 'Unknown'}</span>
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
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => openConfirmDialog(project, "approve")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openConfirmDialog(project, "reject")}
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
              Are you sure you want to {confirmAction} "{projectToManage?.title}"?
              {confirmAction === "approve" 
                ? " This will make the project visible to all users."
                : " This will reject the project submission."
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
                if (projectToManage) {
                  if (confirmAction === "approve") {
                    handleApproveProject(projectToManage.id);
                  } else {
                    handleRejectProject(projectToManage.id);
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