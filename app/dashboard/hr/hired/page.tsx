"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { HiringRequest } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, UserCheck, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/role-guard";

export default function HiredProfessionalsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !profile || profile.role !== "hr") return;

    const q = query(
      collection(db, "hiring_requests"), 
      where("hrId", "==", profile.uid),
      where("status", "==", "hired")
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

  if (authLoading || loading) {
    return <div className="p-8">Loading Hired Professionals...</div>;
  }

  return (
    <RoleGuard allowedRoles={['hr']}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-green-600">
            <UserCheck className="h-7 w-7" />
            Hired Professionals
          </h2>
          <p className="text-muted-foreground">History of professionals you have successfully hired through TheNST.</p>
        </div>

        {hiringRequests.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hiringRequests.map((request) => (
              <Card key={request.id} className="border-green-500/20 bg-green-500/[0.02] hover:bg-green-500/[0.04] transition-colors relative group">
                <div className="absolute top-3 right-3">
                    <BadgeCheck className="h-5 w-5 text-green-600" />
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-green-100 flex items-center justify-center font-bold text-green-700 text-3xl shadow-sm border border-green-200">
                      {request.guardName.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-lg text-foreground">{request.guardName}</p>
                      <p className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full w-fit mx-auto">Verified Hire</p>
                    </div>

                    <div className="w-full space-y-3 pt-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Hired on {new Date(request.updatedAt || request.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="w-full pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-green-200 hover:bg-green-100 text-green-700"
                        onClick={() => window.open(`mailto:${request.guardEmail}`)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/30 border-dashed border-2">
            <CardContent className="py-20 flex flex-col items-center justify-center text-center">
              <UserCheck className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <p className="text-xl font-bold text-muted-foreground">No hires yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Your hiring success stories will appear here. Start by exploring professionals and sending hiring requests!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  );
}
