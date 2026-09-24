"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, getDocs } from "firebase/firestore";
import { createNotification } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, IndianRupee, Loader2, CheckCircle, Clock, FileText, ExternalLink, Building } from "lucide-react";
import { toast } from "sonner";
import { sendEmail } from "@/lib/email";
import type { Job, JobApplication } from "@/lib/types";
import { RoleGuard } from "@/components/role-guard";

export default function AgencyJobBoardPage() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<string[]>([]); // Array of applied Job IDs
  const [appsLoaded, setAppsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== "agency") return;

    // Load available open jobs
    const qJobs = query(collection(db, "jobs"), where("status", "==", "open"));
    const unsubscribeJobs = onSnapshot(qJobs, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Job[];
      
      // Sort newest first
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setJobs(data);
      setLoading(false);
    });

    // Load agency's applications
    async function loadApplications() {
      const qApps = query(collection(db, "job_applications"), where("agencyId", "==", profile?.uid));
      const snapshot = await getDocs(qApps);
      setApplications(snapshot.docs.map(doc => doc.data().jobId));
      setAppsLoaded(true);
    }
    loadApplications();

    return () => unsubscribeJobs();
  }, [profile]);

  async function handleApply(job: Job) {
    if (!appsLoaded) return; // Prevent race conditions before db loads

    // KYC Verification Check
    if (profile?.kycStatus !== "approved") {
      toast.error("Verification Required", {
        description: "Your agency must be verified (KYC Approved) before you can fulfill jobs.",
      });
      return;
    }

    try {
      const companyName = profile?.companyDetails?.name || profile?.fullName || "Agency";
      const newApp: Omit<JobApplication, "id"> = {
        jobId: job.id as string,
        jobTitle: job.title,
        hrId: job.hrId,
        guardId: profile!.uid, // Reusing guardId field for rules backward compatibility, but marking as agency
        guardName: companyName,
        guardEmail: profile!.email,
        status: "pending",
        appliedAt: new Date().toISOString(),
        isAgency: true,
        agencyId: profile!.uid,
        agencyName: companyName
      };
      
      await addDoc(collection(db, "job_applications"), newApp);

      // Trigger In-App Notification for HR
      await createNotification(job.hrId, {
        title: "Agency Fulfillment Request! 🏢",
        message: `${companyName} has offered to fulfill your requirements for ${job.title}.`,
        type: "success",
        link: `/dashboard/hr/jobs/${job.id}`,
      });

      setApplications([...applications, job.id as string]);
      toast.success("Successfully applied to fulfill this job!");

      // Trigger Email Notification Silently
      sendEmail({
        to: profile!.email,
        subject: `Fulfillment Application Sent - ${job.companyName}`,
        template: "application_received",
        data: {
          fullName: companyName,
          companyName: job.companyName,
        }
      }).catch(console.error);

    } catch (err) {
      toast.error("Failed to apply for job.");
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["agency"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            B2B Job Board
          </h1>
          <p className="text-muted-foreground mt-1">Browse open HR requirements and offer your agency's workforce to fulfill them.</p>
        </div>

        {jobs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 bg-white/5 border-dashed">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2 text-foreground">No Jobs Available</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              There are currently no open HR requirements. Please check back later!
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
              const hasApplied = applications.includes(job.id as string);
              
              return (
                <Card key={job.id} className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                        {job.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-xl pt-1">{job.title}</CardTitle>
                    <CardDescription className="flex items-center text-sm font-medium text-foreground mt-1">
                      {job.companyName}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-1 shrink-0" />
                        <span className="line-clamp-1">{job.location}</span>
                      </div>
                      <div className="flex items-center text-green-600 font-medium">
                        <IndianRupee className="w-4 h-4 mr-1 shrink-0" />
                        {job.salary}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground line-clamp-3 my-2 flex-1">
                      {job.description}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" className="px-0 py-0 h-auto self-start text-primary">Read full description</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{job.title} @ {job.companyName}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-6 text-sm">
                          <div>
                            <h4 className="font-bold text-foreground mb-2">Job Description</h4>
                            <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{job.description}</p>
                          </div>
                          {job.requirements && job.requirements.length > 0 && (
                            <div>
                              <h4 className="font-bold text-foreground mb-2">Requirements</h4>
                              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                                {job.requirements.map((req, i) => (
                                  <li key={i}>{req}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {job.pdfUrl && (
                      <a href={job.pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                        <Button variant="outline" size="sm" className="w-full gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                          <FileText className="w-4 h-4" /> View Full JD <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                    )}

                    <div className="pt-4 border-t border-border mt-auto">
                      {hasApplied ? (
                        <Button variant="secondary" className="w-full gap-2" disabled>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Application Sent
                        </Button>
                      ) : (
                        <Button 
                          className="w-full font-bold bg-[#ff7f50] hover:bg-[#e06b40] text-white" 
                          onClick={() => handleApply(job)}
                          disabled={profile?.kycStatus !== "approved"}
                        >
                          {profile?.kycStatus !== "approved" ? "Verification Required" : "Fulfill as Agency"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
