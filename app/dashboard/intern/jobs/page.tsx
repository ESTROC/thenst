"use client";
 
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db, storage } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, MapPin, IndianRupee, Users, Loader2, Clock, Building, Plus, Search, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Job, UserProfile } from "@/lib/types";
import { getUsersByRole } from "@/lib/firestore";
import { RoleGuard } from "@/components/role-guard";
import { Country, State, City } from "country-state-city";

const SECURITY_SECTORS = [
  {
    category: "Manned Guarding",
    roles: ["Security Guard (Unarmed)", "Armed Security Guard", "Personal Security Officer (PSO)", "Bouncer", "Executive Protection Specialist", "Other"]
  },
  {
    category: "Cash Logistics & Transit",
    roles: ["Cash Van Security Guard", "ATM Custodian", "Transit Escort Officer", "Other"]
  },
  {
    category: "Electronic & Tech Security",
    roles: ["CCTV Control Room Operator", "Command Centre Supervisor", "Security Systems Installer", "Other"]
  },
  {
    category: "Event & Crowd Control",
    roles: ["Crowd Controller", "VIP Escort Guard", "Event Security Coordinator", "Other"]
  },
  {
    category: "Fire & Safety Services",
    roles: ["Fire Safety Marshal", "Industrial Safety Officer", "Emergency Response Team Member", "Other"]
  },
  {
    category: "Other Services",
    roles: ["Other"]
  }
];
 
