"use client";

import { useEffect, useState, useCallback } from "react";
import { UsersTable } from "@/components/users-table";
import { getUsersByRole, getAllHrKYC, updateHrKYCStatus, getHrKYC } from "@/lib/firestore";
import type { UserProfile, HrKYCData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Check, X, ExternalLink, Users, Building, FileText } from "lucide-react";

export default function AdminHRPage() {
  const [hrUsers, setHrUsers] = useState<UserProfile[]>([]);
  const [pendingHrKyc, setPendingHrKyc] = useState<HrKYCData[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<HrKYCData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const [hrUsers, allHrKyc] = await Promise.all([
        getUsersByRole("hr"),
        getAllHrKYC()
      ]);

      const pending = allHrKyc.filter((k) => k.status === "pending").map(kyc => {
        const user = hrUsers.find(u => u.uid === kyc.hrId);
        return {
          ...kyc,
          logoUrl: kyc.logoUrl || user?.companyDetails?.logoUrl || ""
        };
      });
      setHrUsers(hrUsers);
      setPendingHrKyc(pending);
    } catch {
      toast.error("Failed to fetch HR data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewDetails = async (user: UserProfile) => {
    try {
      const kycData = await getHrKYC(user.uid);
      if (kycData) {
        setSelectedKyc({
          ...kycData,
          logoUrl: kycData?.logoUrl || user?.companyDetails?.logoUrl
        });
      } else {
        toast.error("No company details found for this HR.");
      }
    } catch (error) {
      console.error("Error fetching HR KYC:", error);
      toast.error("Failed to load company details");
    }
  };

  async function handleApproval(hrId: string, approved: boolean) {
    try {
      await updateHrKYCStatus(
        hrId,
        approved ? "approved" : "rejected",
        "admin", // In real app, use current admin ID
        approved ? undefined : "Policy violation"
      );
      toast.success(approved ? "HR Approved" : "HR Rejected");
      fetchUsers();
    } catch (e) {
      toast.error("Failed to update status");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading HR management...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">HR Management</h2>
        <p className="text-muted-foreground">
          Manage HR personnel and view organization details.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-foreground">Pending HR Verifications ({pendingHrKyc.length})</h3>
        {pendingHrKyc.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No pending verifications.</p>
        ) : (
          <div className="grid gap-4">
            {pendingHrKyc.map((kyc) => (
              <Card key={kyc.hrId}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted overflow-hidden border shrink-0">
                      {kyc.logoUrl ? (
                        <img src={kyc.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <Building className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{kyc.companyName}</p>
                      <p className="text-sm text-muted-foreground">Reg: {kyc.registrationNumber}</p>
                      <p className="text-xs text-muted-foreground">{kyc.website}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      const profile = hrUsers.find(u => u.uid === kyc.hrId);
                      setSelectedKyc({
                        ...kyc,
                        logoUrl: kyc?.logoUrl || profile?.companyDetails?.logoUrl
                      });
                    }}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </Button>
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApproval(kyc.hrId, true)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleApproval(kyc.hrId, false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedKyc} onOpenChange={(open) => !open && setSelectedKyc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Organization Details</DialogTitle>
            <DialogDescription>
              {selectedKyc?.status === "pending"
                ? "Review the details submitted for verification."
                : "Company profile and documentation."}
            </DialogDescription>
          </DialogHeader>

          {selectedKyc && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="h-16 w-16 rounded-full bg-muted overflow-hidden border shrink-0">
                  {((selectedKyc as any).logoUrl || hrUsers.find(u => u.uid === selectedKyc.hrId)?.companyDetails?.logoUrl) ? (
                    <img 
                      src={(selectedKyc as any)?.logoUrl || hrUsers.find(u => u.uid === selectedKyc.hrId)?.companyDetails?.logoUrl} 
                      alt="Logo" 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Building className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold">{selectedKyc.companyName}</h4>
                  <p className="text-sm text-muted-foreground">{selectedKyc.website}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Company Name</h4>
                  <p className="font-semibold">{selectedKyc.companyName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Registration Number</h4>
                  <p className="font-medium">{selectedKyc.registrationNumber}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Website</h4>
                  <a href={`https://${selectedKyc.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    {selectedKyc.website} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Office Address</h4>
                  <p className="font-medium">{selectedKyc.address}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Verification Status</h4>
                  <p className={`font-semibold capitalize ${selectedKyc.status === 'approved' ? 'text-green-600' :
                    selectedKyc.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                    {selectedKyc.status}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium border-b pb-2">Submitted Documents</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-xl p-4 flex flex-col gap-3 bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Incorporation Certificate
                      </span>
                    </div>
                    {selectedKyc.documents.incorporationCert ? (
                      <div className="bg-muted/50 h-32 rounded-lg flex flex-col items-center justify-center text-muted-foreground relative overflow-hidden group border border-border/50">
                        {selectedKyc.documents.incorporationCert.toLowerCase().includes('.pdf') ? (
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-12 w-12 text-primary/30" />
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">PDF Document</span>
                          </div>
                        ) : (
                          <>
                            <img src={selectedKyc.documents.incorporationCert} alt="Cert" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="bg-red-50 h-32 rounded-lg flex items-center justify-center border border-red-100">
                        <span className="text-xs text-red-500 font-medium">Not uploaded</span>
                      </div>
                    )}
                    <Button variant="secondary" size="sm" className="w-full rounded-lg font-bold" onClick={() => window.open(selectedKyc.documents.incorporationCert, '_blank')}>
                      <ExternalLink className="mr-2 h-3 w-3" /> Open Document
                    </Button>
                  </div>

                  <div className="border rounded-xl p-4 flex flex-col gap-3 bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Identity Proof
                      </span>
                    </div>
                    {selectedKyc.documents.idProof ? (
                      <div className="bg-muted/50 h-32 rounded-lg flex flex-col items-center justify-center text-muted-foreground relative overflow-hidden group border border-border/50">
                        {selectedKyc.documents.idProof.toLowerCase().includes('.pdf') ? (
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-12 w-12 text-primary/30" />
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">PDF Document</span>
                          </div>
                        ) : (
                          <>
                            <img src={selectedKyc.documents.idProof} alt="ID" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="bg-red-50 h-32 rounded-lg flex items-center justify-center border border-red-100">
                        <span className="text-xs text-red-500 font-medium">Not uploaded</span>
                      </div>
                    )}
                    <Button variant="secondary" size="sm" className="w-full rounded-lg font-bold" onClick={() => window.open(selectedKyc.documents.idProof, '_blank')}>
                      <ExternalLink className="mr-2 h-3 w-3" /> Open Document
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => setSelectedKyc(null)}>Close</Button>
            {selectedKyc?.status === "pending" && (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => { handleApproval(selectedKyc!.hrId, false); setSelectedKyc(null); }}>
                  Reject Application
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => { handleApproval(selectedKyc!.hrId, true); setSelectedKyc(null); }}>
                  Approve Organization
                </Button>
              </div>
            )}
            {selectedKyc?.status !== "pending" && (
              <Button variant="destructive" onClick={() => { handleApproval(selectedKyc!.hrId, false); setSelectedKyc(null); }}>
                Revoke Verification
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-foreground">Current HR Staff ({hrUsers.length})</h3>
        <UsersTable
          users={hrUsers}
          onRefresh={fetchUsers}
          currentUserRole="admin"
          onViewDetails={handleViewDetails}
          showKycStatus={true}
          hideRole
          hideDiscoveryData
        />
      </div>

    </div>
  );
}
