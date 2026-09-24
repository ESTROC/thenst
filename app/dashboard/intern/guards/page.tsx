"use client";
 
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Download, Filter, Star, ShieldAlert, CheckCircle, RefreshCw, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/role-guard";
 
export default function InternGuardsPage() {
  const [guards, setGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [minExp, setMinExp] = useState(0);
  const [minHeight, setMinHeight] = useState(0);
 
  async function loadGuards() {
    try {
      const q = query(collection(db, "users"), where("role", "==", "guard"), where("status", "==", "active"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setGuards(data);
    } catch (err) {
      console.error("Failed to load guards:", err);
      toast.error("Failed to load active security professionals");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
 
  useEffect(() => {
    loadGuards();
  }, []);
 
  const handleRefresh = () => {
    setRefreshing(true);
    loadGuards();
  };
 
  // Extract unique cities
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    guards.forEach(g => {
      if (g.preferredCity) cities.add(g.preferredCity);
    });
    return Array.from(cities).sort();
  }, [guards]);
 
  // Filter active guards
  const filteredGuards = useMemo(() => {
    return guards.filter(g => {
      const matchesSearch = searchQuery === "" || 
        g.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (g.skills && g.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        g.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCity = cityFilter === "all" || g.preferredCity === cityFilter;
      
      const matchesExp = (g.yearsOfExperience || 0) >= minExp;
 
      // Height parsing (e.g. "5.8" or 5.8)
      const guardHeight = g.height ? parseFloat(g.height) : 0;
      const matchesHeight = guardHeight >= minHeight;
 
      return matchesSearch && matchesCity && matchesExp && matchesHeight;
    });
  }, [guards, searchQuery, cityFilter, minExp, minHeight]);
 
  // CSV Export Utility
  const handleExportCSV = () => {
    if (filteredGuards.length === 0) {
      toast.error("No professionals found matching the current filters!");
      return;
    }
 
    const headers = ["Full Name", "Email", "Phone", "City", "Experience (Years)", "Height (Ft)", "Weight (Kg)", "Skills", "Availability"];
    
    const rows = filteredGuards.map(g => [
      g.fullName,
      g.email,
      g.phone || "-",
      g.preferredCity || "-",
      g.yearsOfExperience || "0",
      g.height ? `${g.height} ft` : "-",
      g.weight ? `${g.weight} kg` : "-",
      g.skills ? g.skills.join(", ") : "-",
      g.availabilityStatus || "Available"
    ]);
 
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");
 
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `active_guards_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV directory successfully downloaded!");
  };
 
  // Check url params for query search
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const search = params.get("search");
      if (search) {
        setSearchQuery(search);
      }
    }
  }, []);
 
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }
 
  return (
    <RoleGuard allowedRoles={['intern']}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Security Professionals Directory</h1>
            <p className="text-muted-foreground mt-1">Review onboarded, verified, and active workforce personnel records.</p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Button onClick={handleExportCSV} className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md border-none font-bold gap-2">
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
            <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl border-slate-200 hover:bg-slate-50 shrink-0">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
 
        {/* Search & Filters */}
        <div className="grid gap-4 md:grid-cols-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
          {/* Search bar */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search name, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-white border-slate-200 w-full"
            />
          </div>
 
          {/* City select */}
          <div className="flex flex-col gap-1.5">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
            >
              <option value="all">All Locations</option>
              {uniqueCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
 
          {/* Experience Select */}
          <div className="flex flex-col gap-1.5">
            <select
              value={minExp}
              onChange={(e) => setMinExp(Number(e.target.value))}
              className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
            >
              <option value={0}>Any Experience</option>
              <option value={1}>1+ Years</option>
              <option value={3}>3+ Years</option>
              <option value={5}>5+ Years</option>
              <option value={8}>8+ Years</option>
            </select>
          </div>
 
          {/* Height Select */}
          <div className="flex flex-col gap-1.5">
            <select
              value={minHeight}
              onChange={(e) => setMinHeight(Number(e.target.value))}
              className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
            >
              <option value={0}>Any Height</option>
              <option value={5.5}>5.5 ft or taller</option>
              <option value={5.8}>5.8 ft or taller</option>
              <option value={6.0}>6.0 ft or taller</option>
            </select>
          </div>
        </div>
 
        {/* Guards Grid */}
        {filteredGuards.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-16 bg-white border-dashed border-slate-200">
            <Users className="h-12 w-12 text-slate-400 mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2 text-slate-700">No Guards Registered</h3>
            <p className="text-muted-foreground text-center max-w-sm text-sm">
              Currently there are no active security professionals matching your filters.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredGuards.map((g) => (
              <Card key={g.uid} className="hover:shadow-lg hover:border-cyan-500/20 transition-all border-slate-200 flex flex-col rounded-2xl overflow-hidden bg-white">
                <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-slate-250 shadow-sm">
                        <AvatarImage src={g.photoUrl} alt={g.fullName} />
                        <AvatarFallback className="bg-cyan-50 text-cyan-600 font-black">
                          {g.fullName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 text-base flex items-center gap-1">
                          {g.fullName}
                          {g.yearsOfExperience && g.yearsOfExperience >= 5 && (
                            <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border border-yellow-200/50 flex items-center gap-0.5 text-[8px] font-black uppercase px-1 py-0">
                              <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                              PRO
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 text-slate-400">
                          {g.preferredCity || "Location Not Selected"}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-250/50 font-bold uppercase tracking-wider text-[8px] px-2 py-0.5">
                      {g.availabilityStatus || "Available"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 flex-1 flex flex-col gap-4">
                  {/* Detailed Specs */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-center">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Exp</span>
                      <p className="text-sm font-extrabold text-slate-700">{g.yearsOfExperience || "0"} Yrs</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Height</span>
                      <p className="text-sm font-extrabold text-slate-700">{g.height ? `${g.height} ft` : "-"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Weight</span>
                      <p className="text-sm font-extrabold text-slate-700">{g.weight ? `${g.weight} kg` : "-"}</p>
                    </div>
                  </div>
 
                  {/* Skills tags */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase pl-0.5 block mb-1">Core Competences</span>
                    <div className="flex flex-wrap gap-1.5">
                      {g.skills && g.skills.length > 0 ? (
                        g.skills.slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-600 border-none font-semibold text-[9px] rounded-lg px-2">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No skills listed</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Details Button */}
                  <div className="pt-4 border-t border-slate-50 mt-auto">
                    <Link href={`/dashboard/intern/guards/${g.uid}`} className="block w-full">
                      <Button variant="default" className="w-full h-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-sm">
                        View Profile & Contact
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
