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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Building, Calendar, Award, Languages, Shield } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SuperAdminGuardsPage() {
  const [guards, setGuards] = useState<UserProfile[]>([]);
  const [filteredGuards, setFilteredGuards] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuard, setSelectedGuard] = useState<UserProfile | null>(null);
  const [guardKyc, setGuardKyc] = useState<KYCData | null>(null);

  const [search, setSearch] = useState("");

  const fetchGuards = useCallback(async () => {
    try {
      const data = await getUsersByRole("guard");
      setGuards(data);
      setFilteredGuards(data);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuards();
  }, [fetchGuards]);

  useEffect(() => {
    let result = [...guards];

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(g => 
        g.fullName.toLowerCase().includes(s) || 
        g.preferredCity?.toLowerCase().includes(s) ||
        g.email.toLowerCase().includes(s)
      );
    }

    setFilteredGuards(result);
  }, [search, guards]);

  const resetFilters = () => {
    setSearch("");
  };

  async function handleViewDetails(user: UserProfile) {
    setSelectedGuard(user);
    setGuardKyc(null);
    const kyc = await getKYC(user.uid);
    setGuardKyc(kyc);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Loading security professionals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">All Security Professionals</h2>
          <p className="text-muted-foreground">
            View and manage all registered security professionals across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredGuards.length} Professional{filteredGuards.length !== 1 ? 's' : ''} Found
          </Badge>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-card p-4 rounded-xl border border-border/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email or city..." 
            className="pl-10 h-11 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground hover:text-foreground h-11">
            <FilterX className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      <UsersTable
        users={filteredGuards}
        onRefresh={fetchGuards}
        currentUserRole="superadmin"
        showKycStatus
        onViewDetails={handleViewDetails}
        hideRole={true}
        hideDiscoveryData={true}
      />

      <Dialog open={!!selectedGuard} onOpenChange={(open) => !open && setSelectedGuard(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security Professional Profile</DialogTitle>
            <DialogDescription>Full platform oversight of professional credentials.</DialogDescription>
          </DialogHeader>

          {selectedGuard && (
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 shadow-md border-2 border-background">
                  <AvatarImage src={guardKyc?.photoUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {selectedGuard.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <h3 className="text-xl font-bold text-foreground">{selectedGuard.fullName}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" /> {selectedGuard.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" /> {selectedGuard.phone || "No phone listed"}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={selectedGuard.status === 'active' ? 'default' : 'secondary'}>
                      Account: {selectedGuard.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                      KYC: {selectedGuard.kycStatus?.toUpperCase() || "NOT STARTED"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {guardKyc ? (
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      <Building className="h-4 w-4" /> Professional Experience
                    </h4>
                    <div className="space-y-3 pl-6 border-l-2 border-primary/10">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Years of Experience</span>
                        <span className="font-medium">{guardKyc.yearsOfExperience} years</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Shift Preference</span>
                        <span className="font-medium capitalize">{guardKyc.shiftPreference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      <Award className="h-4 w-4" /> Expertise & Skills
                    </h4>
                    <div className="space-y-4 pl-6 border-l-2 border-primary/10">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Technical Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {guardKyc.skills?.map((s, i) => (
                            <Badge key={i} variant="secondary" className="bg-blue-500/5 text-blue-600 border-blue-500/10">
                              {s}
                            </Badge>
                          ))}
                          {!guardKyc.skills?.length && <span className="text-sm italic text-muted-foreground">No skills listed</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Qualifications</p>
                        <div className="flex flex-wrap gap-1.5">
                          {guardKyc.certifications?.map((c, i) => (
                            <Badge key={i} variant="outline" className="border-indigo-500/20 text-indigo-600 bg-indigo-500/5">
                              {c}
                            </Badge>
                          ))}
                          {!guardKyc.certifications?.length && <span className="text-sm italic text-muted-foreground">No certifications listed</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      <Languages className="h-4 w-4" /> Communication
                    </h4>
                    <div className="flex flex-wrap gap-1.5 pl-6 border-l-2 border-primary/10">
                      {guardKyc.languages?.map((l, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-500/5 text-slate-700">
                          {l}
                        </Badge>
                      ))}
                      {!guardKyc.languages?.length && <span className="text-sm italic text-muted-foreground">Not specified</span>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      <Calendar className="h-4 w-4" /> Physical Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-primary/10 text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Height</span>
                        <span className="font-medium">{guardKyc.height || "-"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Weight</span>
                        <span className="font-medium">{guardKyc.weight || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center bg-muted/30 rounded-2xl border-2 border-dashed border-border/50">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
                    <Shield className="h-6 w-6 opacity-20" />
                  </div>
                  <p className="text-muted-foreground font-medium text-center">
                    KYC documentation has not been submitted yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
