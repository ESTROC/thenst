"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { updateKYCStatus } from "@/lib/firestore";
import { cn } from "@/lib/utils";
import type { KYCData, KYCStatus } from "@/lib/types";

interface KYCApplicationsTableProps {
  applications: KYCData[];
  onRefresh: () => void;
  canReview: boolean;
}

function KYCStatusBadge({ status }: { status: KYCStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        status === "pending" && "border-warning/30 bg-warning/10 text-warning",
        status === "approved" && "border-success/30 bg-success/10 text-success",
        status === "rejected" && "border-destructive/30 bg-destructive/10 text-destructive",
        status === "not_started" && "border-border bg-muted text-muted-foreground"
      )}
    >
      {status === "not_started"
        ? "Not Started"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}

export function KYCApplicationsTable({
  applications,
  onRefresh,
  canReview,
}: KYCApplicationsTableProps) {
  const [selectedKYC, setSelectedKYC] = useState<KYCData | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApprove(kyc: KYCData) {
    setLoading(true);
    try {
      await updateKYCStatus(kyc.guardId, "approved", "reviewer");
      toast.success(`KYC for ${kyc.guardName} approved.`);
      onRefresh();
    } catch {
      toast.error("Failed to approve KYC.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!selectedKYC || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    setLoading(true);
    try {
      await updateKYCStatus(selectedKYC.guardId, "rejected", "reviewer", rejectionReason);
      toast.success(`KYC for ${selectedKYC.guardName} rejected.`);
      setRejectOpen(false);
      setRejectionReason("");
      onRefresh();
    } catch {
      toast.error("Failed to reject KYC.");
    } finally {
      setLoading(false);
    }
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
        <p className="text-muted-foreground">No KYC applications found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Professional Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((kyc) => (
              <TableRow key={kyc.guardId}>
                <TableCell className="font-medium">{kyc.guardName}</TableCell>
                <TableCell className="text-muted-foreground">{kyc.guardEmail}</TableCell>
                <TableCell>
                  <KYCStatusBadge status={kyc.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(kyc.submittedAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedKYC(kyc);
                        setViewOpen(true);
                      }}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                    {canReview && kyc.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(kyc)}
                          disabled={loading}
                          className="bg-success text-success-foreground hover:bg-success/90"
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedKYC(kyc);
                            setRejectOpen(true);
                          }}
                          disabled={loading}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View KYC Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>KYC Details - {selectedKYC?.guardName}</DialogTitle>
            <DialogDescription>
              Complete application details for review
            </DialogDescription>
          </DialogHeader>
          {selectedKYC && (
            <ScrollArea className="max-h-[60vh]">
              <div className="flex flex-col gap-6 pr-4">
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Full Name" value={selectedKYC.guardName} />
                    <DetailRow label="Email" value={selectedKYC.guardEmail} />
                    <DetailRow label="Date of Birth" value={selectedKYC.dateOfBirth} />
                    <DetailRow label="Gender" value={selectedKYC.gender} />
                    <DetailRow label="Father's Name" value={selectedKYC.fatherName} />
                    <DetailRow label="City" value={selectedKYC.city} />
                    <DetailRow label="State" value={selectedKYC.state} />
                    <DetailRow label="Pincode" value={selectedKYC.pincode} />
                  </div>
                  <div className="mt-3">
                    <DetailRow label="Address" value={selectedKYC.address} />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Identity Documents</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Aadhar Number" value={selectedKYC.aadharNumber} />
                    <DetailRow label="PAN Number" value={selectedKYC.panNumber} />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Experience</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Previous Experience" value={selectedKYC.previousExperience} />
                    <DetailRow label="Years of Experience" value={selectedKYC.yearsOfExperience} />
                  </div>
                </div>

                {selectedKYC.rejectionReason && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-destructive">Rejection Reason</h4>
                      <p className="text-sm text-foreground">{selectedKYC.rejectionReason}</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedKYC?.guardName}&apos;s KYC.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rejectionReason">Reason</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Enter the reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              {loading ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
