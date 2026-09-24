"use client";
 
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Mail, CheckCircle, FileText, Calendar, Phone, Shield, Briefcase, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Job, JobApplication } from "@/lib/types";
import { RoleGuard } from "@/components/role-guard";

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
 
export default function InternJobApplicantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const handleToggleJobStatus = async () => {
    if (!job) return;
    if (job.hrId !== profile?.uid) {
      toast.error("You are only authorized to manage jobs created by yourself.");
      return;
    }
    setSubmittingStatus(true);
    try {
      const newStatus = job.status === "open" ? "closed" : "open";
      const docRef = doc(db, "jobs", job.id);
      await updateDoc(docRef, { status: newStatus });
      setJob((prev) => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Job successfully ${newStatus === "open" ? "reopened" : "closed"}!`);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(`Error: ${err.message || "Failed to update status"}`);
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Edit Job states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editType, setEditType] = useState("Full-time");
  const [editRequirements, setEditRequirements] = useState("");
  const [editSelectedSector, setEditSelectedSector] = useState("");
  const [editSelectedRole, setEditSelectedRole] = useState("");
  const [editCustomSector, setEditCustomSector] = useState("");
  const [editCustomRole, setEditCustomRole] = useState("");
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);

  // Prefill Edit Form
  const prefillEditForm = () => {
    if (!job) return;
    setEditDescription(job.description || "");
    setEditSalary(job.salary || "");
    setEditType(job.type || "Full-time");
    setEditRequirements(job.requirements?.join("\n") || "");
    
    // Sector parsing
    const s = job.sector || "";
    if (s.startsWith("Other: ")) {
      setEditSelectedSector("Other");
      setEditCustomSector(s.replace("Other: ", ""));
    } else if (SECURITY_SECTORS.some(sec => sec.category === s)) {
      setEditSelectedSector(s);
      setEditCustomSector("");
    } else {
      setEditSelectedSector("Other");
      setEditCustomSector(s);
    }

    // Role parsing
    const r = job.role || "";
    if (r.startsWith("Other: ")) {
      setEditSelectedRole("Other");
      setEditCustomRole(r.replace("Other: ", ""));
    } else {
      setEditSelectedRole(r);
      setEditCustomRole("");
    }

    setEditPdfFile(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    if (job.hrId !== profile?.uid) {
      toast.error("You are only authorized to manage jobs created by yourself.");
      return;
    }

    setEditSubmitting(true);
    try {
      let pdfUrl = job.pdfUrl || undefined;

      if (editPdfFile) {
        if (editPdfFile.size > 5 * 1024 * 1024) {
          toast.error("PDF must be less than 5MB");
          setEditSubmitting(false);
          return;
        }
        const fileRef = ref(storage, `jobs/${profile.uid}_${Date.now()}.pdf`);
        await uploadBytes(fileRef, editPdfFile);
        pdfUrl = await getDownloadURL(fileRef);
      }

      const reqArray = editRequirements.split("\n").filter((r) => r.trim() !== "");
      const sectorToSave = editSelectedSector === "Other" ? (editCustomSector ? `Other: ${editCustomSector}` : "Other") : editSelectedSector;
      const roleToSave = editSelectedRole === "Other" ? (editCustomRole ? `Other: ${editCustomRole}` : "Other") : editSelectedRole;
      
      const cleanTitle = roleToSave.startsWith("Other: ") ? roleToSave.replace("Other: ", "") : roleToSave;
      const titleToSave = cleanTitle || "Security Specialist";

      const docRef = doc(db, "jobs", job.id);
      const updatedFields = {
        title: titleToSave,
        description: editDescription,
        salary: editSalary,
        type: editType,
        requirements: reqArray.length > 0 ? reqArray : [editDescription.slice(0, 50)],
        sector: sectorToSave,
        role: roleToSave,
        ...(pdfUrl && { pdfUrl }),
      };

      await updateDoc(docRef, updatedFields);
      setJob((prev) => prev ? { ...prev, ...updatedFields } : null);
      toast.success("Job listing successfully updated!");
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error("Failed to update job listing:", err);
      toast.error(`Error: ${err.message || "Failed to update job"}`);
    } finally {
      setEditSubmitting(false);
    }
  };

  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  const handleUpdateApplicationStatus = async (appId: string, newStatus: "accepted" | "rejected") => {
    if (!job) return;
    if (job.hrId !== profile?.uid) {
      toast.error("You are not authorized to manage applications for this job.");
      return;
    }
    setUpdatingAppId(appId);
    try {
      const { doc, updateDoc, addDoc, collection } = await import("firebase/firestore");
      const appRef = doc(db, "job_applications", appId);
      await updateDoc(appRef, { status: newStatus });

      if (newStatus === "accepted") {
        const app = applications.find((a) => a.id === appId);
        if (app) {
          // Create Hiring Request (bridging to the Interview Pipeline)
          const newRequestData = {
            hrId: profile.uid,
            guardId: app.guardId,
            hrName: profile.fullName || "TheNST Intern",
            hrEmail: profile.email || "",
            guardName: app.guardName,
            guardEmail: app.guardEmail,
            companyName: job.companyName || "TheNST",
            status: "accepted",
            message: `Your job application for ${job.title} has been accepted by TheNST team. We are interested in your profile.`,
            createdAt: new Date().toISOString(),
            ...(app.agencyId && { agencyId: app.agencyId }),
          };

          const requestRef = await addDoc(collection(db, "hiring_requests"), newRequestData);

          // Create Chat Room & Notification
          const { createChatRoom, createNotification } = await import("@/lib/firestore");
          const roomId = await createChatRoom(requestRef.id, { ...newRequestData, id: requestRef.id } as any);
          await updateDoc(requestRef, { chatRoomId: roomId });

          // In-App Notification
          await createNotification(app.guardId, {
            title: "Application Accepted! 🎉",
            message: `TheNST has accepted your application for ${job.title}. Check your Job Offers to connect!`,
            type: "success"
          });
        }
      }

      toast.success(newStatus === "accepted" ? "Application accepted! Candidate added to Interview Pipeline." : "Application rejected.");
    } catch (err: any) {
      console.error("Failed to update application status:", err);
      toast.error(`Error: ${err.message || "Failed to update status"}`);
    } finally {
      setUpdatingAppId(null);
    }
  };

  useEffect(() => {
    if (!profile || profile.role !== "intern" || !id) return;
 
    async function loadJob() {
      try {
        const docRef = doc(db, "jobs", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setJob({ id: docSnap.id, ...docSnap.data() } as Job);
        } else {
          toast.error("Job not found");
          router.push(`/dashboard/intern/jobs`);
        }
      } catch (err) {
        toast.error("Error loading job details");
      }
    }
    loadJob();
  }, [id, profile, router]);
 
  useEffect(() => {
    if (!job) return;
 
    // Fetch all applications for this specific job
    const q = query(collection(db, "job_applications"), where("jobId", "==", job.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as JobApplication[];
      
      // Sort: Accepted first, then Pending, then Rejected
      data.sort((a, b) => {
        const order = { accepted: 0, reviewed: 1, pending: 2, rejected: 3 };
        const statusDiff = (order[a.status as keyof typeof order] || 2) - (order[b.status as keyof typeof order] || 2);
        if (statusDiff !== 0) return statusDiff;
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
      });
      
      setApplications(data);
      setLoading(false);
    }, (err) => {
      console.error("Failed to load applications:", err);
      toast.error("Failed to load applicants");
      setLoading(false);
    });
 
    return () => unsubscribe();
  }, [job]);
 
  if (loading || !job) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }
 
  const acceptedCount = applications.filter(app => app.status === "accepted").length;
 
  return (
    <RoleGuard allowedRoles={['intern']}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/intern/jobs`)} className="rounded-xl hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">{job.title}</h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">{job.companyName}</Badge>
              <span>•</span>
              <span className="text-slate-500">{job.location}</span>
              <span>•</span>
              <span className="text-cyan-600">{job.type}</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {job.pdfUrl && (
              <a href={job.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl font-bold border-slate-200">
                  <FileText className="w-4 h-4" /> View JD PDF
                </Button>
              </a>
            )}
            {job.hrId === profile?.uid && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prefillEditForm}
                  className="rounded-xl font-bold border-cyan-200 text-cyan-600 hover:bg-cyan-50 h-9 px-4 gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit Requisition
                </Button>
                <Button
                  variant={job.status === "open" ? "destructive" : "default"}
                  size="sm"
                  disabled={submittingStatus}
                  onClick={handleToggleJobStatus}
                  className={`rounded-xl font-bold shadow-sm h-9 px-4 ${
                    job.status === "open" ? "" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {submittingStatus ? "Processing..." : (job.status === "open" ? "❌ Close Job" : "✅ Reopen Job")}
                </Button>
              </>
            )}
          </div>
        </div>
 
        {/* Body content */}
        <div className="grid gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold text-slate-700">Workforce Requisitions Pipeline</h2>
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-250/50 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1">
              {acceptedCount} Placed by Company HR
            </Badge>
          </div>
 
          {applications.length === 0 ? (
            <Card className="p-16 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-center rounded-2xl">
              <Briefcase className="h-12 w-12 text-slate-400 mb-4 opacity-45 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">No Candidates Applied</h3>
              <p className="text-muted-foreground max-w-sm text-sm">
                No active security professionals have applied to this requisition board yet.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {applications.map((app) => (
                <Card key={app.id} className="relative overflow-hidden group rounded-2xl border-slate-200 bg-white hover:shadow-md transition-all">
                  <div className={`absolute top-0 left-0 w-1.5 h-full 
                    ${app.status === "pending" ? "bg-blue-500" : 
                      app.status === "accepted" ? "bg-emerald-500" : 
                      app.status === "rejected" ? "bg-red-500" : "bg-slate-400"}`} 
                  />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-black text-slate-800">{app.guardName}</CardTitle>
                      <Badge variant="outline" className={
                        app.status === "pending" ? "text-blue-500 border-blue-200 bg-blue-50/50 font-bold uppercase tracking-wider text-[9px]" :
                        app.status === "accepted" ? "text-emerald-700 border-emerald-200 bg-emerald-50/50 font-bold uppercase tracking-wider text-[9px]" :
                        "text-red-500 border-red-200 bg-red-50/50 font-bold uppercase tracking-wider text-[9px]"
                      }>
                        {app.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 font-medium text-xs">
                      <Calendar className="h-3 w-3" />
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm font-semibold text-slate-600">
                      <Mail className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                      {app.guardEmail}
                    </div>
 
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 w-full">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                        {app.status === "pending" && "Pending Action"}
                        {app.status === "accepted" && "Screened"}
                        {app.status === "rejected" && "Rejected"}
                      </div>
                      
                      <div className="flex gap-2">
                        {app.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingAppId !== null}
                              onClick={() => handleUpdateApplicationStatus(app.id, "rejected")}
                              className="rounded-xl border-red-200 text-red-650 hover:bg-red-50 text-xs px-3 font-semibold h-8"
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              disabled={updatingAppId !== null}
                              onClick={() => handleUpdateApplicationStatus(app.id, "accepted")}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 font-black h-8 shadow-sm"
                            >
                              {updatingAppId === app.id ? "Processing..." : "Accept"}
                            </Button>
                          </>
                        )}

                        {app.status === "accepted" && (
                          <div className="flex items-center gap-1 text-emerald-650 text-xs font-black tracking-widest uppercase bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5 fill-emerald-500 text-white" /> In Interview Pipeline
                          </div>
                        )}

                        {app.status === "rejected" && (
                          <div className="flex items-center gap-1 text-red-500 text-xs font-black tracking-widest uppercase">
                            Rejected
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Job Listing Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6">
            <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
              <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-cyan-600" />
                Edit Job Listing
              </DialogTitle>
              <DialogDescription>Modify the details of your posted job requisition under TheNST.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateJob} className="space-y-5 mt-4">
              
              {/* Security Sector & Role Selects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                <div className="space-y-2">
                  <Label>Security Sector / Specialty</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 font-semibold cursor-pointer"
                    value={editSelectedSector}
                    onChange={(e) => {
                      setEditSelectedSector(e.target.value);
                      setEditSelectedRole("");
                      setEditCustomSector("");
                      setEditCustomRole("");
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
                  <Label>Specific Operational Role</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 font-semibold cursor-pointer"
                    value={editSelectedRole}
                    onChange={(e) => {
                      setEditSelectedRole(e.target.value);
                      setEditCustomRole("");
                    }}
                    disabled={!editSelectedSector}
                    required
                  >
                    <option value="">-- Select Operational Role --</option>
                    {editSelectedSector &&
                      editSelectedSector !== "Other" &&
                      SECURITY_SECTORS.find((s) => s.category === editSelectedSector)?.roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    {editSelectedSector === "Other" && <option value="Other">Other</option>}
                  </select>
                </div>
              </div>

              {/* Custom fields if "Other" is selected */}
              {(editSelectedSector === "Other" || editSelectedRole === "Other") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-orange-50/30 border border-orange-100 p-4 rounded-2xl">
                  {editSelectedSector === "Other" && (
                    <div className="space-y-2">
                      <Label className="text-amber-800">Specify Custom Sector</Label>
                      <Input
                        placeholder="e.g. Maritime Security"
                        value={editCustomSector}
                        onChange={(e) => setEditCustomSector(e.target.value)}
                        required
                        className="border-amber-200"
                      />
                    </div>
                  )}
                  {editSelectedRole === "Other" && (
                    <div className="space-y-2">
                      <Label className="text-amber-800">Specify Custom Role</Label>
                      <Input
                        placeholder="e.g. Drone Patrol Pilot"
                        value={editCustomRole}
                        onChange={(e) => setEditCustomRole(e.target.value)}
                        required
                        className="border-amber-200"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-salary">Expected Monthly Payout (Salary)</Label>
                  <Input
                    id="edit-salary"
                    placeholder="e.g. ₹25,000 - ₹35,000 / Month"
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-type">Operational Posting Type</Label>
                  <select
                    id="edit-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 font-semibold cursor-pointer"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    required
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Night Shift">Night Shift / Guard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Operational Job Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Elaborate on operational duties, responsibilities, reporting times, patrol beats, and security protocols..."
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-requirements">Job Requirements / Mandatory Skills (One per line)</Label>
                <Textarea
                  id="edit-requirements"
                  placeholder="e.g. Height minimum 5'8&#34;&#10;Valid Gun License (For armed roles)&#10;Excellent communication skills..."
                  rows={3}
                  value={editRequirements}
                  onChange={(e) => setEditRequirements(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  Attach New Job Description PDF (Max 5MB - Optional)
                </Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setEditPdfFile(file);
                  }}
                  className="cursor-pointer file:font-semibold file:text-cyan-700 hover:file:text-cyan-800"
                />
                {job.pdfUrl && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current active PDF is attached. Uploading a new one will replace it.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editSubmitting}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold px-6 shadow-md"
                >
                  {editSubmitting ? "Saving Updates..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
