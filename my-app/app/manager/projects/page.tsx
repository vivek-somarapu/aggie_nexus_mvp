"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, FileText, Trash2, Search, Calendar, Users, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";

// Define the actual Project interface based on Supabase schema
interface Project {
  id: string;
  title: string; // This might be 'title' instead of 'name' in the database
  description?: string;
  status?: string;
  created_at: string;
  created_by?: string;
}

// Extended project with UI-specific properties
interface ExtendedProject extends Project {
  owner_name: string;
}

// Type for profile data mapping
interface ProfilesData {
  [key: string]: string;
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

export default function ProjectManagementPage() {
  const { user, isLoading: authLoading, isManager } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<ExtendedProject | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Redirect non-managers
  useEffect(() => {
    if (!authLoading && !isManager) {
      router.push('/projects');
    }
  }, [authLoading, isManager, router]);

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Get basic project data
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // If no data is returned, use an empty array
      if (!data || !Array.isArray(data)) {
        console.log("No project data returned or data is not an array");
        setProjects([]);
        return;
      }

      console.log("Project data:", data);
      
      // Prepare for handling profiles data
      const profilesData: ProfilesData = {};
      
      // Get creator profiles if there are any projects with creator IDs
      const userIds = data
        .map(project => project.created_by)
        .filter((id): id is string => id !== null && id !== undefined);
      
      if (userIds.length > 0) {
        try {
          // Fetch all profiles at once
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name');
            
          if (profiles && Array.isArray(profiles)) {
            console.log("Profiles data:", profiles);
            profiles.forEach(profile => {
              if (profile && profile.id) {
                profilesData[profile.id] = profile.full_name || 'Unknown';
              }
            });
          }
        } catch (profileError) {
          console.warn("Error fetching profiles:", profileError);
          // Continue anyway without profiles
        }
      }
      
      // Transform projects with safe access to properties
      const transformedProjects: ExtendedProject[] = data.map(project => ({
        ...project,
        // Use title if available, otherwise use id as fallback
        title: project.title || project.name || `Project ${project.id}`,
        // Safe access to other properties
        description: project.description || '',
        status: project.status || 'active',
        owner_name: project.created_by ? (profilesData[project.created_by] || 'Unknown') : 'Unknown'
      }));
      
      console.log("Transformed projects:", transformedProjects);
      setProjects(transformedProjects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch projects when component mounts
  useEffect(() => {
    if (!authLoading && isManager) {
      fetchProjects();
    }
  }, [authLoading, isManager]);

  // Handle project deletion with proper error handling
  const deleteProject = async (projectId: string) => {
    if (!projectId) {
      setError("Invalid project ID");
      return;
    }
    
    try {
      setError(null);
      const supabase = createClient();
      
      // First delete project members if the table exists
      try {
        const { error: membersError } = await supabase
          .from('project_members')
          .delete()
          .eq('project_id', projectId);
        
        if (membersError) {
          console.warn("Error deleting project members:", membersError);
          // Continue with deletion even if this fails
        }
      } catch (membersErr) {
        console.warn("Error with project_members table:", membersErr);
        // Continue anyway
      }
      
      // Then delete project tasks if the table exists
      try {
        const { error: tasksError } = await supabase
          .from('project_tasks')
          .delete()
          .eq('project_id', projectId);
        
        if (tasksError) {
          console.warn("Error deleting project tasks:", tasksError);
          // Continue with deletion even if this fails
        }
      } catch (tasksErr) {
        console.warn("Error with project_tasks table:", tasksErr);
        // Continue anyway
      }
      
      // Finally delete the project itself
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (projectError) {
        throw projectError;
      }
      
      // Update local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      // Show success message
      setSuccess("Project deleted successfully.");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project. Please try again.");
    } finally {
      setConfirmDialogOpen(false);
    }
  };

  // Open confirm dialog
  const openConfirmDialog = (project: ExtendedProject) => {
    setProjectToDelete(project);
    setConfirmDialogOpen(true);
  };

  // Handle confirm deletion
  const handleConfirmDeletion = () => {
    if (!projectToDelete) return;
    deleteProject(projectToDelete.id);
  };

  // Filter projects based on search query with null safety
  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase();
    
    // Safely check if properties exist before calling toLowerCase()
    const titleMatch = project.title && typeof project.title === 'string' 
      ? project.title.toLowerCase().includes(query) 
      : false;
      
    const descMatch = project.description && typeof project.description === 'string'
      ? project.description.toLowerCase().includes(query)
      : false;
      
    const ownerMatch = project.owner_name && typeof project.owner_name === 'string'
      ? project.owner_name.toLowerCase().includes(query)
      : false;
      
    return titleMatch || descMatch || ownerMatch;
  });

  // Get badge color based on project status
  const getStatusBadge = (status: string = '') => {
    switch(status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300">Completed</Badge>;
      case 'on hold':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300">On Hold</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-4 space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-4"></div>
        <div className="h-6 w-96 bg-muted/60 rounded animate-pulse mb-8"></div>
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!isManager) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <motion.div 
      className="container mx-auto max-w-7xl p-4 space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">
          Project Management
        </h1>
        <p className="text-muted-foreground">
          Manage all projects across the platform
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
          <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              <span>All Projects</span>
            </CardTitle>
            <CardDescription>
              {projects.length} projects total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No projects found matching your search.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{project.title}</span>
                            {project.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {project.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{project.owner_name}</TableCell>
                        <TableCell>{getStatusBadge(project.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/projects/${project.id}`)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openConfirmDialog(project)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The project and all its data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {projectToDelete && (
              <div className="flex flex-col gap-2 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium">{projectToDelete.title}</p>
                </div>
                {projectToDelete.description && (
                  <p className="text-sm text-muted-foreground ml-7">{projectToDelete.description}</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDeletion}
            >
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 