"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db, storage } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, orderBy, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, IndianRupee, Users, Loader2, Plus, Clock, Edit, Power, PowerOff, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Job } from "@/lib/types";
import { Country, State, City } from "country-state-city";

const SECURITY_SECTORS = [
  {
    category: "Manned Guarding (Physical Security)",
    roles: ["Unarmed Security Guard", "Armed Security Guard (PSO)", "Bouncer / VIP Protection", "Ex-Servicemen (ESM) Guard", "Female Security Officer", "Event Security Personnel", "Traffic / Parking Marshal", "Dog Handler (K9 Unit)", "Other"]
  },
  {
    category: "Electronic & Tech Security",
    roles: ["CCTV / Command Center Operator", "Drone Pilot (Surveillance)", "X-Ray Baggage Scanner Operator", "Access Control Administrator", "Alarm Response Officer", "Other"]
  },
  {
    category: "Specialized & Corporate Security",
    roles: ["Corporate Security Manager", "Fire Safety Officer", "Quick Response Team (QRT)", "Loss Prevention Officer (Retail)", "Industrial / Factory Security Officer", "Other"]
  },
  {
    category: "Cyber Security & Intelligence",
    roles: ["Cyber Security Analyst", "Threat Intelligence Expert", "Digital Forensics Investigator", "Penetration Tester", "Other"]
  },
  {
    category: "Investigation & Consulting",
    roles: ["Private Investigator", "Background Verification Officer", "Security Auditor / Risk Assessor", "PSARA Compliance Consultant", "Other"]
  },
  {
    category: "Other",
    roles: ["Other"]
  }
];

