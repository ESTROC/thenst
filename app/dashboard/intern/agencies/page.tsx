"use client";
 
import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, Search, Download, RefreshCw, Loader2, Calendar, Phone, Mail, FileText, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/role-guard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { unlockProfile } from "@/lib/firestore";
import { SubscriptionModal } from "@/components/subscription-modal";
 
export default function InternAgenciesPage() {
  const { profile, refreshProfile } = useAuth();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlockedAgencies, setUnlockedAgencies] = useState<Set<string>>(new Set());
  const [unlocking, setUnlocking] = useState(false);
  const [unlockConfirmationAgency, setUnlockConfirmationAgency] = useState<any | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
 
  // View Details Modal State
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);
 
  async function loadAgencies() {
    try {
      const q = query(collection(db, "users"), where("role", "==", "agency"), where("status", "==", "active"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setAgencies(data);

      if (profile?.uid) {
        const unlockedSnap = await getDocs(collection(db, "users", profile.uid, "unlocked_guards"));
        const unlockedIds = new Set(unlockedSnap.docs.map(doc => doc.id));
        setUnlockedAgencies(unlockedIds);
      }
    } catch (err) {
      console.error("Failed to load agencies:", err);
      toast.error("Failed to load onboarded security agencies");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
 
  useEffect(() => {
    loadAgencies();
  }, [profile]);
 
  const handleRefresh = () => {
    setRefreshing(true);
    loadAgencies();
  };
 
  // Extract unique cities
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    agencies.forEach(a => {
      if (a.preferredCity) cities.add(a.preferredCity);
      if (a.companyDetails?.city) cities.add(a.companyDetails.city);
    });
    return Array.from(cities).sort();
  }, [agencies]);
 
  // Filter active agencies
  const filteredAgencies = useMemo(() => {
    return agencies.filter(a => {
      const name = a.companyDetails?.name || a.fullName || "";
      const description = a.companyDetails?.description || "";
      const matchesSearch = searchQuery === "" || 
        name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const agencyCity = a.companyDetails?.city || a.preferredCity || "";
      const matchesCity = cityFilter === "all" || agencyCity.toLowerCase() === cityFilter.toLowerCase();
 
      return matchesSearch && matchesCity;
    });
  }, [agencies, searchQuery, cityFilter]);

  const handleViewAgency = (agency: any) => {
    if (unlockedAgencies.has(agency.uid)) {
      setSelectedAgency(agency);
    } else {
      setUnlockConfirmationAgency(agency);
    }
  };

  const confirmUnlockAgency = async () => {
    if (!profile || !unlockConfirmationAgency) return;
    const currentCredits = profile.credits || 0;

    if (currentCredits < 1) {
      setUnlockConfirmationAgency(null);
      setShowSubscription(true);
      return;
    }

    setUnlocking(true);
    try {
      const success = await unlockProfile(profile.uid, unlockConfirmationAgency.uid);
      if (success) {
        setUnlockedAgencies(prev => {
          const updated = new Set(prev);
          updated.add(unlockConfirmationAgency.uid);
          return updated;
        });
        await refreshProfile();
        setSelectedAgency(unlockConfirmationAgency);
        setUnlockConfirmationAgency(null);
        toast.success("Agency profile unlocked successfully!");
      } else {
        toast.error("Failed to unlock agency profile.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during unlock.");
    } finally {
      setUnlocking(false);
    }
  };
 
  // CSV Export Utility
  const handleExportCSV = () => {
    if (filteredAgencies.length === 0) {
      toast.error("No agencies found matching current filters!");
      return;
    }
 
    const headers = ["Agency Name", "Email", "Phone", "City", "Address", "Contact Person", "Description", "Status"];
    
    const rows = filteredAgencies.map(a => {
      const isUnlocked = unlockedAgencies.has(a.uid);
      return [
        a.companyDetails?.name || a.fullName,
        isUnlocked ? a.email : "Locked Profile (Use Credit)",
        isUnlocked ? (a.companyDetails?.phone || a.phone || "-") : "Locked Profile (Use Credit)",
        a.companyDetails?.city || a.preferredCity || "-",
        isUnlocked ? (a.companyDetails?.address || "-") : "Locked Profile (Use Credit)",
        a.fullName || "-",
        a.companyDetails?.description || "-",
        isUnlocked ? "Unlocked" : "Locked"
      ];
    });
 
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");
 
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `onboarded_agencies_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV Agency registry successfully exported!");
  };
 
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }
 
  return (
    <RoleGuard allowedRoles={['intern']}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Onboarded Security Agencies</h1>
            <p className="text-slate-500 font-semibold mt-1">View verified security agencies providing specialized tactical personnel.</p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button onClick={handleExportCSV} className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md border-none font-bold gap-2">
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
            <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl border-slate-200 hover:bg-slate-50 shrink-0">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
 
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search agency name, specialties, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-white border-slate-200 w-full"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold w-full sm:w-[150px]"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
 
        {/* Agencies Grid */}
        {filteredAgencies.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-16 bg-white border-dashed border-slate-200">
            <Building className="h-12 w-12 text-slate-400 mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2 text-slate-700">No Agencies Found</h3>
            <p className="text-slate-500 font-semibold text-center max-w-sm text-sm">
              Currently there are no onboarded security agencies matching your filters.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgencies.map((a) => {
              const name = a.companyDetails?.name || a.fullName || "Security Agency";
              const city = a.companyDetails?.city || a.preferredCity || "Flexible";
              const isUnlocked = unlockedAgencies.has(a.uid);
 
              return (
                <Card key={a.uid} className="hover:shadow-lg hover:border-cyan-500/20 transition-all border-slate-200 flex flex-col rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 border border-slate-250 rounded-2xl flex items-center justify-center bg-cyan-50 text-cyan-600 shrink-0 shadow-sm">
                          <Building className="h-6 w-6" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 text-base line-clamp-1">
                            {name}
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 text-slate-400">
                            {city}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-250/50 font-bold uppercase tracking-wider text-[8px] px-2 py-0.5 whitespace-nowrap">
                        Verified Partner
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 flex flex-col gap-4">
                    {/* Agency brief stats */}
                    <div className="flex justify-between items-center bg-slate-50/50 px-4 py-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Active Capacity</span>
                      <span className="text-sm font-black text-cyan-600 bg-cyan-50 border border-cyan-100/50 px-2.5 py-0.5 rounded-lg">
                        {a.agencyDetails?.totalCapacity || "-"}
                      </span>
                    </div>
 
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Agency Profile Description:</span>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                        {a.companyDetails?.description || "Providing highly trained and experienced civilian defense personnel."}
                      </p>
                    </div>
 
                    {/* Sectors Display */}
                    {a.agencyDetails?.sectors && a.agencyDetails.sectors.length > 0 ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Active Sectors:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {a.agencyDetails.sectors.map((sector: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="bg-cyan-50/75 hover:bg-cyan-50 text-cyan-700 border-cyan-100/50 text-[9px] font-black tracking-wide uppercase px-2 py-0.5">
                              {sector.category.startsWith("Other: ") ? sector.category.replace("Other: ", "") : sector.category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : a.companyDetails?.specialties && a.companyDetails.specialties.length > 0 ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Specialties:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {a.companyDetails.specialties.map((spec: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 text-[9px] font-semibold">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    
                    {/* Details Button */}
                    <div className="pt-4 border-t border-slate-50 mt-auto">
                      <Button onClick={() => handleViewAgency(a)} variant={isUnlocked ? "secondary" : "default"} className={`w-full h-10 rounded-xl font-bold gap-2 ${isUnlocked ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100" : "bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"}`}>
                        {!isUnlocked && <Lock className="h-4 w-4" />}
                        {isUnlocked ? "View Agency Records" : "Unlock Agency Profile"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
 
        {/* Agency details Modal */}
        {selectedAgency && (
          <Dialog open={!!selectedAgency} onOpenChange={() => setSelectedAgency(null)}>
            <DialogContent className="max-w-xl bg-white rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
              <DialogHeader className="border-b border-slate-100 pb-4 mb-4 flex flex-row items-center gap-4 relative">
                <div className="h-14 w-14 border border-slate-200 rounded-2xl flex items-center justify-center bg-cyan-50 text-cyan-600 shrink-0 shadow-sm">
                  <Building className="h-7 w-7" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-800">
                    {selectedAgency.companyDetails?.name || selectedAgency.fullName}
                  </DialogTitle>
                  <CardDescription className="font-semibold text-slate-500">
                    {selectedAgency.companyDetails?.city || selectedAgency.preferredCity || "Flexible"}
                  </CardDescription>
                </div>
              </DialogHeader>
  
              <div className="space-y-6">
                
                {/* Agency Records */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.02]">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-black text-cyan-700 uppercase tracking-widest block mb-2">Administrative Contact Records</span>
                  </div>
                  <div className="flex items-center text-sm font-semibold text-slate-700 gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-400 font-medium">Email:</span>
                    <a href={`mailto:${selectedAgency.email}`} className="text-cyan-600 hover:underline truncate">{selectedAgency.email}</a>
                  </div>
                  <div className="flex items-center text-sm font-semibold text-slate-700 gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-400 font-medium">Phone:</span>
                    <a href={`tel:${selectedAgency.companyDetails?.phone || selectedAgency.phone}`} className="text-cyan-600 hover:underline">
                      {selectedAgency.companyDetails?.phone || selectedAgency.phone || "Not Provided"}
                    </a>
                  </div>
                </div>
 
                {/* Administrative Licensing Details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Liaison Officer</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedAgency.fullName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Workforce Capacity</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedAgency.agencyDetails?.totalCapacity || "-"}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Official Address</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedAgency.companyDetails?.address || "-"}</p>
                  </div>
                </div>
 
                {/* Sectors & Roles Details */}
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Security Sectors & Sub-Sectors</span>
                  {selectedAgency.agencyDetails?.sectors && selectedAgency.agencyDetails.sectors.length > 0 ? (
                    <div className="space-y-3">
                      {selectedAgency.agencyDetails.sectors.map((sector: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                          <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-2">
                            {sector.category.startsWith("Other: ") ? sector.category.replace("Other: ", "") : sector.category}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sector.roles.map((role: string, rIdx: number) => (
                              <Badge key={rIdx} variant="secondary" className="bg-white border border-slate-150 text-[10px] text-slate-700 font-semibold px-2">
                                {role.startsWith("Other: ") ? role.replace("Other: ", "") : role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic pl-1">No custom security sectors listed.</p>
                  )}
                </div>
 
                {/* Service Locations details */}
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Active Service Regions</span>
                  <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    {selectedAgency.agencyDetails?.serviceLocations && selectedAgency.agencyDetails.serviceLocations.length > 0 ? (
                      selectedAgency.agencyDetails.serviceLocations.map((loc: any, idx: number) => (
                        <div key={idx} className="text-xs border-l-2 border-cyan-500 pl-3 py-0.5">
                          <span className="font-bold text-slate-800">{loc.state}</span>
                          <p className="text-muted-foreground leading-relaxed mt-0.5">{loc.cities.join(", ")}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic pl-1">All State Regions (Flexible Operational Capacity)</p>
                    )}
                  </div>
                </div>
 
              </div>
 
              <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
                <Button onClick={() => setSelectedAgency(null)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl h-11 border-none font-bold">
                  Close Agency Records
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Unlock Confirmation Dialog */}
        <Dialog open={!!unlockConfirmationAgency} onOpenChange={() => setUnlockConfirmationAgency(null)}>
            <DialogContent className="max-w-md bg-white rounded-3xl p-6">
                <DialogHeader className="flex flex-col items-center text-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                        <Lock className="h-5 w-5" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-800">Unlock Agency Profile?</DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 font-semibold leading-relaxed">
                        Unlocking <strong>{unlockConfirmationAgency?.companyDetails?.name || unlockConfirmationAgency?.fullName}</strong> will deduct 1 credit from your balance.
                        <br />
                        You currently have <strong className="text-cyan-600">{profile?.credits || 0}</strong> credits.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-3 mt-6">
                    <Button variant="ghost" className="flex-1 rounded-xl font-bold border border-slate-200" onClick={() => setUnlockConfirmationAgency(null)}>
                        Cancel
                    </Button>
                    <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl" onClick={confirmUnlockAgency} disabled={unlocking}>
                        {unlocking ? "Unlocking..." : "Unlock (1 Credit)"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        <SubscriptionModal
            open={showSubscription}
            onOpenChange={setShowSubscription}
            onSuccess={() => window.location.reload()}
        />
      </div>
    </RoleGuard>
  );
}
