"use client";
 
import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllHiredRequests } from "@/lib/firestore";
import type { HiringRequest } from "@/lib/types";
import { Search, BadgeCheck, Users, Briefcase, FilterX } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
 
export default function InternHistoryPage() {
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<HiringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
 
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllHiredRequests();
        setRequests(data);
        setFilteredRequests(data);
      } catch (error) {
        console.error("Error fetching hiring history:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
 
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRequests(requests);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = requests.filter(req => 
      req.companyName?.toLowerCase().includes(lower) ||
      req.guardName?.toLowerCase().includes(lower) ||
      req.hrName?.toLowerCase().includes(lower)
    );
    setFilteredRequests(filtered);
  }, [searchTerm, requests]);
 
  const totalDeployments = filteredRequests.reduce((acc, req) => acc + (req.isBulk ? (req.bulkCount || 0) : 1), 0);
  const agencyDeployments = filteredRequests.filter(req => req.isBulk).reduce((acc, req) => acc + (req.bulkCount || 0), 0);
  const individualHires = filteredRequests.filter(req => !req.isBulk).length;
 
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading global deployment history...</p>
        </div>
      </div>
    );
  }
 
  return (
    <RoleGuard allowedRoles={['intern']}>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-10">
        <div>
          <Link href="/dashboard/intern" className="text-sm text-muted-foreground flex items-center gap-2 mb-4 hover:text-cyan-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BadgeCheck className="h-8 w-8 text-cyan-600" />
            Platform Hiring History
          </h1>
          <p className="text-muted-foreground mt-2">Comprehensive record of all successful individual and agency hires.</p>
        </div>
 
        {/* Top Level Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Professionals Deployed</CardTitle>
              <Users className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-600">{totalDeployments}</div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agency Fulfillments (Bulk)</CardTitle>
              <Briefcase className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{agencyDeployments}</div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Individual Hires</CardTitle>
              <Users className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{individualHires}</div>
            </CardContent>
          </Card>
        </div>
 
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Deployment Records</CardTitle>
                <CardDescription>All finalized hiring transactions</CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search company, HR, or agency..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FilterX className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No records found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2">
                  No deployments match your current search criteria.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider / Candidate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Count</TableHead>
                    <TableHead>Client Company</TableHead>
                    <TableHead>Recruiter</TableHead>
                    <TableHead>Finalized Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {req.isBulk ? (req.guardName || "Security Agency") : req.guardName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={req.isBulk ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}>
                          {req.isBulk ? "Agency" : "Individual"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {req.isBulk ? (req.bulkCount || 0) : 1}
                      </TableCell>
                      <TableCell>{req.companyName}</TableCell>
                      <TableCell>{req.hrName}</TableCell>
                      <TableCell>{new Date(req.updatedAt || req.createdAt).toLocaleDateString()}</TableCell>
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
