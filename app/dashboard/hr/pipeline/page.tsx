"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { HiringRequest } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Clock, User, CheckCircle2, XCircle, CalendarCheck } from "lucide-react";
import { updateHiringFinalStatus } from "@/lib/firestore";
import { toast } from "sonner";
import { RoleGuard } from "@/components/role-guard";
import Link from "next/link";

export default function InterviewPipelinePage() {
  const { profile, loading: authLoading } = useAuth();
  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [candidateRoles, setCandidateRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading || !profile || profile.role !== "hr") return;

    const q = query(
      collection(db, "hiring_requests"), 
      where("hrId", "==", profile.uid),
      where("status", "==", "accepted")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHiringRequests(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as HiringRequest))
        .filter(req => !req.isBulk)
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authLoading, profile]);

  useEffect(() => {
    if (hiringRequests.length === 0) return;

    const fetchRoles = async () => {
      const { doc, getDoc } = await import("firebase/firestore");
      const rolesMap: Record<string, string> = { ...candidateRoles };
      let updated = false;

      for (const req of hiringRequests) {
        if (!req.guardId || rolesMap[req.guardId]) continue;

        try {
          const userDoc = await getDoc(doc(db, "users", req.guardId));
          if (userDoc.exists()) {
            rolesMap[req.guardId] = userDoc.data().role || "guard";
            updated = true;
          }
        } catch (err) {
          console.error("Error fetching candidate role:", err);
        }
      }

      if (updated) {
        setCandidateRoles(rolesMap);
      }
    };

    fetchRoles();
  }, [hiringRequests]);

  const handleUpdateStatus = async (requestId: string, status: "hired" | "interv_rejected") => {
    try {
      await updateHiringFinalStatus(requestId, status);
      toast.success(status === "hired" ? "Candidate officially hired!" : "Candidate declined.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center animate-pulse">
        <div className="h-12 w-12 rounded-full bg-primary/20 mb-4" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['hr']}>
      <div className="space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6">
          <div>
            <div className="inline-flex items-center justify-center rounded-xl bg-primary/10 text-primary p-3 mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <CalendarCheck className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Interview Pipeline
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
              Manage security professionals who have cleared the initial screen and are awaiting your final decision.
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
            <span className="text-sm font-medium text-primary">Active Candidates: {hiringRequests.length}</span>
          </div>
        </div>

        {/* Kanban / Cards */}
        {hiringRequests.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {hiringRequests.map((request) => (
              <Card key={request.id} className="relative overflow-hidden group border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-card/60 backdrop-blur-sm">
                {/* Glowing Ambient Background */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-[40px] group-hover:bg-primary/20 transition-colors" />
                
                <CardContent className="p-6 relative z-10 flex flex-col h-full">
                  
                  {/* Card Header Profile */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/20 flex items-center justify-center font-extrabold text-primary text-xl shadow-inner">
                      {request.guardName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground truncate">{request.guardName}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200/50 shadow-sm">
                          <Clock className="w-3 h-3 mr-1" /> Pending Decision
                        </Badge>
                        {request.agencyId || request.isBulk || candidateRoles[request.guardId] === "agency" ? (
                          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-200/50 shadow-sm font-semibold">
                            Security Agency
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600 border-cyan-200/50 shadow-sm font-semibold">
                            Security Professional
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-medium">
                        Request Accepted: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto space-y-3 pt-6 border-t border-border/50">
                    <Link href={`/dashboard/hr/guards/${request.guardId}`} className="block">
                      <Button variant="secondary" className="w-full bg-muted/50 hover:bg-muted font-medium text-foreground transition-colors group-hover:bg-primary/5">
                        <User className="w-4 h-4 mr-2" /> View Full Profile
                      </Button>
                    </Link>
                    
                    <div className="flex items-center gap-3">
                      <Button 
                        size="default" 
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20 border-none transition-all duration-300"
                        onClick={() => handleUpdateStatus(request.id!, "hired")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Hire
                      </Button>
                      <Button 
                        size="default" 
                        variant="destructive"
                        className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 transition-all duration-300 shadow-none"
                        onClick={() => handleUpdateStatus(request.id!, "interv_rejected")}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Decline
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card/40 border-dashed border-2 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
            <CardContent className="py-24 flex flex-col items-center justify-center text-center relative z-10">
              <div className="p-6 rounded-full bg-muted mb-6 shadow-inner border border-border/50">
                <BadgeCheck className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Your Pipeline is Empty</h3>
              <p className="text-lg text-muted-foreground max-w-md">
                When security professionals accept your official hiring requests, they will automatically drop into this pipeline for your final review!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}
