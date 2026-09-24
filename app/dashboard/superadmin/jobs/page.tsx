"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, IndianRupee, Users, Loader2, Clock, Building } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Job } from "@/lib/types";

export default function SuperadminJobsPage() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== "superadmin") return;

    const q = query(
      collection(db, "jobs"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Job[];
      setJobs(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error("Failed to load platform jobs");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Job Postings</h1>
        <p className="text-muted-foreground mt-1">Monitor all jobs posted by HR Recruiters across the platform.</p>
      </div>

      {jobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 bg-white/5 border-dashed">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2 text-foreground">No Jobs Posted Yet</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Recruiters have not created any job listings on the platform yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
              <div className={`absolute top-0 left-0 w-1 h-full ${job.status === "open" ? "bg-green-500" : "bg-zinc-500"}`} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={job.status === "open" ? "default" : "secondary"} className={job.status === "open" ? "bg-green-500/10 text-green-600 border-green-200" : ""}>
                    {job.status === "open" ? "Active" : "Closed"}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg line-clamp-1">{job.title}</CardTitle>
                <CardDescription className="flex items-center mt-1 text-foreground/80 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  <Building className="w-3 h-3 mr-1 shrink-0" />
                  {job.companyName} ({job.hrName})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1 shrink-0" />
                    <span className="truncate max-w-[120px]">{job.location}</span>
                  </div>
                  <div className="flex items-center text-primary font-medium">
                    <IndianRupee className="w-4 h-4 mr-1 shrink-0" />
                    {job.salary}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border mt-auto">
                  <Link href={`/dashboard/${profile?.role}/jobs/${job.id}`} className="block">
                    <Button variant="secondary" className="w-full flex items-center justify-between group">
                      Monitor Applications
                      <Users className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
