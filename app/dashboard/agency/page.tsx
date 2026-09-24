"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase, IndianRupee, Activity, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgencySubscriptionModal } from "@/components/agency-subscription-modal";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { HiringRequest } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Eye, ExternalLink } from "lucide-react";

export default function AgencyDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubscriptionOpen, setSubscriptionOpen] = useState(false);
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [totalDeployedCount, setTotalDeployedCount] = useState(0);
  const [finalizedDeals, setFinalizedDeals] = useState<HiringRequest[]>([]);
  const [isDealsModalOpen, setIsDealsModalOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== "agency") {
        router.push("/");
        return;
      }

      // Strict Redirect: If not approved, go to KYC immediately
      const kycStatus = profile.kycStatus || "not_started";
      if (kycStatus !== "approved") {
        router.replace("/dashboard/agency/kyc");
      }
    }
  }, [profile, authLoading, router]);

  if (authLoading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>Loading...</div>;
  }

  // Strict Check: Prevent rendering dashboard if not approved
  const kycStatus = profile?.kycStatus || "not_started";
  if (kycStatus !== "approved") {
    return null;
  }

  // Fetch Requests
  useEffect(() => {
    async function fetchAgencyData() {
      if (!profile) return;
      try {
        const q = query(
          collection(db, "hiring_requests"),
          where("agencyId", "==", profile.uid),
          where("isBulk", "==", true),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HiringRequest));
        
        setRequests(fetched.slice(0, 5)); // Show up to 5 recent requests
        
        const active = fetched.filter(r => r.status === "pending" || r.status === "accepted").length;
        const hired = fetched.filter(r => r.status === "hired");
        const deployed = hired.reduce((sum, r) => sum + (r.bulkCount || 0), 0);
        
        setActiveRequestsCount(active);
        setTotalDeployedCount(deployed);
        setFinalizedDeals(hired);
      } catch (error) {
        console.error("Error fetching agency data:", error);
      } finally {
        setDataLoading(false);
      }
    }
    
    if (profile?.kycStatus === "approved") {
      fetchAgencyData();
    }
  }, [profile]);

  return (
    <RoleGuard allowedRoles={["agency"]}>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {profile?.companyDetails?.logoUrl ? (
              <img 
                src={profile.companyDetails?.logoUrl} 
                alt="Logo" 
                className="h-10 w-10 rounded-md object-cover border border-border"
              />
            ) : (
              <Briefcase className="h-8 w-8 text-primary" />
            )}
            {profile?.companyDetails?.name || "Agency Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-2">Overview of your capacity, hiring requests, and performance.</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{profile?.agencyDetails?.totalCapacity || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Available professionals</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{dataLoading ? "..." : activeRequestsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending hiring requests</p>
            </CardContent>
          </Card>

          <Card 
            className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm cursor-pointer hover:border-primary/40 transition-all group"
            onClick={() => setIsDealsModalOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deployed</CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold tracking-tight">{dataLoading ? "..." : totalDeployedCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Successfully hired via requests</p>
                </div>
                <div className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight capitalize">
                {profile?.agencySubscription?.status === "active" || profile?.kycStatus === "approved" ? "Active" : "Inactive"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                {profile?.agencySubscription?.status === "active" || profile?.kycStatus === "approved" ? "Receiving requests" : "Action required"}
              </p>
              {profile?.agencySubscription?.status !== "active" && profile?.kycStatus !== "approved" && (
                <Button size="sm" className="w-full" onClick={() => setSubscriptionOpen(true)}>
                  Activate Now
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Hiring Requests</CardTitle>
                    <CardDescription>Requests received from Recruiters and Admins.</CardDescription>
                </CardHeader>
                <CardContent>
                    {dataLoading ? (
                        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">No Requests Yet</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                                When a Recruiter or Admin requires a workforce that matches your specialties, the request will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20 gap-4">
                                    <div>
                                        <h4 className="font-semibold text-primary">{request.companyName}</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/30 text-primary">
                                                {request.selectedSector || "General Security"}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground flex items-center">
                                                • {request.locationPreference || "Location Not Specified"}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1">Requested {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="font-bold text-lg">{request.bulkCount}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Professionals</div>
                                        </div>
                                        <Badge variant={request.status === "pending" ? "secondary" : request.status === "accepted" ? "default" : request.status === "hired" ? "outline" : "destructive"} className="capitalize">
                                            {request.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            <Button variant="link" className="w-full" onClick={() => router.push("/dashboard/agency/requests")}>
                                View All Requests
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
                <CardHeader>
                    <CardTitle>Agency Profile Highlights</CardTitle>
                    <CardDescription>Your declared capacity and specialties.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Security Sectors</p>
                        {profile.agencyDetails?.sectors && profile.agencyDetails.sectors.length > 0 ? (
                            <div className="space-y-3">
                                {profile.agencyDetails.sectors.map((sector, idx) => (
                                    <div key={idx} className="bg-muted/30 p-2 rounded-md border border-border/50">
                                        <p className="text-xs font-semibold text-primary mb-1.5">
                                            {sector.category.startsWith("Other: ") ? sector.category.replace("Other: ", "") : sector.category}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {sector.roles.map((role, rIdx) => (
                                                <Badge key={rIdx} variant="secondary" className="bg-background border-border/60 text-[10px]">
                                                    {role.startsWith("Other: ") ? role.replace("Other: ", "") : role}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {profile.agencyDetails?.specialties?.map((s, i) => (
                                    <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                        {s}
                                    </Badge>
                                )) || <p className="text-sm text-muted-foreground">No services listed.</p>}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Service Locations</p>
                        {profile.agencyDetails?.serviceLocations && profile.agencyDetails.serviceLocations.length > 0 ? (
                            <div className="space-y-2">
                                {profile.agencyDetails.serviceLocations.map((loc, i) => (
                                    <div key={i} className="text-sm border-l-2 border-primary/20 pl-2">
                                        <span className="font-semibold text-foreground">{loc.country && `${loc.country}, `}{loc.state}</span>
                                        <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">{loc.cities.join(", ")}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No specific locations provided.</p>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Verified Capacity</p>
                        <p className="text-2xl font-bold">{profile.agencyDetails?.totalCapacity || 0} Professionals</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">PSARA License</p>
                        <p className="text-sm font-mono">{profile.agencyDetails?.psaraLicense || "Not provided"}</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        <AgencySubscriptionModal 
          open={isSubscriptionOpen} 
          onOpenChange={setSubscriptionOpen} 
        />

        <Dialog open={isDealsModalOpen} onOpenChange={setIsDealsModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Finalized Partnerships & Deployments
              </DialogTitle>
              <DialogDescription>
                Detailed list of all hiring deals successfully completed with platform recruiters.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-2 mt-4">
              {finalizedDeals.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                  <p className="text-muted-foreground">No finalized deals found yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client / Company</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-center">Deployed</TableHead>
                      <TableHead className="text-right">Finalized Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finalizedDeals.map((deal) => (
                      <TableRow key={deal.id} className="cursor-default">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{deal.companyName}</span>
                            <span className="text-[10px] text-muted-foreground">{deal.hrName || "Admin Request"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {deal.selectedSector || "General Security"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-bold">{deal.bulkCount}</div>
                          <div className="text-[9px] text-muted-foreground uppercase">Guards</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-xs">
                            {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString() : "N/A"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
