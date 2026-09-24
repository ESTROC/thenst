"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { HiringRequest, Job, JobApplication } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Clock, User, CheckCircle2, XCircle, CalendarCheck } from "lucide-react";
import { updateHiringFinalStatus } from "@/lib/firestore";
import { toast } from "sonner";
import { RoleGuard } from "@/components/role-guard";
import Link from "next/link";

export default function InternInterviewPipelinePage() {
  const { profile, loading: authLoading } = useAuth();
  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Background migration for prior accepted applications (auto-healing)
  useEffect(() => {
    if (authLoading || !profile || profile.role !== "intern") return;

    const myProfile = profile!;

    async function healOrphanApplications() {
      try {
        const { getDocs, addDoc, doc, updateDoc } = await import("firebase/firestore");
        
        // 1. Fetch all jobs created by this intern
        const jobsSnap = await getDocs(query(collection(db, "jobs"), where("hrId", "==", myProfile.uid)));
        const internJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
        if (internJobs.length === 0) return;

        // 2. Fetch all accepted job applications for these jobs
        const jobIds = internJobs.map(j => j.id);
        const acceptedApps: JobApplication[] = [];
        
        // Firestore 'in' queries support max 10 elements. Let's chunk if needed.
        for (let i = 0; i < jobIds.length; i += 10) {
          const chunk = jobIds.slice(i, i + 10);
          const appsSnap = await getDocs(
            query(
              collection(db, "job_applications"),
              where("jobId", "in", chunk),
              where("status", "==", "accepted"),
              where("hrId", "==", myProfile.uid)
            )
          );
          appsSnap.docs.forEach(d => {
            acceptedApps.push({ id: d.id, ...d.data() } as JobApplication);
          });
        }

        if (acceptedApps.length === 0) return;

        // 3. Fetch all existing hiring requests
        const requestsSnap = await getDocs(
          query(collection(db, "hiring_requests"), where("hrId", "==", myProfile.uid))
        );
        const existingRequests = requestsSnap.docs.map(d => d.data() as HiringRequest);

        // 4. Find orphan accepted applications and construct requests for them
        for (const app of acceptedApps) {
          const job = internJobs.find(j => j.id === app.jobId);
          if (!job) continue;

          const alreadyHasRequest = existingRequests.some(r => r.guardId === app.guardId);
          if (!alreadyHasRequest) {
            // Heal this orphan
            const newRequestData = {
              hrId: myProfile.uid,
              guardId: app.guardId,
              hrName: myProfile.fullName || "TheNST Intern",
              hrEmail: myProfile.email || "",
              guardName: app.guardName,
              guardEmail: app.guardEmail,
              companyName: job.companyName || "TheNST",
              status: "accepted",
              message: `Your job application for ${job.title} has been accepted by TheNST team. We are interested in your profile.`,
              createdAt: new Date().toISOString(),
              ...(app.agencyId && { agencyId: app.agencyId }),
            };

            const requestRef = await addDoc(collection(db, "hiring_requests"), newRequestData);

            // Chat & Notification creation
            const { createChatRoom, createNotification } = await import("@/lib/firestore");
            const roomId = await createChatRoom(requestRef.id, { ...newRequestData, id: requestRef.id } as any);
            await updateDoc(requestRef, { chatRoomId: roomId });

            await createNotification(app.guardId, {
              title: "Application Accepted! 🎉",
              message: `TheNST has accepted your application for ${job.title}. Check your Job Offers to connect!`,
              type: "success"
            });
          }
        }
      } catch (err) {
        console.error("Prior application migration failed:", err);
      }
    }

    healOrphanApplications();
  }, [authLoading, profile]);

  const [candidateRoles, setCandidateRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading || !profile || profile.role !== "intern") return;

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
        <div className="h-12 w-12 rounded-full bg-cyan-500/20 mb-4" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['intern']}>
      <div className="space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6">
          <div>
            <div className="inline-flex items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 p-3 mb-4 shadow-sm border border-cyan-100">
              <CalendarCheck className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
              Interview Pipeline
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-base font-semibold">
              Manage candidates who have cleared your initial screening and are awaiting your final hiring decision under TheNST.
            </p>
          </div>
          <div className="mt-4 md:mt-0 bg-cyan-50/50 px-4 py-2 rounded-lg border border-cyan-100">
            <span className="text-sm font-bold text-cyan-700">Active Candidates: {hiringRequests.length}</span>
          </div>
        </div>

        {/* Kanban / Cards */}
        {hiringRequests.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {hiringRequests.map((request) => (
              <Card key={request.id} className="relative overflow-hidden group border-slate-200 hover:border-cyan-300 transition-all duration-300 hover:shadow-lg bg-white">
                {/* Glowing Ambient Background */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-50/50 rounded-full blur-[40px] transition-colors" />
                
                <CardContent className="p-6 relative z-10 flex flex-col h-full">
                  
                  {/* Card Header Profile */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center font-extrabold text-cyan-600 text-xl shadow-inner">
                      {request.guardName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-800 truncate">{request.guardName}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200/50 shadow-sm font-bold text-[10px]">
                          <Clock className="w-3 h-3 mr-1" /> Pending Decision
                        </Badge>
                        {request.agencyId || request.isBulk || candidateRoles[request.guardId] === "agency" ? (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-150/50 shadow-sm font-black text-[10px]">
                            Security Agency
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-150/50 shadow-sm font-black text-[10px]">
                            Security Professional
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-bold">
                        Accepted: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto space-y-3 pt-6 border-t border-slate-100">
                    <Link href={`/dashboard/intern/guards/${request.guardId}`} className="block">
                      <Button variant="secondary" className="w-full bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 transition-colors border border-slate-200 rounded-xl">
                        <User className="w-4 h-4 mr-2" /> View Full Profile
                      </Button>
                    </Link>
                    
                    <div className="flex items-center gap-3">
                      <Button 
                        size="default" 
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md shadow-emerald-500/20 border-none transition-all duration-300 font-bold rounded-xl h-10"
                        onClick={() => handleUpdateStatus(request.id!, "hired")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Hire
                      </Button>
                      <Button 
                        size="default" 
                        variant="destructive"
                        className="flex-1 bg-red-50 text-red-650 hover:bg-red-100 hover:text-red-700 border border-red-200 transition-all duration-300 shadow-none font-bold rounded-xl h-10"
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
          <Card className="bg-white border-dashed border-2 relative overflow-hidden rounded-3xl border-slate-200">
            <CardContent className="py-24 flex flex-col items-center justify-center text-center relative z-10">
              <div className="p-6 rounded-full bg-slate-50 mb-6 border border-slate-100">
                <BadgeCheck className="h-16 w-16 text-slate-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-wide">Your Pipeline is Empty</h3>
              <p className="text-sm text-slate-500 font-semibold max-w-md">
                When security professionals accept your job applications, they will automatically land in this pipeline for your final review and final hiring decision!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}
