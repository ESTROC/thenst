"use client";

import { useEffect, useState, useCallback } from "react";
import { UsersTable } from "@/components/users-table";
import { getUsersByRole, getKYC } from "@/lib/firestore";
import type { UserProfile, KYCData } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Building, Calendar, Award, Languages } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AdminGuardsPage() {
  const [guards, setGuards] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuard, setSelectedGuard] = useState<UserProfile | null>(null);
  const [guardKyc, setGuardKyc] = useState<KYCData | null>(null);

  const { loading: authLoading } = useAuth();

  const fetchGuards = useCallback(async () => {
    if (authLoading) return; // Wait for auth
    try {
      const data = await getUsersByRole("guard");
      setGuards(data);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    fetchGuards();
  }, [fetchGuards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading security professionals...</p>
      </div>
    );
  }

  async function handleViewGuard(user: UserProfile) {
    setSelectedGuard(user);
    setGuardKyc(null); // Reset
    const kyc = await getKYC(user.uid);
    setGuardKyc(kyc);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Security Professionals</h2>
        <p className="text-muted-foreground">
          View and manage all registered security professionals.
        </p>
      </div>
      <UsersTable
        users={guards}
        onRefresh={fetchGuards}
        currentUserRole="admin"
        onViewDetails={handleViewGuard}
        showKycStatus
      />

      <Dialog open={!!selectedGuard} onOpenChange={(open) => !open && setSelectedGuard(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security Professional Profile</DialogTitle>
            <DialogDescription>Detailed information about the security professional.</DialogDescription>
          </DialogHeader>

          {selectedGuard && (
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={guardKyc?.photoUrl} />
                  <AvatarFallback>{selectedGuard.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <h3 className="text-xl font-bold">{selectedGuard.fullName}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" /> {selectedGuard.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" /> {selectedGuard.phone}
                  </div>
                  <div>
                    <Badge variant={selectedGuard.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                      {selectedGuard.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {guardKyc ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2"><Building className="h-4 w-4" /> Professional Details</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Experience:</span>
                        <span>{guardKyc.yearsOfExperience} years</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Shift Pref:</span>
                        <span className="capitalize">{guardKyc.shiftPreference}</span>
                      </div>

                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2"><Award className="h-4 w-4" /> Skills & Certs</h4>
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {guardKyc.skills?.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                          {!guardKyc.skills?.length && <span className="text-sm italic text-muted-foreground">None listed</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Certifications</p>
                        <div className="flex flex-wrap gap-1">
                          {guardKyc.certifications?.map((c, i) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)}
                          {!guardKyc.certifications?.length && <span className="text-sm italic text-muted-foreground">None listed</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2"><Languages className="h-4 w-4" /> Languages</h4>
                    <div className="flex flex-wrap gap-1">
                      {guardKyc.languages?.map((l, i) => <Badge key={i} variant="secondary" className="text-xs">{l}</Badge>)}
                      {!guardKyc.languages?.length && <span className="text-sm italic text-muted-foreground">None listed</span>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> Physical Attributes</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Height:</span>
                        <span>{guardKyc.height || "-"}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-muted-foreground">Weight:</span>
                        <span>{guardKyc.weight || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No KYC data available for this security professional.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
