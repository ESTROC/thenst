"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Mail, ExternalLink, CheckCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Job, JobApplication } from "@/lib/types";

export default function AdminJobApplicantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || (profile.role !== "admin" && profile.role !== "superadmin") || !id) return;

    async function loadJob() {
      try {
        const docRef = doc(db, "jobs", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setJob({ id: docSnap.id, ...docSnap.data() } as Job);
        } else {
          toast.error("Job not found");
          router.push(`/dashboard/${profile?.role}/jobs`);
        }
      } catch (err) {
        toast.error("Error loading job details");
      }
    }
    loadJob();
  }, [id, profile, router]);

  useEffect(() => {
    if (!job) return;

    // Fetch all applications for this specific job
    const q = query(collection(db, "job_applications"), where("jobId", "==", job.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JobApplication[];
      
      // Sort: Accepted first, then Pending, then Rejected
      data.sort((a, b) => {
        const order = { accepted: 0, reviewed: 1, pending: 2, rejected: 3 };
        const statusDiff = order[a.status] - order[b.status];
        if (statusDiff !== 0) return statusDiff;
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
      });
      
      setApplications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [job]);

  if (loading || !job) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const acceptedCount = applications.filter(app => app.status === "accepted").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/${profile?.role}/jobs`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
          <div className="text-muted-foreground flex items-center gap-2">
            <Badge variant="outline">{job.companyName}</Badge>
            {job.location} • {job.type}
          </div>
        </div>
        {job.pdfUrl && (
            <a href={job.pdfUrl} target="_blank" rel="noopener noreferrer" className="ml-auto">
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" /> View JD
              </Button>
            </a>
        )}
      </div>

      <div className="grid gap-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Security Professional Applications</h2>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200">
                {acceptedCount} Approved by HR
            </Badge>
        </div>

        {applications.length === 0 ? (
          <Card className="p-12 border-dashed bg-white/5 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground max-w-sm">
              No security professionals have applied to this job listing.
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
                    <CardTitle className="text-lg font-bold">{app.guardName}</CardTitle>
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
                  
                  {app.status === "accepted" && (
                    <div className="flex justify-end pt-2 border-t border-border mt-4">
                      <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> APPROVED
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
