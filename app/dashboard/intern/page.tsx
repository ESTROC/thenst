"use client";
 
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Users, FileText, Shield, CheckCircle2, Clock, ArrowRight, BadgeCheck, Building, Search, Sparkles, Filter, RefreshCw, Star } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInternDashboardStats, getUsersByRole } from "@/lib/firestore";
import type { DashboardStats, UserProfile } from "@/lib/types";
import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { SubscriptionModal } from "@/components/subscription-modal";
 
export default function InternDashboard() {
  const { profile } = useAuth();
  const [showSubscription, setShowSubscription] = useState(false);
  const [stats, setStats] = useState<Partial<DashboardStats> | null>(null);
  const [guards, setGuards] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
 
  // Offline Guard Matcher State
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [minExp, setMinExp] = useState(0);
 
  async function fetchData() {
    try {
      const [statsData, guardsData] = await Promise.all([
        getInternDashboardStats(),
        getUsersByRole("guard")
      ]);
      setStats(statsData);
      setGuards(guardsData.filter(g => g.status === "active"));
    } catch (error) {
      console.error("Error fetching intern dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
 
  useEffect(() => {
    fetchData();
  }, []);
 
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };
 
  // Extract unique cities for the matching tool dropdown
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    guards.forEach(g => {
      if (g.preferredCity) cities.add(g.preferredCity);
    });
    return Array.from(cities).sort();
  }, [guards]);
 
  // Filter active guards in-memory
  const matchedGuards = useMemo(() => {
    return guards.filter(g => {
      const matchesSearch = searchQuery === "" || 
        g.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (g.skills && g.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesCity = cityFilter === "all" || g.preferredCity === cityFilter;
      
      const matchesExp = (g.yearsOfExperience || 0) >= minExp;
 
      return matchesSearch && matchesCity && matchesExp;
    });
  }, [guards, searchQuery, cityFilter, minExp]);
 
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading intern operations...</p>
        </div>
      </div>
    );
  }
 
  return (
    <RoleGuard allowedRoles={['intern']}>
      <div className="flex flex-col gap-8 pb-10">
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-600 to-blue-800 p-8 md:p-10 shadow-lg">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-white/20 text-white shadow-sm">
                <Sparkles className="h-4 w-4 text-cyan-200" />
                <span>Operational Support & Matching</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white max-w-xl mx-auto md:mx-0">
                Intern <span className="font-light opacity-90">Support Desk</span>
              </h1>
              <p className="text-cyan-50/90 text-sm md:text-base max-w-lg font-medium leading-relaxed mx-auto md:mx-0">
                Access the security workforce registry, active job listings, and onboarded agencies. Assist admins by managing job requests and matching verified guards.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Button size="lg" className="rounded-2xl bg-white text-cyan-900 hover:bg-slate-50 shadow-md font-bold px-8 h-12 border-none" asChild>
                <Link href="/dashboard/intern/jobs">
                  Job Registry <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                onClick={() => setShowSubscription(true)}
                className="rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white shadow-md font-bold px-8 h-12 border border-cyan-400/30"
              >
                View Plans <Sparkles className="ml-2 h-5 w-5 text-cyan-200" />
              </Button>
            </div>
          </div>
        </div>
 
        {/* Core Stats grid */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Assigned Registry Categories</h2>
              <p className="text-sm text-muted-foreground">General platform overview and statistics</p>
            </div>
          </div>
 
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Available Credits" 
              value={profile?.credits || 0} 
              icon={Sparkles} 
              iconClassName="bg-amber-50 text-amber-600"
              onClick={() => setShowSubscription(true)}
              className="bg-white border-slate-200 shadow-sm hover:border-amber-500/30 transition-all" 
            />
            <StatCard 
              title="Active Security Professionals" 
              value={stats?.verifiedGuards || 0} 
              icon={Shield} 
              href="/dashboard/intern/guards" 
              className="bg-white border-slate-200 shadow-sm hover:border-cyan-500/30 transition-all" 
            />
            <StatCard 
              title="Active Agencies" 
              value={stats?.verifiedAgencies || 0} 
              icon={Building} 
              href="/dashboard/intern/agencies" 
              className="bg-white border-slate-200 shadow-sm hover:border-cyan-500/30 transition-all" 
            />
            <StatCard 
              title="Workforce Placed Successfully" 
              value={stats?.totalPlacements || 0} 
              icon={CheckCircle2} 
              iconClassName="bg-emerald-50 text-emerald-600"
              href="/dashboard/intern/history"
              className="bg-white border-slate-200 shadow-sm hover:border-cyan-500/30 transition-all" 
            />
          </div>
        </section>
 
        {/* Offline Guard Matcher - Full Width Area */}
        <Card className="border-slate-200 bg-white/50 backdrop-blur-sm overflow-hidden rounded-[1.5rem]">
              <CardHeader className="bg-gradient-to-r from-slate-55/10 to-transparent border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-cyan-600" />
                      Offline Guard Matcher
                    </CardTitle>
                    <CardDescription>Match active security professionals with corporate requisitions</CardDescription>
                  </div>
                  <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-none font-bold uppercase tracking-wider text-[9px] px-2.5 py-1">
                    {matchedGuards.length} Matches
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                
                {/* Search & Filters */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="search" className="text-xs font-bold text-slate-500 uppercase pl-1">Name / Skill Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="search"
                        placeholder="Search name, skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-11 rounded-xl bg-white border-slate-200"
                      />
                    </div>
                  </div>
 
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="city" className="text-xs font-bold text-slate-500 uppercase pl-1">Preferred Location</Label>
                    <select
                      id="city"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                    >
                      <option value="all">All Cities</option>
                      {uniqueCities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
 
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="minExp" className="text-xs font-bold text-slate-500 uppercase pl-1">Min Experience (Years)</Label>
                    <select
                      id="minExp"
                      value={minExp}
                      onChange={(e) => setMinExp(Number(e.target.value))}
                      className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                    >
                      <option value={0}>Any Experience</option>
                      <option value={1}>1+ Years</option>
                      <option value={3}>3+ Years</option>
                      <option value={5}>5+ Years</option>
                      <option value={8}>8+ Years</option>
                    </select>
                  </div>
                </div>
 
                {/* Match Results */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {matchedGuards.length > 0 ? (
                    matchedGuards.map(g => (
                      <div key={g.uid} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-cyan-500/20 hover:shadow-md transition-all gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                            <AvatarImage src={g.photoUrl} alt={g.fullName} />
                            <AvatarFallback className="bg-cyan-50 text-cyan-600 font-bold">
                              {g.fullName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{g.fullName}</span>
                              {g.yearsOfExperience && g.yearsOfExperience >= 5 && (
                                <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border border-yellow-200/50 flex items-center gap-0.5 text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5">
                                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                  Elite
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                              <span>Exp: <b className="text-slate-700">{g.yearsOfExperience || 0} Years</b></span>
                              <span>•</span>
                              <span>Location: <b className="text-slate-700">{g.preferredCity || "Any"}</b></span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {g.skills && g.skills.slice(0, 3).map(skill => (
                                <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-600 border-none font-semibold text-[9px] rounded-lg px-2">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Button size="sm" variant="outline" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold" asChild>
                            <Link href={`/dashboard/intern/guards?search=${g.fullName}`}>
                              View Full Profile
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Filter className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="font-bold text-slate-700">No active professionals match your filters</p>
                      <p className="text-xs text-muted-foreground mt-1">Try broadening your search criteria or resetting filters.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <SubscriptionModal 
                open={showSubscription} 
                onOpenChange={setShowSubscription} 
                onSuccess={() => window.location.reload()}
            />
      </div>
    </RoleGuard>
  );
}