export default function InternJobsPage() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Post Job Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [salary, setSalary] = useState("");
  const [type, setType] = useState("Full-time");
  const [requirements, setRequirements] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
 
  // Security Sectors & Roles state
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [customSector, setCustomSector] = useState("");
  const [customRole, setCustomRole] = useState("");

  // Sub-country location state (identical to agency KYC)
  const [jobLocations, setJobLocations] = useState<{ country?: string; state: string; cities: string[] }[]>([]);
  const [locCountryCode, setLocCountryCode] = useState("IN");
  const [locStateCode, setLocStateCode] = useState("");
  const [locSelectedCities, setLocSelectedCities] = useState<string[]>([]);
 
  // Global Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
 
  useEffect(() => {
    // Verified Interns only
    if (!profile || profile.role !== "intern") return;
 
    // Fetch ALL jobs
    const jobsQuery = query(
      collection(db, "jobs"),
      orderBy("createdAt", "desc")
    );
 
    const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
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
 
  // Handle Job Post submission under the company name TheNST
  async function handlePostJobOnBehalf(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (jobLocations.length === 0) {
      toast.error("Please select at least one Location for the job.");
      return;
    }
 
    setSubmitting(true);
 
    try {
      let pdfUrl = undefined;
      
      if (pdfFile) {
        if (pdfFile.size > 5 * 1024 * 1024) {
          toast.error("PDF must be less than 5MB");
          setSubmitting(false);
          return;
        }

        try {
          const fileRef = ref(storage, `jobs/${profile.uid}_${Date.now()}.pdf`);
          await uploadBytes(fileRef, pdfFile);
          pdfUrl = await getDownloadURL(fileRef);
        } catch (uploadErr: any) {
          console.error("PDF Upload Error:", uploadErr);
          toast.error(`Error: ${uploadErr.message || "Failed to upload PDF"}`);
          setSubmitting(false);
          return;
        }
      }

      const reqArray = requirements.split("\n").filter((r) => r.trim() !== "");
      const sectorToSave = selectedSector === "Other" ? (customSector ? `Other: ${customSector}` : "Other") : selectedSector;
      const roleToSave = selectedRole === "Other" ? (customRole ? `Other: ${customRole}` : "Other") : selectedRole;
      
      const cleanTitle = roleToSave.startsWith("Other: ") ? roleToSave.replace("Other: ", "") : roleToSave;
      const titleToSave = cleanTitle || "Security Specialist";
      const locationStringToSave = jobLocations.map(loc => `${loc.cities.join(", ")} (${loc.state})`).join(" | ");
 
      const newJob = {
        hrId: profile.uid,
        hrName: profile.fullName || "TheNST Intern",
        companyName: "TheNST",
        title: titleToSave,
        description,
        location: locationStringToSave,
        locations: jobLocations,
        salary,
        type,
        requirements: reqArray.length > 0 ? reqArray : [description.slice(0, 50)],
        sector: sectorToSave,
        role: roleToSave,
        status: "open",
        ...(pdfUrl && { pdfUrl }),
        createdAt: new Date().toISOString(),
      };
 
      await addDoc(collection(db, "jobs"), newJob);
      toast.success(`Job successfully posted under TheNST!`);
      
      // Reset State
      setIsModalOpen(false);
      setDescription("");
      setSalary("");
      setType("Full-time");
      setRequirements("");
      setPdfFile(null);
      setSelectedSector("");
      setSelectedRole("");
      setCustomSector("");
      setCustomRole("");
      setJobLocations([]);
      setLocCountryCode("IN");
      setLocStateCode("");
      setLocSelectedCities([]);
    } catch (err: any) {
      console.error("Failed to post job:", err);
      toast.error(`Error: ${err.message || "Failed to post job"}`);
    } finally {
      setSubmitting(false);
    }
  }
 
  // Check url params to auto-open modal if coming from quick action
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("post") === "true") {
        setIsModalOpen(true);
      }
    }
  }, []);
 
  // Filters logic
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = searchQuery === "" || 
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
 
    return matchesSearch && matchesStatus;
  });
 
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Job Listings</h1>
            <p className="text-muted-foreground mt-1">Monitor job requests and post listings under the company profile of TheNST.</p>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md border-none font-bold gap-2">
            <Plus className="h-4 w-4" />
            Post Job under TheNST
          </Button>
        </div>
 
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search title, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-white border-slate-200 w-full"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold w-full sm:w-[150px]"
            >
              <option value="all">All Statuses</option>
              <option value="open">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
 
        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-16 bg-white border-dashed border-slate-200">
            <Briefcase className="h-12 w-12 text-slate-400 mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2 text-slate-700">No Job Openings Found</h3>
            <p className="text-muted-foreground text-center max-w-sm text-sm">
              Try adjusting your filters or search terms.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg hover:border-cyan-500/20 transition-all border-slate-200 relative overflow-hidden flex flex-col rounded-2xl">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${job.status === "open" ? "bg-cyan-500" : "bg-slate-400"}`} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={job.status === "open" ? "default" : "secondary"} className={job.status === "open" ? "bg-cyan-500/10 text-cyan-600 border-cyan-200" : ""}>
                      {job.status === "open" ? "Active" : "Closed"}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center font-medium">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1">{job.title}</CardTitle>
                  <CardDescription className="flex items-center mt-1 text-slate-600 font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                    <Building className="w-3.5 h-3.5 mr-1 shrink-0 text-slate-400" />
                    {job.companyName} <span className="font-medium text-slate-400 ml-1">({job.hrName})</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
                    <div className="flex items-center text-slate-500">
                      <MapPin className="w-4 h-4 mr-1 shrink-0 text-slate-400" />
                      <span className="truncate max-w-[120px]">{job.location}</span>
                    </div>
                    <div className="flex items-center text-cyan-600">
                      <IndianRupee className="w-4 h-4 mr-1 shrink-0 text-cyan-500" />
                      {job.salary}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 mt-auto">
                    <Link href={`/dashboard/intern/jobs/${job.id}`} className="block">
                      <Button variant="secondary" className="w-full flex items-center justify-between group rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 font-bold">
                        Monitor Applications
                        <Users className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
 
        {/* Post Job On Behalf Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6">
            <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
              <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Building className="h-6 w-6 text-cyan-600" />
                Post Job Listing under TheNST
              </DialogTitle>
              <CardDescription>Create a job listing directly under the company profile of TheNST.</CardDescription>
            </DialogHeader>
 
            <form onSubmit={handlePostJobOnBehalf} className="space-y-5 mt-4">
              
              {/* Security Sector & Role Selects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                <div className="space-y-2">
                  <Label>Security Sector / Specialty</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 font-semibold cursor-pointer"
                    value={selectedSector}
                    onChange={(e) => {
                      setSelectedSector(e.target.value);
                      setSelectedRole("");
                      setCustomSector("");
                      setCustomRole("");
                    }}
                    required
                  >
                    <option value="">-- Select Specialty Category --</option>
                    {SECURITY_SECTORS.map((s) => (
                      <option key={s.category} value={s.category}>
                        {s.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Security Role</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 font-semibold cursor-pointer"
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value);
                      setCustomRole("");
                    }}
                    disabled={!selectedSector}
                    required
                  >
                    <option value="">-- Select Specific Role --</option>
                    {selectedSector &&
                      SECURITY_SECTORS.find((s) => s.category === selectedSector)?.roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Custom Sector Input */}
                {selectedSector === "Other" && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Custom Specialty Sector Name</Label>
                    <Input
                      required
                      value={customSector}
                      onChange={(e) => setCustomSector(e.target.value)}
                      placeholder="e.g. Maritime Harbor Security"
                    />
                  </div>
                )}

                {/* Custom Role Input */}
                {selectedRole === "Other" && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Custom Professional Role Title</Label>
                    <Input
                      required
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="e.g. Tactical Response Agent"
                    />
                  </div>
                )}
              </div>

              {/* Job Locations list (pan-world/pan-country/sub-city) */}
              <div className="space-y-4 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                <div>
                  <Label className="font-semibold text-slate-800 text-sm">Job Posting Locations <span className="text-destructive">*</span></Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Define where the security professionals will be posted.</p>
                </div>

                {jobLocations.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {jobLocations.map((loc, idx) => (
                        <div key={idx} className="inline-flex items-center gap-1.5 bg-cyan-50/80 border border-cyan-100 text-cyan-800 text-xs font-semibold px-2.5 py-1 rounded-xl shadow-sm">
                          <span>{loc.cities.join(", ")} ({loc.state})</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...jobLocations];
                              updated.splice(idx, 1);
                              setJobLocations(updated);
                            }}
                            className="text-cyan-600 hover:text-cyan-800 focus:outline-none"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/50">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Country</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 font-medium cursor-pointer"
                      value={locCountryCode}
                      onChange={(e) => {
                        setLocCountryCode(e.target.value);
                        setLocStateCode("");
                        setLocSelectedCities([]);
                      }}
                    >
                      {Country.getAllCountries().map((country) => (
                        <option key={country.isoCode} value={country.isoCode}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">State</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 font-medium cursor-pointer"
                      value={locStateCode}
                      onChange={(e) => {
                        setLocStateCode(e.target.value);
                        setLocSelectedCities([]);
                      }}
                    >
                      <option value="">-- Select State --</option>
                      {locCountryCode &&
                        State.getStatesOfCountry(locCountryCode).map((state) => (
                          <option key={state.isoCode} value={state.isoCode}>
                            {state.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cities</Label>
                    <select
                      multiple
                      className="flex h-[80px] w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 font-medium cursor-pointer"
                      value={locSelectedCities}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, (option) => option.value);
                        setLocSelectedCities(values);
                      }}
                      disabled={!locStateCode}
                    >
                      {locStateCode &&
                        City.getCitiesOfState(locCountryCode, locStateCode).map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="sm:col-span-3 text-xs h-8 border-dashed border-cyan-500/30 text-cyan-600 hover:bg-cyan-50/50"
                    disabled={!locStateCode || locSelectedCities.length === 0}
                    onClick={() => {
                      const countryName = Country.getCountryByCode(locCountryCode)?.name || "";
                      const stateName = State.getStateByCodeAndCountry(locStateCode, locCountryCode)?.name || "";
                      const existingIndex = jobLocations.findIndex(
                        (s) => s.state === stateName && s.country === countryName
                      );
                      if (existingIndex >= 0) {
                        const updated = [...jobLocations];
                        const combinedCities = Array.from(
                          new Set([...updated[existingIndex].cities, ...locSelectedCities])
                        );
                        updated[existingIndex].cities = combinedCities;
                        setJobLocations(updated);
                      } else {
                        setJobLocations([
                          ...jobLocations,
                          { country: countryName, state: stateName, cities: locSelectedCities },
                        ]);
                      }
                      setLocStateCode("");
                      setLocSelectedCities([]);
                    }}
                  >
                    + Add Posting Location
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Expected Salary / Wage</Label>
                  <Input required value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. ₹25,000/month" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-bold text-slate-600">Employment Type</Label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Night Shift">Night Shift</option>
                  </select>
                </div>
              </div>
 
              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-600">Operational Description</Label>
                <Textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline shift timings, primary duties, and site location..."
                  className="rounded-xl bg-white border-slate-200"
                />
              </div>
 
              {/* Requirements */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-600">Qualifications & Requirements (One per line)</Label>
                <Textarea
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g. Height: 5'8&quot; or above&#10;Experience: 2+ Years&#10;Ex-Servicemen Preferred"
                  className="rounded-xl bg-white border-slate-200"
                />
              </div>

              {/* Upload JD (Optional PDF) */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-600">Upload JD (Optional PDF)</Label>
                <Input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)} 
                  className="h-11 rounded-xl bg-white border-slate-200 file:mr-4 file:py-1 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                />
                <p className="text-xs text-muted-foreground">Attach a detailed Job Description document (Max 5MB).</p>
              </div>
 
              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold h-11 border-slate-200">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md border-none font-bold h-11 px-6">
                  {submitting ? "Publishing..." : "Publish Job Post"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
