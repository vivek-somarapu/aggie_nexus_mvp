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
import { AlertCircle, CheckCircle, XCircle, Search, Clock, User, Calendar, Mail, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";

// Define User Affiliation Claim type for this page
interface UserAffiliationClaim {
  id: string;
  user_id: string;
  org_id: string;
  status: string;
  created_at: string;
  decided_by?: string;
  decided_at?: string;
  
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar?: string | null;
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
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");

  // Redirect non-organization managers
  useEffect(() => {
    if (!authLoading && role === 'user') {
      router.push('/');
    }
  }, [authLoading, role, router]);

  // Fetch affiliation claims
  const fetchAffiliationClaims = async (status: "pending" | "approved" | "rejected" = "pending") => {
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
      
      // Now fetch user affiliation claims for that organization with the specified status
      const { data, error } = await supabase
        .from('organization_affiliation_claims')
        .select(`
          *,
          user:users!organization_affiliation_claims_user_id_fkey(
            id,
            full_name,
            email,
            avatar
          ),
          organization:organizations!organization_affiliation_claims_org_id_fkey(name)
        `)
        .eq('status', status)
        .eq('org_id', orgId)
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

  // Fetch claims when component mounts or tab changes
  useEffect(() => {
    if (!authLoading && role !== 'user') {
      fetchAffiliationClaims(activeTab);
    }
  }, [authLoading, role, activeTab]);

  const handleApproveUser = async (claimId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const supabase = createClient();

      // First, update the affiliation claim to approved
      const { error } = await supabase
        .from('organization_affiliation_claims')
        .update({ 
          status: 'approved',
          decided_by: authUser?.id,
          decided_at: new Date().toISOString()
        })
        .eq('id', claimId);
      
      if (error) {
        throw error;
      }

      // Then, add the user to the organization_members table (if not already a member)
      const claim = affiliationClaims.find(c => c.id === claimId);
      if (claim) {
        // Check if user is already a member
        const { data: existingMember, error: checkError } = await supabase
          .from('organization_members')
          .select('org_id, user_id')
          .eq('org_id', claim.org_id)
          .eq('user_id', claim.user_id)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw checkError;
        }
        
        // Only insert if user is not already a member
        if (!existingMember) {
          const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
              org_id: claim.org_id,
              user_id: claim.user_id,
              verified_by: authUser?.id,
              verified_at: new Date().toISOString()
            });
          
          if (memberError) {
            throw memberError;
          }
        }
      }
      
      setSuccess("User affiliation claim approved successfully!");
      setAffiliationClaims(affiliationClaims.filter(c => c.id !== claimId));
      setConfirmDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error approving user:", err);
      setError("Failed to approve user. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectUser = async (claimId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const supabase = createClient();
      
      // Update the affiliation claim to rejected
      const { error } = await supabase
        .from('organization_affiliation_claims')
        .update({ 
          status: 'rejected',
          decided_by: authUser?.id,
          decided_at: new Date().toISOString()
        })
        .eq('id', claimId);
      
      if (error) {
        throw error;
      }
      
      setSuccess("User affiliation claim rejected successfully!");
      setAffiliationClaims(affiliationClaims.filter(c => c.id !== claimId));
      setConfirmDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error rejecting user:", err);
      setError("Failed to reject user. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const openConfirmDialog = (claim: UserAffiliationClaim, action: "approve" | "reject") => {
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
        <h1 className="text-3xl font-bold tracking-tight">User Affiliation Management</h1>
        <p className="text-muted-foreground">
          Review, approve, or reject user affiliation claims
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
            placeholder="Search by user name or email..."
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
              ) : affiliationClaims.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center">
                    <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No {status} user claims</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {affiliationClaims
                    .filter((claim) =>
                      claim.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      claim.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
                                User Claim
                              </Badge>
                              {getStatusBadge(claim.status)}
                            </div>
                            <CardTitle className="pt-2">{claim.user?.full_name}</CardTitle>
                            <CardDescription>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{claim.user?.email}</span>
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">
                                Requested: {new Date(claim.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {claim.decided_at && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">
                                  {claim.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(claim.decided_at).toLocaleDateString()}
                                </span>
                              </div>
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
              {confirmAction === "approve" ? "Approve User" : "Reject User"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction} "{claimToManage?.user?.full_name}"?
              {confirmAction === "approve" 
                ? " This will add the user to your organization."
                : " This will reject the user affiliation claim."
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
                    handleApproveUser(claimToManage.id);
                  } else {
                    handleRejectUser(claimToManage.id);
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