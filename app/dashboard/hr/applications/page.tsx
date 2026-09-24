"use client";

import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KYCApplicationsTable } from "@/components/kyc-applications-table";
import { getAllKYC } from "@/lib/firestore";
import type { KYCData } from "@/lib/types";

export default function HRApplicationsPage() {
  const [applications, setApplications] = useState<KYCData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    try {
      const data = await getAllKYC();
      setApplications(data);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading applications...</p>
      </div>
    );
  }

  const pending = applications.filter((a) => a.status === "pending");
  const approved = applications.filter((a) => a.status === "approved");
  const rejected = applications.filter((a) => a.status === "rejected");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">KYC Applications</h2>
        <p className="text-muted-foreground">
          Review and manage guard KYC applications.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <KYCApplicationsTable applications={pending} onRefresh={fetchApplications} canReview />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <KYCApplicationsTable applications={approved} onRefresh={fetchApplications} canReview={false} />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <KYCApplicationsTable applications={rejected} onRefresh={fetchApplications} canReview={false} />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <KYCApplicationsTable applications={applications} onRefresh={fetchApplications} canReview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
