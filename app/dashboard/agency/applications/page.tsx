"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ClipboardList, ExternalLink, CheckCircle, Clock, XCircle, Building } from "lucide-react";
import { RoleGuard } from "@/components/role-guard";
import type { JobApplication } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AgencyPipelinePage() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== "agency") return;

    const q = query(
      collection(db, "job_applications"),
      where("agencyId", "==", profile.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const apps = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JobApplication[];

      // Sort newest first
      apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

      // Fetch company names dynamically since we only have hrId, but actually, we can just fetch job details if needed.
      // We will just use the jobTitle and fetch company name if we can, but we don't store companyName in JobApplication by default.
      // Wait, HR jobs have `companyName` but the app only has `hrId` and `jobTitle`.
      // For a better UI, we'll just show Job Title and the HR ID for now, or fetch the job.
      
      const appsWithCompany = await Promise.all(apps.map(async (app) => {
        try {
          const jobDoc = await getDoc(doc(db, "jobs", app.jobId));
          if (jobDoc.exists()) {
            return { ...app, companyName: jobDoc.data().companyName };
          }
        } catch (e) {
            // Ignore error
        }
        return { ...app, companyName: "Unknown Company" };
      }));

      setApplications(appsWithCompany);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "hired":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-md gap-1 px-2.5 py-0.5"><CheckCircle className="w-3.5 h-3.5" /> Hired</Badge>;
      case "accepted":
        return <Badge className="bg-blue-500 hover:bg-blue-600 shadow-md gap-1 px-2.5 py-0.5"><CheckCircle className="w-3.5 h-3.5" /> Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-rose-500 hover:bg-rose-600 shadow-md gap-1 px-2.5 py-0.5"><XCircle className="w-3.5 h-3.5" /> Rejected</Badge>;
      case "pending":
      default:
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 gap-1 px-2.5 py-0.5"><Clock className="w-3.5 h-3.5" /> Pending Review</Badge>;
    }
  };

  return (
    <RoleGuard allowedRoles={["agency"]}>
      <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            My Applications Pipeline
          </h1>
          <p className="text-muted-foreground mt-2">Track the status of B2B job fulfillments you have offered to HR managers.</p>
        </div>

        <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>Application History</CardTitle>
            <CardDescription>All your submitted fulfillments</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-xl font-medium mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  You haven't offered to fulfill any HR job postings yet. Head over to the Job Board to start finding opportunities.
                </p>
                <Link href="/dashboard/agency/jobs">
                  <Button className="font-bold">Browse Job Board</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Job Title & Company</TableHead>
                    <TableHead>Date Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{app.jobTitle}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3" /> {(app as any).companyName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-muted-foreground">
                        {new Date(app.appliedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(app.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/agency/jobs`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-primary">
                            Job Board <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
