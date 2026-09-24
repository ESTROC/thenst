"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, Building, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { HiringRequest } from "@/lib/types";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { createNotification, createChatRoom } from "@/lib/firestore";
import { sendEmail } from "@/lib/email";

export default function AgencyRequestsPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchRequests = async () => {
    if (!profile) return;
    try {
      const q = query(
        collection(db, "hiring_requests"),
        where("agencyId", "==", profile.uid),
        where("isBulk", "==", true),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      setRequests(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HiringRequest)));
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load hiring requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === "agency" && profile?.kycStatus === "approved") {
      fetchRequests();
    }
  }, [profile]);

  const handleUpdateStatus = async (requestId: string, newStatus: "accepted" | "rejected") => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const res = await fetch("/api/requests/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          newStatus,
          agencyId: profile?.uid
        })
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      // Send Email to HR
      if (request.hrEmail) {
        await sendEmail({
          to: request.hrEmail,
          subject: newStatus === "accepted" ? "Workforce Request Accepted! ✅" : "Workforce Request Update",
          template: newStatus === "accepted" ? "acceptance" : "hiring_rejection",
          data: {
            fullName: request.hrName,
            candidateName: profile?.companyDetails?.name || profile?.fullName || "Agency",
            contactPerson: profile?.fullName,
            companyName: request.companyName || "Your Company",
            isAgency: true,
          }
        }).catch(console.error);
      }

      // Send Notification to HR
      await createNotification(request.hrId, {
        title: newStatus === "accepted" ? "Workforce Request Accepted!" : "Workforce Request Declined",
        message: `${profile?.companyDetails?.name || profile?.fullName || "Agency"} has ${newStatus} your workforce hiring request.`,
        type: newStatus === "accepted" ? "success" : "info",
        link: newStatus === "accepted" ? "/dashboard/messages" : "/dashboard/hr/agencies"
      });

      // If accepted, Auto-create a Chat Room
      if (newStatus === "accepted") {
        // Explicitly pass agencyId (profile.uid) to ensure persistent ID derivation works even for older requests
        const roomId = await createChatRoom(requestId, { ...request, agencyId: profile.uid });
        // Store the persistent room ID back in the request for easy frontend access
        await updateDoc(doc(db, "hiring_requests", requestId), { chatRoomId: roomId });
      }

      toast.success(`Request ${newStatus} successfully`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update status");
    }
  };

  if (authLoading) {
    return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>Loading...</div>;
  }

  // Strict Check: Prevent rendering if not approved (the useEffect will handle redirect)
  const kycStatus = profile?.kycStatus || "not_started";
  if (kycStatus !== "approved") {
    return null;
  }

  return (
    <RoleGuard allowedRoles={["agency"]}>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Hiring Requests
          </h1>
          <p className="text-muted-foreground mt-2">Manage incoming hiring requests from recruiters and platform administrators.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-8 p-1 bg-muted/50 border border-border/50">
              <TabsTrigger value="pending" className="relative px-6">
                Pending
                {requests.filter(r => r.status === "pending").length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                    {requests.filter(r => r.status === "pending").length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="px-6">
                Approved
                {requests.filter(r => r.status === "accepted").length > 0 && (
                  <span className="ml-2 bg-muted-foreground/20 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                    {requests.filter(r => r.status === "accepted").length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="hired" className="px-6">
                Hired
                {requests.filter(r => r.status === "hired").length > 0 && (
                  <span className="ml-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {requests.filter(r => r.status === "hired").length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-0">
              <RequestGrid 
                requests={requests.filter(r => r.status === "pending")} 
                emptyMessage="No pending requests at the moment."
                onUpdateStatus={handleUpdateStatus}
                router={router}
                profile={profile}
              />
            </TabsContent>

            <TabsContent value="approved" className="mt-0">
              <RequestGrid 
                requests={requests.filter(r => r.status === "accepted")} 
                emptyMessage="No approved requests yet. Accept pending requests to see them here."
                onUpdateStatus={handleUpdateStatus}
                router={router}
                profile={profile}
              />
            </TabsContent>

            <TabsContent value="hired" className="mt-0">
              <RequestGrid 
                requests={requests.filter(r => r.status === "hired")} 
                emptyMessage="No finalized deals yet. Complete the hiring process with recruiters to see them here."
                onUpdateStatus={handleUpdateStatus}
                router={router}
                profile={profile}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </RoleGuard>
  );
}

// Sub-component for the grid to keep things clean
function RequestGrid({ requests, emptyMessage, onUpdateStatus, router, profile }: { 
  requests: HiringRequest[], 
  emptyMessage: string,
  onUpdateStatus: (id: string, status: "accepted" | "rejected") => void,
  router: any,
  profile: any
}) {
  if (requests.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">Empty List</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {requests.map((request) => (
        <Card key={request.id} className="border-border/60 shadow-sm flex flex-col hover:border-primary/20 transition-all">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <div className="flex justify-between items-start gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  {request.companyName}
                </CardTitle>
                <CardDescription className="mt-1">
                  Requested by {request.hrName} • {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </CardDescription>
              </div>
              <Badge variant={
                request.status === "pending" ? "secondary" :
                request.status === "accepted" ? "default" : 
                request.status === "hired" ? "outline" : "destructive"
              } className={`capitalize ${request.status === "hired" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}>
                {request.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="font-medium text-muted-foreground">Workforce Required</div>
                <div className="text-2xl font-bold text-primary">{request.bulkCount} Professionals</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sector</p>
                  <p className="text-sm font-semibold">{request.selectedSector || "General Security"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Location Preference</p>
                  <p className="text-sm font-semibold">{request.locationPreference || "Pan-India"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Specific Roles / Sub-Sectors</p>
                <div className="flex flex-wrap gap-1.5">
                  {request.selectedRoles && request.selectedRoles.length > 0 ? (
                    request.selectedRoles.map((role: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="bg-background border-border/60 text-[10px]">
                        {role.startsWith("Other: ") ? role.replace("Other: ", "") : role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No specific roles specified</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Message from Recruiter</p>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md italic">
                  "{request.message}"
                </p>
              </div>
            </div>
          </CardContent>
          {request.status === "pending" && (
            <div className="p-4 pt-0 mt-auto flex gap-3">
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:bg-destructive/10"
                onClick={() => onUpdateStatus(request.id, "rejected")}
              >
                <XCircle className="mr-2 h-4 w-4" /> Decline
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onUpdateStatus(request.id, "accepted")}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Accept Request
              </Button>
            </div>
          )}
          {(request.status === "accepted" || request.status === "hired") && (
            <div className="p-4 pt-0 mt-auto flex gap-3">
              <Button
                className={`w-full ${request.status === "hired" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#4f46e5] hover:bg-[#4338ca]"} text-white`}
                onClick={() => router.push(`/dashboard/messages?chat=${request.chatRoomId || request.id}&req=${request.id}`)}
              >
                <MessageSquare className="mr-2 h-4 w-4" /> 
                {request.status === "hired" ? "View Partnership Chat" : "Open Chat"}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
