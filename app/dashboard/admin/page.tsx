"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserCog, FileText, Shield, CheckCircle2, Clock, XCircle, ShieldOff, ArrowRight, BadgeCheck, Building } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { getDashboardStats, getAllHiredRequests } from "@/lib/firestore";
import type { DashboardStats, HiringRequest } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { RoleGuard } from "@/components/role-guard";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hiredRequests, setHiredRequests] = useState<HiringRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, hiredData] = await Promise.all([
          getDashboardStats(),
          getAllHiredRequests()
        ]);
        setStats(statsData);
        setHiredRequests(hiredData);
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex flex-col gap-8 pb-10">
        {/* Welcome Banner - Exact Proportions Match to Screenshot */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2563eb] to-[#3730a3] p-8 md:p-10 shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-white/20 text-white shadow-sm">
                <Shield className="h-4 w-4" />
                <span>Administrative Oversight</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white max-w-xl mx-auto md:mx-0">
                Operational <span className="font-medium opacity-95">Intelligence</span>
              </h1>
              <p className="text-blue-50/90 text-sm md:text-base max-w-lg font-medium leading-relaxed mx-auto md:md:mx-0">
                Monitoring platform activity and verifying workforce credentials. Your oversight ensures a secure ecosystem.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Button size="lg" className="rounded-2xl bg-white text-[#010b26] hover:bg-slate-50 shadow-md font-bold px-8 h-12" asChild>
                <Link href="/dashboard/admin/guards">
                  Security Hub <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl border-white/40 bg-transparent text-white hover:bg-white/10 px-8 h-12 font-bold transition-all" asChild>
                <Link href="/dashboard/admin/hr">
                  HR Verification
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Stats Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Metrics */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Operational Metrics</h2>
                  <p className="text-sm text-muted-foreground">Workforce and recruitment overview</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="grid gap-4">
                  <StatCard title="Total Professionals" value={stats?.totalGuards || 0} icon={Shield} href="/dashboard/admin/guards" className="bg-white border-slate-200" />
                  <StatCard title="Verified Professionals" value={stats?.verifiedGuards || 0} icon={CheckCircle2} iconClassName="bg-blue-50 text-blue-600" href="/dashboard/admin/guards" className="bg-white border-slate-200" />
                </div>
                <div className="grid gap-4">
                  <StatCard title="Total HR Recruiters" value={stats?.totalHR || 0} icon={UserCog} href="/dashboard/admin/hr" className="bg-white border-slate-200" />
                  <StatCard title="Verified Recruiters" value={stats?.verifiedHR || 0} icon={CheckCircle2} iconClassName="bg-blue-50 text-blue-600" href="/dashboard/admin/hr" className="bg-white border-slate-200" />
                </div>
                <div className="grid gap-4">
                  <StatCard title="Total Security Agencies" value={stats?.totalAgencies || 0} icon={Building} href="/dashboard/admin/agencies" className="bg-white border-slate-200" />
                  <StatCard title="Verified Agencies" value={stats?.verifiedAgencies || 0} icon={CheckCircle2} iconClassName="bg-blue-50 text-blue-600" href="/dashboard/admin/agencies" className="bg-white border-slate-200" />
                </div>
              </div>

              <div className="grid gap-4 mt-4 sm:grid-cols-3">
                <StatCard 
                  title="Successful Hirings" 
                  value={stats?.totalPlacements || 0} 
                  icon={BadgeCheck} 
                  href="/dashboard/admin/history"
                  className="bg-white border-slate-200"
                />
                <StatCard title="Active Platform Users" value={stats?.activeUsers || 0} icon={Users} iconClassName="bg-slate-50 text-primary" className="bg-white border-slate-200" />
                <StatCard title="Access Restricted" value={stats?.blockedUsers || 0} icon={ShieldOff} iconClassName="bg-destructive/5 text-destructive" className="bg-white border-slate-200" />
              </div>
            </section>

            {/* Hiring History Table */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Hiring History</h2>
                  <p className="text-sm text-muted-foreground">Detailed overview of platform placements</p>
                </div>
              </div>

              <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold">Candidate / Agency</TableHead>
                      <TableHead className="font-bold">Type</TableHead>
                      <TableHead className="font-bold">Quantity</TableHead>
                      <TableHead className="font-bold">Company</TableHead>
                      <TableHead className="font-bold">HR</TableHead>
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hiredRequests.length > 0 ? (
                      hiredRequests.map((req) => (
                        <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{req.isBulk ? (req.guardName || "Security Agency") : req.guardName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={req.isBulk ? "bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]" : "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]"}>
                              {req.isBulk ? "Agency" : "Individual"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{req.isBulk ? (req.bulkCount || 0) : 1}</span>
                          </TableCell>
                          <TableCell>{req.companyName}</TableCell>
                          <TableCell>{req.hrName}</TableCell>
                          <TableCell>{new Date(req.updatedAt || req.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Hired
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          No hiring data available yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
              <div className="flex justify-end">
                <Link href="/dashboard/admin/history">
                  <Button variant="link" className="text-blue-600 font-semibold flex items-center gap-2">
                    View Full History <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </section>
          </div>

          {/* Sidebar Space: Verification Pipeline */}
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Pipeline Status</h2>
                  <p className="text-sm text-muted-foreground">KYC review queue</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <StatCard
                  title="Pending Review"
                  value={stats?.pendingKYC || 0}
                  icon={Clock}
                  iconClassName="bg-amber-50 text-amber-600"
                  className="border-slate-200 bg-white shadow-sm"
                  href="/dashboard/admin/applications"
                />
                <StatCard
                  title="Recently Approved"
                  value={stats?.approvedKYC || 0}
                  icon={CheckCircle2}
                  iconClassName="bg-blue-50 text-blue-600"
                  className="border-slate-200 bg-white"
                  href="/dashboard/admin/applications"
                />
                <StatCard
                  title="Verification Failures"
                  value={stats?.rejectedKYC || 0}
                  icon={XCircle}
                  iconClassName="bg-red-50 text-red-600"
                  className="border-slate-200 bg-white"
                  href="/dashboard/admin/applications"
                />
              </div>
            </section>

            {/* Quick Info Card */}
            <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 to-transparent p-6 shadow-sm">
              <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Quick Tip
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "Regularly monitoring the 'Pending Review' queue ensures faster onboarding for security professionals and improves platform reliability."
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
