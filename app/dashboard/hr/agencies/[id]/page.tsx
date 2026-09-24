"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building, MapPin, Users, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { AgencyKYCData } from "@/lib/types";

export default function AgencyProfileViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [agency, setAgency] = useState<AgencyKYCData | null>(null);
  const [headName, setHeadName] = useState<string>("Loading...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== "hr" || !id) return;

    async function loadAgency() {
      try {
        const docRef = doc(db, "agency_kyc", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().status === "approved") {
          const agencyData = docSnap.data() as AgencyKYCData;
          setAgency(agencyData);
          
          try {
            const userRef = doc(db, "users", agencyData.agencyId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setHeadName(userSnap.data().fullName || "Unknown");
            } else {
              setHeadName("Unknown");
            }
          } catch (e) {
            setHeadName("Unknown");
          }
        } else {
          toast.error("Agency profile not found or not verified yet.");
          router.push("/dashboard/hr/agencies");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading agency details");
      } finally {
        setLoading(false);
      }
    }
    
    loadAgency();
  }, [id, profile, router]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agency) return null;

  return (
    <RoleGuard allowedRoles={["hr"]}>
      <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building className="h-6 w-6 text-indigo-600" />
              {agency.companyName}
            </h1>
            <div className="text-muted-foreground flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified Agency
              </Badge>
              • {agency.capacity} Guards Capacity
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Left Column: Overview */}
          <Card className="md:col-span-2 shadow-sm border-border/60">
            <CardHeader>
              <CardTitle className="text-xl">Agency Overview</CardTitle>
              <CardDescription>Official business details and capabilities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Company Name</p>
                  <p className="font-medium text-foreground">{agency.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Head of Agency</p>
                  <p className="font-medium text-foreground">{headName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Capacity</p>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    {agency.capacity} Professionals
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Registered Address</p>
                  <p className="font-medium text-foreground flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    {agency.address}
                  </p>
                </div>
                {agency.website && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Website</p>
                    <a href={agency.website} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:underline flex items-center gap-1">
                      {agency.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {agency.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Compliance */}
          <Card className="shadow-sm border-border/60 bg-muted/20">
            <CardHeader>
              <CardTitle className="text-xl">Compliance & Legal</CardTitle>
              <CardDescription>Verified registration details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-white rounded-lg border border-border/50 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">CIN / Registration No.</p>
                <p className="font-mono text-sm">{agency.registrationNumber}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-border/50 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">GST Number</p>
                <p className="font-mono text-sm">{agency.gstNumber}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-border/50 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">PSARA License No.</p>
                <p className="font-mono text-sm">{agency.psaraLicenseNumber}</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </RoleGuard>
  );
}
