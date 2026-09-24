"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, MapPin, BadgeCheck, Search, Building, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot, doc } from "firebase/firestore";
import type { KYCData, HiringRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateHiringFinalStatus } from "@/lib/firestore";

import { Separator } from "@/components/ui/separator";
import { RoleGuard } from "@/components/role-guard";
import { SubscriptionModal } from "@/components/subscription-modal";

export default function HRDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [guards, setGuards] = useState<KYCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscriptionOpen, setSubscriptionOpen] = useState(false);
  
  // Filter States
  const [search, setSearch] = useState("");
  const [minExp, setMinExp] = useState("all");
  const [minHeight, setMinHeight] = useState("all");
  const [status, setStatus] = useState("Actively Looking");

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== "hr") {
        router.push("/");
        return;
      }

      // Strict Redirect: If not approved, go to KYC immediately
      const kycStatus = profile.kycStatus || "not_started";
      if (kycStatus !== "approved") {
        router.replace("/dashboard/hr/kyc");
      }
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (authLoading || !profile) return;

    // Fetch Available Guards
    const fetchGuards = async () => {
      try {
        const q = query(collection(db, "kyc"), where("status", "==", "approved"));
        const snapshot = await getDocs(q);
        setGuards(snapshot.docs.map(doc => doc.data() as KYCData));
      } catch (error) {
        console.error("Error fetching guards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuards();
  }, [authLoading, profile]);

  if (authLoading || loading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>Discovery loading...</div>;
  }

  // Strict Check: Prevent rendering dashboard if not approved
  const kycStatus = profile?.kycStatus || "not_started";
  if (kycStatus !== "approved") {
    return null;
  }

  // Advanced Filtering Logic
  const filteredGuards = guards.filter(g => {
    // 1. Text Search (Name, City, Email)
    const matchesSearch = !search.trim() || 
      g.guardName.toLowerCase().includes(search.toLowerCase()) ||
      g.guardEmail.toLowerCase().includes(search.toLowerCase()) ||
      g.preferredCity?.toLowerCase().includes(search.toLowerCase());

    // 2. Experience Filter
    let matchesExp = true;
    if (minExp !== "all") {
      const min = parseInt(minExp);
      const val = (g.yearsOfExperience || "").toLowerCase();
      if (val === "fresher") {
        matchesExp = min === 0;
      } else {
        const num = parseInt(val.split(/[+-]/)[0]);
        matchesExp = num >= min;
      }
    }

    // 3. Height Filter (handles both 'ft"in' and decimal)
    let matchesHeight = true;
    if (minHeight !== "all") {
      const min = parseFloat(minHeight);
      const h = (g.height || "").toLowerCase();
      let heightVal = 0;
      if (h.includes("'")) {
        const parts = h.split("'");
        heightVal = parseInt(parts[0]) + (parseInt(parts[1] || "0") / 12);
      } else {
        heightVal = parseFloat(h);
      }
      matchesHeight = heightVal >= min;
    }

    // 4. Status Filter
    let matchesStatus = true;
    if (status !== "all") {
      matchesStatus = g.availabilityStatus === status;
    }

    return matchesSearch && matchesExp && matchesHeight && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={['hr']}>
      <div className="flex flex-col gap-8">
        {/* Company Header - Fully Responsive */}
        <div className="bg-[#eff4ff] rounded-[2rem] border border-blue-100 p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#4f46e5]/10 flex items-center justify-center border border-[#4f46e5]/20 overflow-hidden shrink-0">
              {profile?.companyDetails?.logoUrl ? (
                <img src={profile.companyDetails?.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Building className="h-6 sm:h-7 w-6 sm:w-7 text-[#4f46e5]" />
              )}
            </div>
            <div className="grid gap-1 sm:grid-cols-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#010b26] tracking-tight leading-tight">{profile?.companyDetails?.name || "Your Company"}</h2>
              {profile?.companyDetails?.website && (
                <a 
                  href={`https://${profile.companyDetails?.website?.replace(/^https?:\/\//, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#4f46e5] text-xs sm:text-sm font-bold hover:underline transition-colors"
                >
                  {(() => {
                    const domain = profile.companyDetails?.website?.replace(/^https?:\/\//, '') || "";
                    return domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
                  })()}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex flex-col items-end mr-0 sm:mr-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                {profile?.pendingCredits ? `Available (Pending: ${profile.pendingCredits})` : 'Available Credits'}
              </span>
              <span className="text-sm sm:text-base font-black text-[#4f46e5] leading-none mt-0.5">{profile?.credits || 0}</span>
            </div>
            <Button onClick={() => setSubscriptionOpen(true)} className="rounded-full bg-[#4f46e5] text-white font-bold px-5 sm:px-6 shadow-sm hover:bg-[#4338ca] text-xs sm:text-sm">
              View Plans
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-[#010b26] tracking-tight">Discover Security Professionals</h2>
            <p className="text-xs font-bold text-[#64748b] tracking-wide">Find and hire verified security professionals by height, experience, and location.</p>
          </div>

          {/* New Filter Toolbar Area - Matching Screenshot */}
          <div className="bg-[#f8fbff] rounded-3xl border border-blue-50/50 p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-4 sm:grid-cols-2 items-end">
              <div className="flex flex-col gap-2.5">
                <Label htmlFor="search" className="text-[10px] font-black uppercase tracking-[0.15em] text-[#94a3b8]">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Name, City, Email..."
                      className="pl-9 bg-background focus-visible:ring-primary/30"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <Label htmlFor="minExp" className="text-[10px] font-black uppercase tracking-[0.15em] text-[#94a3b8]">Min. Experience</Label>
                  <Select value={minExp} onValueChange={setMinExp}>
                    <SelectTrigger id="minExp" className="bg-white border-slate-100 rounded-xl h-12">
                      <SelectValue placeholder="Experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Experience</SelectItem>
                      <SelectItem value="0">Fresher+</SelectItem>
                      <SelectItem value="2">2+ Years</SelectItem>
                      <SelectItem value="5">5+ Years</SelectItem>
                      <SelectItem value="10">10+ Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2.5">
                  <Label htmlFor="minHeight" className="text-[10px] font-black uppercase tracking-[0.15em] text-[#94a3b8]">Min. Height (ft)</Label>
                  <Select value={minHeight} onValueChange={setMinHeight}>
                    <SelectTrigger id="minHeight" className="bg-white border-slate-100 rounded-xl h-12">
                      <SelectValue placeholder="Height" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Height</SelectItem>
                      <SelectItem value="5.5">5'6" (5.5 ft)+</SelectItem>
                      <SelectItem value="5.8">5'10" (5.8 ft)+</SelectItem>
                      <SelectItem value="6.0">6'0" (6.0 ft)+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2.5">
                  <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-[0.15em] text-[#94a3b8]">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status" className="bg-white border-slate-100 rounded-xl h-12">
                      <SelectValue placeholder="Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Guards</SelectItem>
                      <SelectItem value="Actively Looking">Actively Looking</SelectItem>
                      <SelectItem value="Hired/Unavailable">Hired</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(search || minExp !== "all" || minHeight !== "all" || status !== "all") && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">
                    Showing <span className="text-[#010b26]">{filteredGuards.length}</span> candidates
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => {
                      setSearch("");
                      setMinExp("all");
                      setMinHeight("all");
                      setStatus("Actively Looking");
                    }}
                    className="h-auto p-0 text-[#4f46e5] font-black text-[10px] uppercase tracking-widest"
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">          {filteredGuards.map((guard) => (
            <Card key={guard.guardId} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col border-transparent bg-white rounded-3xl">
              {/* Header Gradient - Matching Screenshot */}
              <div className="h-28 w-full bg-gradient-to-br from-[#eef2ff] to-[#f5f3ff]" />

              <CardHeader className="relative -mt-14 flex flex-col items-center gap-4 pb-4 px-6">
                {/* Profile Avatar Box - Centered and Overlapping */}
                <div className="h-28 w-28 rounded-3xl bg-white p-2 shadow-xl ring-4 ring-white relative z-10 transition-transform group-hover:scale-105">
                  <div className="h-full w-full rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                    {guard.photoUrl ? (
                      <img src={guard.photoUrl} alt={guard.guardName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-slate-300">{guard.guardName.charAt(0)}</span>
                    )}
                  </div>
                </div>

                <div className="text-center grid gap-1 mt-2">
                  <h3 className="text-2xl font-black text-[#010b26] tracking-tight">{guard.guardName}</h3>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    <div className="flex items-center text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      <BadgeCheck className="mr-1 h-3 w-3" />
                      Verified
                    </div>
                    <div className={cn(
                      "flex items-center text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border",
                      guard.availabilityStatus === "Hired/Unavailable" ? "text-red-600 bg-red-50 border-red-100" :
                        guard.availabilityStatus === "On Leave" ? "text-yellow-600 bg-yellow-50 border-yellow-100" :
                          "text-blue-600 bg-blue-50 border-blue-100"
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5",
                        guard.availabilityStatus === "Hired/Unavailable" ? "bg-red-500" :
                          guard.availabilityStatus === "On Leave" ? "bg-yellow-500" :
                            "bg-blue-500"
                      )}></span>
                      {guard.availabilityStatus || "Available"}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 flex-1 px-8 pb-8">
                {/* Secondary Info Area */}
                <div className="grid grid-cols-2 gap-4 text-[11px] font-black uppercase tracking-widest text-[#64748b]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100/50">
                       <Building className="h-4 w-4" />
                    </div>
                    <span>{guard.yearsOfExperience || "0y"} Exp</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100/50">
                       <MapPin className="h-4 w-4" />
                    </div>
                    <span className="truncate">{guard.preferredCity || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 col-span-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100/50">
                       <Calendar className="h-4 w-4" />
                    </div>
                    <span>Height: {guard.height ? `${guard.height}` : "N/A"}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] mb-4">Security Professional</p>
                  <Link href={`/dashboard/hr/guards/${guard.guardId}`} className="block w-full">
                    <Button className="w-full h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95">
                      View Full Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {
            filteredGuards.length === 0 && (
              <p className="col-span-full text-center py-10 text-muted-foreground">No professionals found matching your search.</p>
            )
          }
        </div>
      </div>
      <SubscriptionModal open={isSubscriptionOpen} onOpenChange={setSubscriptionOpen} onSuccess={() => window.location.reload()} />
    </RoleGuard>
  );
}