export default function HRJobsPage() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Job Form State
  const [description, setDescription] = useState("");
  const [salary, setSalary] = useState("");
  const [type, setType] = useState("Full-time");
  const [requirements, setRequirements] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

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

  function handleOpenModalForNew() {
    setEditingJob(null);
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
    setIsModalOpen(true);
  }

  function openEditModal(job: Job) {
    setEditingJob(job);
    setDescription(job.description);
    setSalary(job.salary);
    setType(job.type);
    setRequirements(job.requirements ? job.requirements.join("\n") : "");
    setJobLocations(job.locations || []);
    setLocCountryCode("IN");
    setLocStateCode("");
    setLocSelectedCities([]);

    // Populate sector selection
    if (job.sector) {
      const isPredefinedSector = SECURITY_SECTORS.some(s => s.category === job.sector);
      if (isPredefinedSector) {
        setSelectedSector(job.sector);
        setCustomSector("");
      } else {
        setSelectedSector("Other");
        setCustomSector(job.sector.startsWith("Other: ") ? job.sector.replace("Other: ", "") : job.sector);
      }
    } else {
      setSelectedSector("");
      setCustomSector("");
    }

    // Populate role selection
    if (job.role) {
      const isPredefinedRole = SECURITY_SECTORS.some(s => s.roles.includes(job.role || ""));
      if (isPredefinedRole) {
        setSelectedRole(job.role);
        setCustomRole("");
      } else {
        setSelectedRole("Other");
        setCustomRole(job.role.startsWith("Other: ") ? job.role.replace("Other: ", "") : job.role);
      }
    } else {
      setSelectedRole("");
      setCustomRole("");
    }

    setIsModalOpen(true);
  }

  async function toggleJobStatus(job: Job) {
    try {
      const newStatus = job.status === "open" ? "closed" : "open";
      await updateDoc(doc(db, "jobs", job.id as string), { status: newStatus });
      toast.success(`Job successfully marked as ${newStatus}`);
    } catch(err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  }

  useEffect(() => {
    if (!profile || profile.role !== "hr") return;

    const q = query(
      collection(db, "jobs"),
      where("hrId", "==", profile.uid),
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
      toast.error("Failed to load jobs");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  async function handlePostJob(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
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

      if (jobLocations.length === 0) {
        toast.error("Please select at least one Location for the job.");
        setSubmitting(false);
        return;
      }

      const reqArray = requirements.split("\n").filter((r) => r.trim() !== "");
      const sectorToSave = selectedSector === "Other" ? (customSector ? `Other: ${customSector}` : "Other") : selectedSector;
      const roleToSave = selectedRole === "Other" ? (customRole ? `Other: ${customRole}` : "Other") : selectedRole;
      
      const cleanTitle = roleToSave.startsWith("Other: ") ? roleToSave.replace("Other: ", "") : roleToSave;
      const titleToSave = cleanTitle || (editingJob ? editingJob.title : "Security Specialist");
      const locationStringToSave = jobLocations.map(loc => `${loc.cities.join(", ")} (${loc.state})`).join(" | ");

      if (editingJob) {
        await updateDoc(doc(db, "jobs", editingJob.id as string), {
          title: titleToSave,
          description,
          location: locationStringToSave,
          locations: jobLocations,
          salary,
          type,
          requirements: reqArray.length > 0 ? reqArray : [description.slice(0, 50)],
          sector: sectorToSave,
          role: roleToSave,
          ...(pdfUrl && { pdfUrl }),
          updatedAt: new Date().toISOString()
        });
        toast.success("Job updated successfully!");
      } else {
        const newJob: Omit<Job, "id"> = {
          hrId: profile.uid,
          hrName: profile.fullName,
          companyName: profile.companyDetails?.name || "Company",
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
        toast.success("Job posted successfully!");
      }
      
      setIsModalOpen(false);

    } catch (err: any) {
      console.error("Database Error:", err);
      toast.error(`Database Error: ${err.message || "Failed to post job"}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Job Board</h1>
          <p className="text-muted-foreground mt-1">Manage your active job postings and view applicants.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setEditingJob(null);
        }}>
          <Button onClick={handleOpenModalForNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? "Edit Job Listing" : "Create a Job Listing"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePostJob} className="space-y-4 mt-4">
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
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Night Shift">Night Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Job Description</Label>
                <Textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the responsibilities and working environment..." />
              </div>
              <div className="space-y-2">
                <Label>Requirements (One per line)</Label>
                <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} placeholder="Minimum 2 years experience&#10;Valid arms license..." />
              </div>
              <div className="space-y-2">
                <Label>Upload JD (Optional PDF)</Label>
                <Input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-muted-foreground mt-1">Attach a detailed Job Description document (Max 5MB).</p>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingJob ? "Save Changes" : "Publish Job")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {jobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 bg-white/5 border-dashed">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2 text-foreground">No Jobs Posted</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            You haven't created any job listings yet. Post a job to start receiving applications from top-tier security professionals.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Post Your First Job</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${job.status === "open" ? "bg-green-500" : "bg-zinc-500"}`} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={job.status === "open" ? "default" : "secondary"} className={job.status === "open" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : ""}>
                    {job.status === "open" ? "Active" : "Closed"}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg line-clamp-1">{job.title}</CardTitle>
                
                {/* Sector and Role Badges */}
                {job.sector && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className="bg-cyan-50/50 text-cyan-700 border-cyan-100 text-[10px] font-bold px-2 py-0.5 max-w-full truncate">
                      {job.sector.startsWith("Other: ") ? job.sector.replace("Other: ", "") : job.sector}
                    </Badge>
                    {job.role && (
                      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold px-2 py-0.5 max-w-full truncate">
                        {job.role.startsWith("Other: ") ? job.role.replace("Other: ", "") : job.role}
                      </Badge>
                    )}
                  </div>
                )}

                <CardDescription className="flex items-center mt-2">
                  <MapPin className="w-3 h-3 mr-1" />
                  {job.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex items-center text-primary">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    {job.salary}
                  </div>
                  <div className="flex items-center text-zinc-500">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {job.type}
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <Link href={`/dashboard/hr/jobs/${job.id}`} className="block">
                    <Button variant="default" className="w-full flex items-center justify-between group bg-primary hover:bg-primary/90 text-primary-foreground">
                      View Applicants
                      <Users className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 p-4 border-t border-border flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(job)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button 
                  variant={job.status === "open" ? "destructive" : "secondary"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => toggleJobStatus(job)}
                >
                  {job.status === "open" ? (
                    <><PowerOff className="w-4 h-4 mr-2" /> Close Job</>
                  ) : (
                    <><Power className="w-4 h-4 mr-2" /> Reopen Job</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
