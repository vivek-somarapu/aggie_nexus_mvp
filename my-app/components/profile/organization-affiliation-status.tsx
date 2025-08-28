"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Clock, Building2 } from "lucide-react";
import { userService, OrganizationAffiliationClaim } from "@/lib/services/user-service";
import { toast } from "sonner";

interface OrganizationAffiliationStatusProps {
  userId: string;
}

interface ClaimWithOrg extends OrganizationAffiliationClaim {
  organizations: {
    id: string;
    name: string;
  };
}

export function OrganizationAffiliationStatus({ userId }: OrganizationAffiliationStatusProps) {
  const [claims, setClaims] = useState<ClaimWithOrg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoading(true);
        const userClaims = await userService.getUserAffiliationClaims(userId);
        setClaims(userClaims as ClaimWithOrg[]);
      } catch (error) {
        console.error("Error fetching organization claims:", error);
        toast.error("Failed to load organization affiliation status");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchClaims();
    }
  }, [userId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleWithdrawClaim = async (claimId: string) => {
    try {
      await userService.deleteAffiliationClaim(claimId);
      setClaims(claims.filter(claim => claim.id !== claimId));
      toast.success("Claim withdrawn successfully");
    } catch (error) {
      console.error("Error withdrawing claim:", error);
      toast.error("Failed to withdraw claim");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Affiliations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading affiliation status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (claims.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Affiliations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No organization affiliation claims found.</p>
            <p className="text-sm">Select organizations in your profile to submit affiliation claims.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organization Affiliations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(claim.status)}
                <div>
                  <h4 className="font-medium">{claim.organizations?.name || 'Unknown Organization'}</h4>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {new Date(claim.created_at).toLocaleDateString()}
                  </p>
                  {claim.decision_note && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Note: {claim.decision_note}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(claim.status)}
                {claim.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWithdrawClaim(claim.id)}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Organization affiliation claims are reviewed by organization managers. 
            You can withdraw pending claims at any time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 