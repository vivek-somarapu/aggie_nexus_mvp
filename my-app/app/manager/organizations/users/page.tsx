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
import { AlertCircle, CheckCircle, XCircle, Search, Clock, User, Calendar, Mail, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";

// Define User Affiliation Claim type for this page
interface UserAffiliationClaim {
  id: string;
  user_id: string;
  org_id: string;
  status: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
  organization?: {
    name: string;
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

export default function OrganizationUserManagement() {
  const { authUser, isLoading: authLoading, role } = useAuth();
  const router = useRouter();
  const [affiliationClaims, setAffiliationClaims] = useState<UserAffiliationClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [claimToManage, setClaimToManage] = useState<UserAffiliationClaim | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject">("approve");
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect non-organization managers
  useEffect(() => {
    if (!authLoading && role !== 'admin' && role !== 'manager') {
      router.push('/');
    }
  }, [authLoading, role, router]);

  // Fetch affiliation claims
  const fetchAffiliationClaims = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // TODO: Implement organization-specific affiliation claim fetching
      // For now, fetching all pending claims
      const { data, error } = await supabase
        .from('organization_affiliation_claims')
        .select(`
          *,
          user:users!organization_affiliation_claims_user_id_fkey(full_name, email),
          organization:organizations!organization_affiliation_claims_org_id_fkey(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setAffiliationClaims(data as UserAffiliationClaim[]);
    } catch (err) {
      console.error("Error fetching affiliation claims:", err);
      setError("Failed to load affiliation claims. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch claims when component mounts
  useEffect(() => {
    if (!authLoading && (role === 'admin' || role === 'manager')) {
      fetchAffiliationClaims();
    }
  }, [authLoading, role]);

  const handleApproveClaim = async (claimId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const supabase = createClient();
      
      const { error } = await supabase
        .from('organization_affiliation_claims')
        .update({ 
          status: 'approved',
          approved_by: authUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', claimId);
      
      if (error) {
        throw error;
      }
      
      setSuccess("Affiliation claim approved successfully!");
      setAffiliationClaims(affiliationClaims.filter(c => c.id !== claimId));
      setConfirmDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error approving affiliation claim:", err);
      setError("Failed to approve affiliation claim. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const supabase = createClient();
      
      const { error } = await supabase
        .from('organization_affiliation_claims')
        .update({ 
          status: 'rejected',
          approved_by: authUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', claimId);
      
      if (error) {
        throw error;
      }
      
      setSuccess("Affiliation claim rejected successfully!");
      setAffiliationClaims(affiliationClaims.filter(c => c.id !== claimId));
      setConfirmDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error rejecting affiliation claim:", err);
      setError("Failed to reject affiliation claim. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openConfirmDialog = (claim: UserAffiliationClaim, action: "approve" | "reject") => {
    setClaimToManage(claim);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const filteredClaims = affiliationClaims.filter(claim =>
    claim.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    claim.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    claim.organization?.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              User Affiliation Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Review and approve pending user affiliation requests
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
            placeholder="Search by user name, email, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Affiliation Claims Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Pending Affiliation Claims ({filteredClaims.length})</CardTitle>
            <CardDescription>
              User requests to be affiliated with your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending affiliation claims found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{claim.user?.full_name || 'Unknown User'}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span>{claim.user?.email || 'No email'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{claim.organization?.name || 'Unknown Organization'}</span>
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
              {confirmAction === "approve" ? "Approve Affiliation" : "Reject Affiliation"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction} the affiliation request from{" "}
              <strong>{claimToManage?.user?.full_name}</strong> for{" "}
              <strong>{claimToManage?.organization?.name}</strong>?
              {confirmAction === "approve" 
                ? " This will grant them affiliation status with your organization."
                : " This will reject their affiliation request."
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
                    handleApproveClaim(claimToManage.id);
                  } else {
                    handleRejectClaim(claimToManage.id);
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