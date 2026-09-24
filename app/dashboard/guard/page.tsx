"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, CheckCircle2, Clock, XCircle, AlertCircle, Save, Mail, MessageCircle, Phone, Star, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { getKYC, updateGuardProfile, getGuardHiringRequests, updateHiringRequestStatus } from "@/lib/firestore";
import { uploadProfileImage, uploadResume } from "@/lib/storage";
import { compressAndConvertToBase64 } from "@/lib/image-utils";
import type { KYCData, HiringRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// ... imports

import { RoleGuard } from "@/components/role-guard";
import { GuardSubscriptionModal } from "@/components/guard-subscription-modal";

export default function GuardDashboard() {
  const { profile } = useAuth();
  const [kyc, setKyc] = useState<KYCData | null>(null);
  const [isSubModalOpen, setSubModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    photoUrl: "",
    resumeUrl: "",
    skills: "",
    yearsOfExperience: "",
    certifications: "",
    certificationUrls: [] as string[],
    languages: "",
    shiftPreference: "Any",
    height: "",
    weight: "",
    complexion: "",
    identifyingFeatures: "",
    availabilityStatus: "Actively Looking",
    preferredCity: "", // Added preferred city
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG).");
      return;
    }

    setUploading(true);
    try {
      // Try Firebase Storage first
      try {
        const downloadURL = await uploadProfileImage(file, profile.uid);
        setFormData(prev => ({ ...prev, photoUrl: downloadURL }));
        toast.success("Photo uploaded successfully!");
      } catch (uploadError: any) {
        console.warn("Storage upload failed, falling back to Base64:", uploadError);
        // Fallback to Base64
        toast.info("Upload failed, trying offline mode...");
        const base64 = await compressAndConvertToBase64(file);
        setFormData(prev => ({ ...prev, photoUrl: base64 }));
        toast.success("Photo processed (Offline Mode)!");
      }
    } catch (error: any) {
      toast.error("Failed to process photo.");
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  async function handleResumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume file size must be less than 5MB");
      return;
    }

    setUploadingResume(true);
    try {
      const downloadURL = await uploadResume(file, profile.uid);
      setFormData(prev => ({ ...prev, resumeUrl: downloadURL }));
      toast.success("Resume uploaded successfully!");
    } catch (error: any) {
      toast.error("Failed to upload resume.");
      console.error(error);
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleCertChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !profile) return;

    const validFiles = Array.from(files).filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (> 5MB) and was skipped.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingCert(true);
    try {
      const uploadPromises = validFiles.map(file => uploadResume(file, profile.uid)); // Reuse upload helper
      const downloadURLs = await Promise.all(uploadPromises);
      
      setFormData(prev => ({ 
        ...prev, 
        certificationUrls: [...(prev.certificationUrls || []), ...downloadURLs] 
      }));
      toast.success("Certifications uploaded successfully!");
    } catch (error: any) {
      toast.error("Failed to upload all certifications.");
      console.error(error);
    } finally {
      setUploadingCert(false);
      e.target.value = ''; // Reset input to allow re-uploading the same file optionally
    }
  }

  function removeCert(indexToRemove: number) {
    setFormData(prev => ({
      ...prev,
      certificationUrls: prev.certificationUrls.filter((_, idx) => idx !== indexToRemove)
    }));
  }

  useEffect(() => {
    async function fetchKYC() {
      if (!profile) return;

      // Fetch KYC
      try {
        const data = await getKYC(profile.uid);
        setKyc(data);
        if (data) {
          setFormData({
            photoUrl: data.photoUrl || "",
            resumeUrl: data.resumeUrl || "",
            skills: data.skills?.join(", ") || "",
            yearsOfExperience: data.yearsOfExperience || "",
            certifications: data.certifications?.join(", ") || "",
            certificationUrls: data.certificationUrls || [],
            languages: data.languages?.join(", ") || "",
            shiftPreference: data.shiftPreference as any || "Any",
            height: data.height || "",
            weight: data.weight || "",
            complexion: data.complexion || "",
            identifyingFeatures: data.identifyingFeatures || "",
            availabilityStatus: data.availabilityStatus || "Actively Looking",
            preferredCity: data.preferredCity || "", // Added preferred city
          });
        }
      } catch (err) {
        console.log("KYC fetch error:", err);
      }

      // Fetch Hiring Requests (Independent)
      try {
        const hiringRequests = await getGuardHiringRequests(profile.uid);
        setRequests(hiringRequests);
      } catch (err) {
        console.log("Hiring requests fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchKYC();
  }, [profile]);



  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (!formData.photoUrl) {
      toast.error("Profile photo is mandatory.");
      return;
    }

    if (!formData.height.trim()) return toast.error("Height is mandatory.");
    if (!formData.weight.trim()) return toast.error("Weight is mandatory.");
    if (!formData.complexion.trim()) return toast.error("Complexion is mandatory.");
    if (!formData.identifyingFeatures.trim()) return toast.error("Identifying features are mandatory.");
    if (!formData.skills.trim()) return toast.error("At least one skill is mandatory.");
    if (!formData.preferredCity.trim()) return toast.error("Current Location is mandatory.");

    if (formData.certifications.trim() && (!formData.certificationUrls || formData.certificationUrls.length === 0)) {
      toast.error("Please upload the document for the specified certifications.");
      return;
    }

    setSaving(true);
    try {
      await updateGuardProfile(profile.uid, {
        ...formData,
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        certifications: formData.certifications.split(",").map(c => c.trim()).filter(Boolean),
        languages: formData.languages.split(",").map(l => l.trim()).filter(Boolean),
        shiftPreference: formData.shiftPreference as any,
        availabilityStatus: formData.availabilityStatus as any,
      });

      // Refresh local data to confirm persistence
      const updatedData = await getKYC(profile.uid);
      setKyc(updatedData);

      toast.success("Profile saved persistently!");
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(newStatus: string) {
    if (!profile) return;
    setSaving(true);
    try {
      await updateGuardProfile(profile.uid, {
        availabilityStatus: newStatus as any
      });
      // Update local state
      setFormData(prev => ({ ...prev, availabilityStatus: newStatus }));
      setKyc(prev => prev ? { ...prev, availabilityStatus: newStatus as any } : null);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestStatus(requestId: string, status: "accepted" | "rejected") {
    setProcessingRequest(requestId);
    try {
      await updateHiringRequestStatus(requestId, status);
      toast.success(status === "accepted" ? "Hiring request accepted! You can now chat in Messages." : "Hiring request declined.");

      // Refresh requests list
      if (profile) {
        const hiringRequests = await getGuardHiringRequests(profile.uid);
        setRequests(hiringRequests);
      }
    } catch (error) {
      console.error("Failed to process request:", error);
      toast.error("Failed to process request.");
    } finally {
      setProcessingRequest(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const kycStatus = kyc?.status || "not_started";

  // Shared Hiring Requests Component
  const HiringRequestsSection = () => {
    const pendingAndAccepted = requests.filter(r => r.status === 'pending' || r.status === 'accepted');
    const hiredRequests = requests.filter(r => r.status === 'hired');

    return (
      <div className="space-y-6">
        {/* Hired Confirmation Banner */}
        {hiredRequests.length > 0 && (
          <Card className="border-green-500 bg-green-50 border-2 overflow-hidden">
            <CardHeader className="bg-green-600 text-white py-4">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                Congratulations! You've been Hired 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {hiredRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-green-800">{req.companyName}</h3>
                    <p className="text-green-700">Confirmed your hiring on {new Date(req.updatedAt || req.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-green-600 mt-2 italic">Expect communication from {req.hrName} regarding your deployment details.</p>
                  </div>
                  <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-100" onClick={() => window.open(`mailto:${req.hrEmail}`)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contact HR
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Existing Job Offers */}
        {pendingAndAccepted.length > 0 ? (
          <Card className="border-primary/50 bg-primary/5 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                New Job Offers!
              </CardTitle>
              <CardDescription>Companies are interested in your profile.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {pendingAndAccepted.map((req) => (
                <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm gap-4 transition-all hover:shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-foreground">{req.companyName}</h3>
                      {req.status === 'pending' && <Badge variant="outline" className="animate-pulse border-primary text-primary">Action Required</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-medium text-foreground">{req.hrName}</span>
                      <span>•</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </p>
                    <div className="flex items-start gap-2 mt-2 p-3 bg-muted/50 rounded-md text-sm italic text-muted-foreground border border-border/50">
                      <MessageCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      "{req.message || 'We are interested in hiring you. Please contact us to discuss further.'}"
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    {req.status === 'pending' ? (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => req.id && handleRequestStatus(req.id, "accepted")}
                          disabled={!!req.id && processingRequest === req.id}
                          className="flex-1 sm:flex-none gap-2 shadow-sm bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => req.id && handleRequestStatus(req.id, "rejected")}
                          disabled={!!req.id && processingRequest === req.id}
                          className="flex-1 sm:flex-none gap-2 shadow-sm"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Badge variant={req.status === "accepted" ? "default" : "destructive"} className="text-sm px-4 py-1.5 flex-1 sm:flex-none justify-center">
                          {req.status === "accepted" ? "Accepted" : "Declined"}
                        </Badge>
                        {req.status === "accepted" && (
                          <Link href={`/dashboard/messages?chat=${req.id}`} className="flex-1 sm:flex-none">
                            <Button variant="outline" className="w-full gap-2 shadow-sm text-primary border-primary/20 hover:bg-primary/5">
                              <MessageCircle className="h-4 w-4" />
                              Message
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  };

  const SubscriptionStatusCard = () => {
    const hasActivePlan = profile?.guardSubscription?.status === "active";
    const planName = profile?.guardSubscription?.plan === "premium" ? "Yearly Premium" : "Monthly Basic";
    const expiresAt = profile?.guardSubscription?.expiresAt 
      ? new Date(profile.guardSubscription.expiresAt).toLocaleDateString()
      : null;

    return (
      <Card className={cn(
        "mb-6 border-2",
        hasActivePlan ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border/40 bg-card/50"
      )}>
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
              hasActivePlan ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
            )}>
              {hasActivePlan ? <Star className="h-6 w-6" fill="currentColor" /> : <FileText className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Plan</p>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {hasActivePlan ? planName : "Free Plan"}
                {hasActivePlan && <Badge className="bg-green-500 hover:bg-green-600 text-white border-none">Active</Badge>}
              </h3>
              {hasActivePlan ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Valid until: <span className="font-semibold text-foreground">{expiresAt}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade to unlock unlimited premium job applications.
                </p>
              )}
            </div>
          </div>
          
          {!hasActivePlan && (
            <Button onClick={() => setSubModalOpen(true)} className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-md">
              <Zap className="h-4 w-4" fill="currentColor" />
              Upgrade Now
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };
  
  const QuickAvailabilityToggle = () => (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm mb-6">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            formData.availabilityStatus === "Actively Looking" ? "bg-green-500/10 text-green-600" :
            formData.availabilityStatus === "Hired/Unavailable" ? "bg-red-500/10 text-red-600" :
            "bg-yellow-500/10 text-yellow-600"
          )}>
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Availability Status</p>
            <p className="text-xs text-muted-foreground">You are currently: <span className="font-semibold text-foreground">{formData.availabilityStatus}</span></p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant={formData.availabilityStatus === "Actively Looking" ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleStatusUpdate("Actively Looking")}
            disabled={saving}
            className="flex-1 sm:flex-none h-8 text-xs"
          >
            Looking
          </Button>
          <Button 
            variant={formData.availabilityStatus === "Hired/Unavailable" ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleStatusUpdate("Hired/Unavailable")}
            disabled={saving}
            className="flex-1 sm:flex-none h-8 text-xs font-medium border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Hired
          </Button>
          <Button 
            variant={formData.availabilityStatus === "On Leave" ? "default" : "outline"} 
            size="sm" 
            onClick={() => handleStatusUpdate("On Leave")}
            disabled={saving}
            className="flex-1 sm:flex-none h-8 text-xs border-yellow-200 hover:bg-yellow-50 hover:text-yellow-600"
          >
            Leave
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <RoleGuard allowedRoles={['guard']}>
      {kycStatus === "approved" ? (
        <div className="flex flex-col gap-6">
          <SubscriptionStatusCard />
          <QuickAvailabilityToggle />
          {/* HERE: Hiring Requests for Approved Guards */}
          <HiringRequestsSection />

          <div className="flex flex-col gap-6">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">View My Profile</CardTitle>
                    <CardDescription>Manage and update your professional profile details below.</CardDescription>
                  </div>
                  {kyc?.updatedAt && (
                    <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
                      Last saved: {new Date(kyc.updatedAt).toLocaleString()}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">Keep your profile updated to get better hiring opportunities.</p>
                <form onSubmit={handleSave} className="space-y-8">

                  {/* Professional Details Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Professional Details</h3>
                      <p className="text-sm text-muted-foreground">Your skills, experience and qualifications.</p>
                    </div>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="photo">Profile Photo <span className="text-red-500">*</span></Label>
                        <div className="flex items-center gap-4">
                          {formData.photoUrl && (
                            <img src={formData.photoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover border" />
                          )}
                          <Input
                            id="photo"
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleFileChange}
                            disabled={uploading}
                          />
                        </div>
                        {uploading && <p className="text-xs text-muted-foreground animate-pulse">Uploading photo...</p>}
                        {!formData.photoUrl && <p className="text-xs text-destructive">Photo is required.</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="resumeUrl">Resume</Label>
                        <div className="flex flex-col gap-2">
                          {formData.resumeUrl && (
                            <a href={formData.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                              <FileText className="h-4 w-4" /> View Current Resume
                            </a>
                          )}
                          <Input 
                            id="resumeUrl" 
                            type="file" 
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeChange} 
                            disabled={uploadingResume} 
                          />
                        </div>
                        {uploadingResume && <p className="text-xs text-muted-foreground animate-pulse">Uploading resume...</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                        <Input id="yearsOfExperience" placeholder="e.g. 5" value={formData.yearsOfExperience} onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="skills">Skills <span className="text-red-500">*</span></Label>
                        <Input id="skills" placeholder="First Aid, Crowd Control, CCTV Monitoring" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="certifications">Certifications</Label>
                        <Input id="certifications" placeholder="Certified Security Officer, Fire Safety" value={formData.certifications} onChange={(e) => setFormData({ ...formData, certifications: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="certificationsUrl">Upload Certifications Files</Label>
                        <div className="flex flex-col gap-3">
                          {formData.certificationUrls && formData.certificationUrls.length > 0 && (
                            <div className="grid gap-2">
                              {formData.certificationUrls.map((url, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-2 truncate max-w-[80%]">
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <span className="truncate">Certification Document {idx + 1}</span>
                                  </a>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeCert(idx)} className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          <Input 
                            id="certificationsUrl" 
                            type="file" 
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleCertChange} 
                            disabled={uploadingCert} 
                          />
                        </div>
                        {uploadingCert && <p className="text-xs text-muted-foreground animate-pulse">Uploading certifications...</p>}
                      </div>
                    </div>
                  </div>

                  {/* Physical Attributes Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Physical Attributes</h3>
                      <p className="text-sm text-muted-foreground">Physical details often required for security posts.</p>
                    </div>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="height">Height (ft) <span className="text-red-500">*</span></Label>
                        <Input id="height" placeholder="e.g. 6.0" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="weight">Weight (kg) <span className="text-red-500">*</span></Label>
                        <Input id="weight" placeholder="e.g. 75" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="complexion">Complexion <span className="text-red-500">*</span></Label>
                        <Input id="complexion" placeholder="e.g. Fair, Wheatish" value={formData.complexion} onChange={(e) => setFormData({ ...formData, complexion: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="features">Identifying Features <span className="text-red-500">*</span></Label>
                        <Input id="features" placeholder="e.g. Scar on left eyebrow" value={formData.identifyingFeatures} onChange={(e) => setFormData({ ...formData, identifyingFeatures: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Preferences & Location Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Preferences & Location</h3>
                    </div>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="preferredCity">Current Location <span className="text-red-500">*</span></Label>
                        <Input 
                          id="preferredCity" 
                          placeholder="e.g. Mumbai, Maharashtra" 
                          value={formData.preferredCity} 
                          onChange={(e) => setFormData({ ...formData, preferredCity: e.target.value })} 
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>Shift Preference</Label>
                        <Select value={formData.shiftPreference} onValueChange={(v) => setFormData({ ...formData, shiftPreference: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shift" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Day Shift">Day Shift</SelectItem>
                            <SelectItem value="Night Shift">Night Shift</SelectItem>
                            <SelectItem value="Rotational">Rotational</SelectItem>
                            <SelectItem value="Any">Any Shift</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="languages">Languages Spoken</Label>
                        <Input id="languages" placeholder="English, Hindi, Marathi" value={formData.languages} onChange={(e) => setFormData({ ...formData, languages: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={saving}>
                      {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <QuickAvailabilityToggle />
          {/* Job Offers / Hiring Requests */}
          <HiringRequestsSection />

          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-black text-primary uppercase tracking-tight">
              Welcome, {profile?.fullName}
            </h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Application Lifecycle Status
            </p>
          </div>

          {/* KYC Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>KYC Verification Status</CardTitle>
              <CardDescription>Complete your KYC to proceed with your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {kycStatus === "not_started" && (
                    <>
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Not Started</p>
                        <p className="text-sm text-muted-foreground">
                          Please complete your KYC form to proceed.
                        </p>
                      </div>
                    </>
                  )}
                  {kycStatus === "pending" && (
                    <>
                      <Clock className="h-8 w-8 text-warning" />
                      <div>
                        <p className="font-medium text-foreground">Under Review</p>
                        <p className="text-sm text-muted-foreground">
                          Your KYC is being reviewed by our HR team.
                        </p>
                      </div>
                    </>
                  )}
                  {/* Approved status is handled above, but if something slips through */}
                  {kycStatus === "rejected" && (
                    <>
                      <XCircle className="h-8 w-8 text-destructive" />
                      <div>
                        <p className="font-medium text-foreground">Rejected</p>
                        <p className="text-sm text-muted-foreground">
                          {kyc?.rejectionReason || "Your KYC was rejected. Please resubmit."}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {(kycStatus === "not_started" || kycStatus === "rejected") && (
                  <Link href="/dashboard/guard/kyc">
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      {kycStatus === "rejected" ? "Resubmit KYC" : "Complete KYC"}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Steps Visualization (Same as before) */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className={cn(kycStatus !== "not_started" && "border-success/30")}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                  kycStatus !== "not_started"
                    ? "bg-success text-success-foreground"
                    : "bg-primary text-primary-foreground"
                )}>
                  1
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Registration</p>
                  <p className="text-xs text-muted-foreground">Account created</p>
                </div>
              </CardContent>
            </Card>
            <Card className={cn("border-muted")}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                  kycStatus === "pending"
                    ? "bg-warning text-warning-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  2
                </div>
                <div>
                  <p className="font-medium text-card-foreground">KYC Verification</p>
                  <p className="text-xs text-muted-foreground">
                    {kycStatus === "not_started"
                      ? "Not submitted"
                      : kycStatus === "pending"
                        ? "Under review"
                        : "Needs resubmission"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-muted">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold bg-muted text-muted-foreground">
                  3
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Ready for Deployment</p>
                  <p className="text-xs text-muted-foreground">
                    Pending KYC
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <GuardSubscriptionModal 
        open={isSubModalOpen} 
        onOpenChange={setSubModalOpen} 
        onSuccess={() => window.location.reload()} 
      />
    </RoleGuard>
  );
}
