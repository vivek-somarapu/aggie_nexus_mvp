"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; 
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, User, Users, Shield, Trash2, Search, UserCheck, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";

// Define User type for this page
interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
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

export default function UserManagementPage() {
  const { user, isLoading: authLoading, role } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userToManage, setUserToManage] = useState<User | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"promote" | "demote" | "delete">("delete");

  // Redirect non-managers
  useEffect(() => {
    if (!authLoading && role !== 'admin') {
      router.push('/');
    }
  }, [authLoading, role, router]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Fetch all users
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('deleted', false)
        .order('full_name');
      
      if (error) {
        throw error;
      }
      
      setUsers(data as User[]);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users when component mounts
  useEffect(() => {
    if (!authLoading && role === 'admin') {
      fetchUsers();
    }
  }, [authLoading, role]);

  // Handle user role update
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setError(null);
      
      const supabase = createClient();
      
      // Update user role
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setUsers(prev => 
        prev.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
      
      // Show success message
      setSuccess(`User ${newRole === 'manager' ? 'promoted to manager' : 'role updated'} successfully.`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error("Error updating user role:", err);
      setError("Failed to update user role. Please try again.");
    } finally {
      setConfirmDialogOpen(false);
    }
  };

  // Handle user deletion
  const deleteUser = async (userId: string) => {
    try {
      setError(null);
      
      const supabase = createClient();
      
      // Delete user from profiles
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      // Show success message
      setSuccess("User deleted successfully.");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user. Please try again.");
    } finally {
      setConfirmDialogOpen(false);
    }
  };

  // Open confirm dialog
  const openConfirmDialog = (user: User, action: "promote" | "demote" | "delete") => {
    setUserToManage(user);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  // Handle confirm action
  const handleConfirmAction = () => {
    if (!userToManage) return;
    
    switch (confirmAction) {
      case "promote":
        updateUserRole(userToManage.id, "manager");
        break;
      case "demote":
        updateUserRole(userToManage.id, "user");
        break;
      case "delete":
        deleteUser(userToManage.id);
        break;
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (role !== 'admin') {
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
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage users, assign roles, and control access
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
            placeholder="Search users..."
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
              <Users className="mr-2 h-5 w-5" />
              <span>All Users</span>
            </CardTitle>
            <CardDescription>
              {users.length} users registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No users found matching your search.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell className="font-medium">{userData.full_name}</TableCell>
                        <TableCell>{userData.email}</TableCell>
                        <TableCell>
                          {userData.role === "manager" ? (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-300">
                              Manager
                            </Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {userData.role === "manager" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openConfirmDialog(userData, "demote")}
                                disabled={userData.id === user?.id}
                              >
                                <UserX className="mr-1 h-3.5 w-3.5" />
                                Remove Manager
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openConfirmDialog(userData, "promote")}
                              >
                                <Shield className="mr-1 h-3.5 w-3.5" />
                                Make Manager
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openConfirmDialog(userData, "delete")}
                              disabled={userData.id === user?.id}
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
            <DialogTitle>
              {confirmAction === "promote" 
                ? "Promote to Manager" 
                : confirmAction === "demote" 
                  ? "Remove Manager Role" 
                  : "Delete User"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "promote" 
                ? "This will give the user full management access to the system." 
                : confirmAction === "demote" 
                  ? "This will remove manager privileges from the user." 
                  : "This action cannot be undone. The user account will be permanently deleted."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {userToManage && (
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">{userToManage.full_name}</p>
                  <p className="text-sm text-muted-foreground">{userToManage.email}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={confirmAction === "delete" ? "destructive" : "default"}
              onClick={handleConfirmAction}
            >
              {confirmAction === "promote" 
                ? "Confirm Promotion" 
                : confirmAction === "demote" 
                  ? "Confirm Role Change" 
                  : "Confirm Deletion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 