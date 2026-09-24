"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCog,
  UserCheck,
  FileText,
  Shield,
  ShieldOff,
  CheckCircle2,
  Clock,
  XCircle,
  LayoutDashboard,
  BarChart3,
  CreditCard,
  Settings,
  ArrowUpRight,
  ChevronRight,
  Activity,
  BadgeCheck,
  Building,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { getDashboardStats, getAllHiredRequests } from "@/lib/firestore";
import type { DashboardStats, HiringRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { RoleGuard } from "@/components/role-guard";

export default function SuperAdminDashboard() {
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
        console.error("Error fetching superadmin dashboard data:", error);
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
          <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading platform metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="flex flex-col gap-8 pb-10">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 shadow-sm">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl overflow-visible pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 overflow-visible">
            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                Superadmin <span className="text-primary italic font-serif font-normal">Command</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-lg font-medium leading-relaxed">
                Platform status is <span className="text-emerald-500 font-bold inline-flex items-center gap-1.5"><CheckCircle2 className="h-5 w-5" /> Optimal</span>. Monitoring 14 active sessions across all roles.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/dashboard/superadmin/sales">
                <Button size="lg" className="rounded-2xl px-8 shadow-lg shadow-primary/20 group font-bold">
                  Platform Sales <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </Link>
              <Link href="/dashboard/superadmin/health">
                <Button variant="outline" size="lg" className="rounded-2xl px-8 backdrop-blur-sm bg-background/50 font-bold">
                  System Health
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Statistics Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Metrics */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-1 rounded-full bg-primary" />
                <h2 className="text-xl font-bold">User Overview</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Professionals" value={stats?.totalGuards || 0} icon={Users} href="/dashboard/superadmin/guards" className="bg-white border-primary/5 shadow-sm" />
                <StatCard title="Verified Professionals" value={stats?.verifiedGuards || 0} icon={CheckCircle2} iconClassName="bg-emerald-50 text-emerald-600" href="/dashboard/superadmin/guards" className="bg-white border-primary/5 shadow-sm" />
                <StatCard title="Total HRs" value={stats?.totalHR || 0} icon={UserCog} href="/dashboard/superadmin/hr" className="bg-white border-primary/5 shadow-sm" />
                <StatCard title="Verified HRs" value={stats?.verifiedHR || 0} icon={CheckCircle2} iconClassName="bg-emerald-50 text-emerald-600" href="/dashboard/superadmin/hr" className="bg-white border-primary/5 shadow-sm" />
                <StatCard title="Total Agencies" value={stats?.totalAgencies || 0} icon={Building} href="/dashboard/superadmin/agencies" className="bg-white border-primary/5 shadow-sm" />
                <StatCard title="Verified Agencies" value={stats?.verifiedAgencies || 0} icon={CheckCircle2} iconClassName="bg-emerald-50 text-emerald-600" href="/dashboard/superadmin/agencies" className="bg-white border-primary/5 shadow-sm" />
                <StatCard title="Active Administrators" value={stats?.totalAdmins || 0} icon={UserCheck} href="/dashboard/superadmin/admins" className="bg-white border-primary/5 shadow-sm" />
                <StatCard 
                  title="Successful Hirings" 
                  value={stats?.totalPlacements || 0} 
                  icon={BadgeCheck} 
                  href="/dashboard/superadmin/history"
                  className="bg-white border-primary/5 shadow-sm" 
                />
                <StatCard title="Global Active Users" value={stats?.activeUsers || 0} icon={Shield} iconClassName="bg-emerald-500/10 text-emerald-600" className="border-emerald-500/20 bg-emerald-500/[0.02]" />
              </div>
            </section>

            {/* Hiring History Table */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-1 rounded-full bg-emerald-500" />
                <h2 className="text-xl font-bold">Global Hiring History</h2>
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
                <Link href="/dashboard/superadmin/history">
                  <Button variant="link" className="text-emerald-600 font-semibold flex items-center gap-2">
                    View Full History <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </section>

            {/* KYC Status Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-1 rounded-full bg-amber-500" />
                <h2 className="text-xl font-bold">Verification Pipeline</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  title="Security Prof. KYC"
                  value={stats?.pendingKYC || 0}
                  icon={Shield}
                  iconClassName={stats?.pendingKYC && stats.pendingKYC > 0 ? "bg-amber-500/20 text-amber-600 animate-pulse" : "bg-card/50 text-muted-foreground"}
                  href="/dashboard/superadmin/applications"
                  className={stats?.pendingKYC && stats.pendingKYC > 0 ? "border-amber-500/20 bg-amber-500/[0.04]" : "bg-card/30"}
                />
                <StatCard
                  title="Admin Verification"
                  value={stats?.pendingAdminCount || 0}
                  icon={UserCheck}
                  iconClassName={stats?.pendingAdminCount && stats.pendingAdminCount > 0 ? "bg-blue-500/20 text-blue-600 animate-pulse" : "bg-card/50 text-muted-foreground"}
                  href="/dashboard/superadmin/admins"
                  className={stats?.pendingAdminCount && stats.pendingAdminCount > 0 ? "border-blue-500/20 bg-blue-500/[0.04]" : "bg-card/30"}
                />
                <StatCard
                  title="HR Recruiter KYC"
                  value={stats?.pendingHrCount || 0}
                  icon={UserCog}
                  iconClassName={stats?.pendingHrCount && stats.pendingHrCount > 0 ? "bg-purple-500/20 text-purple-600 animate-pulse" : "bg-card/50 text-muted-foreground"}
                  href="/dashboard/superadmin/hr"
                  className={stats?.pendingHrCount && stats.pendingHrCount > 0 ? "border-purple-500/20 bg-purple-500/[0.04]" : "bg-card/30"}
                />
              </div>
            </section>
          </div>

          {/* Sidebar Column: Quick Actions & Alerts */}
          <div className="space-y-8">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common platform management tasks.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid divide-y divide-border/50">
                  <Link href="/dashboard/superadmin/hr" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <UserCog className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Review HR Recruiters</p>
                        <p className="text-xs text-muted-foreground">Approve or audit accounts</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/dashboard/superadmin/admins" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Manage Admins</p>
                        <p className="text-xs text-muted-foreground">Adjust permissions</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/dashboard/superadmin/settings" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Settings className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">System Settings</p>
                        <p className="text-xs text-muted-foreground">API Keys and Webhooks</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href="/dashboard/superadmin/health"
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">System Health</p>
                        <p className="text-xs text-muted-foreground">Monitor platform status</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-destructive/5 overflow-hidden">
              <CardHeader className="pb-3 border-b border-destructive/10">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <ShieldOff className="h-5 w-5" />
                  Restricted Users
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-4xl font-bold text-destructive">{stats?.blockedUsers || 0}</div>
                <p className="text-sm text-muted-foreground italic">Users currently blocked or disabled for policy violations.</p>
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 border-destructive/20">
                  Review Restrictions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
