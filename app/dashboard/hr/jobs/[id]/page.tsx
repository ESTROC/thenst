"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, addDoc, increment } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Mail, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createChatRoom, createNotification, updateJobApplicationStatus } from "@/lib/firestore";
import { sendEmail } from "@/lib/email";
import type { Job, JobApplication } from "@/lib/types";
import { SubscriptionModal } from "@/components/subscription-modal";

export default function JobApplicantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubscription, setShowSubscription] = useState(false);

  useEffect(() => {
    if (!profile || profile.role !== "hr" || !id) return;

    async function loadJob() {
      try {
        const docRef = doc(db, "jobs", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().hrId === profile?.uid) {
          setJob({ id: docSnap.id, ...docSnap.data() } as Job);
        } else {
          toast.error("Job not found or access denied");
          router.push("/dashboard/hr/jobs");
        }
      } catch (err) {
        toast.error("Error loading job details");
      }
    }
    loadJob();
  }, [id, profile, router]);

  useEffect(() => {
    if (!job || !profile) return;

    const q = query(
      collection(db, "job_applications"),
      where("jobId", "==", job.id),
      where("hrId", "==", profile.uid) // Required by Firestore rules
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JobApplication[];

      // Sort: Pending first, then Accepted, etc.
      data.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

      setApplications(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Failed to load applicants due to permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [job]);

  async function updateStatus(applicationId: string, newStatus: JobApplication["status"]) {
    if (!profile || !job) return;

    try {
      await updateJobApplicationStatus(applicationId, newStatus, profile, job);
      toast.success(`Applicant marked as ${newStatus}`);
    } catch (err: any) {
      if (err.message === "Insufficient credits") {
        setShowSubscription(true);
      } else {
        console.error(err);
        toast.error(err.message || "Failed to update status");
      }
    }
  }

  if (loading || !job) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/hr/jobs")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 mt-1 text-sm font-medium">
            <Badge variant={job.status === "open" ? "default" : "secondary"} className={job.status === "open" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : ""}>
              {job.status === "open" ? "Active" : "Closed"}
            </Badge>
            <span>{job.location} • {job.type}</span>
            {job.sector && (
              <>
                <span className="text-slate-300">•</span>
                <Badge variant="outline" className="bg-cyan-50/50 text-cyan-700 border-cyan-100 text-[11px] font-bold px-2 py-0.5">
                  {job.sector.startsWith("Other: ") ? job.sector.replace("Other: ", "") : job.sector}
                </Badge>
              </>
            )}
            {job.role && (
              <>
                <span className="text-slate-300">•</span>
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-bold px-2 py-0.5">
                  {job.role.startsWith("Other: ") ? job.role.replace("Other: ", "") : job.role}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <h2 className="text-xl font-semibold">Applicants ({applications.length})</h2>
        {applications.length === 0 ? (
          <Card className="p-12 border-dashed bg-white/5 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground max-w-sm">
              We'll notify you as soon as verified security professionals apply for this position.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {applications.map((app) => (
              <Card key={app.id} className="relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full 
                  ${app.status === "pending" ? "bg-blue-500" :
                    app.status === "accepted" ? "bg-green-500" :
                      app.status === "rejected" ? "bg-red-500" : "bg-zinc-500"}`}
                />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {app.guardName}
                        {app.isAgency && (
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200 text-[10px]">
                            🏢 Verified Agency
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={
                      app.status === "pending" ? "text-blue-500 border-blue-200 bg-blue-50" :
                        app.status === "accepted" ? "text-green-600 border-green-200 bg-green-50" :
                          "text-red-500 border-red-200 bg-red-50"
                    }>
                      {app.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>Applied {new Date(app.appliedAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                    {app.guardEmail}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border mt-4">
                    {app.isAgency ? (
                      <Link href={`/dashboard/hr/agencies/${app.agencyId}`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                          View Agency Profile <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/dashboard/hr/guards/${app.guardId}?jobId=${id}`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2 text-xs">
                          View Full Profile <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                    {app.status === "pending" && (
                      <>
                        <Button
                          variant="default"
                          size="icon"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatus(app.id as string, "accepted")}
                          title="Accept Applicant"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => updateStatus(app.id as string, "rejected")}
                          title="Reject Applicant"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <SubscriptionModal open={showSubscription} onOpenChange={setShowSubscription} />
    </div>
  );
}
