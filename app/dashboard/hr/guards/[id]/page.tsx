"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, BadgeCheck, Shield, Award, Languages, Calendar, Building, MessageCircle, MessageSquare, CheckCircle, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { getUserProfile, getKYC, sendHiringRequest, unlockProfile, isProfileUnlocked, getJobApplicationByGuard, updateJobApplicationStatus, getJobById } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import type { UserProfile, KYCData, HiringRequest, JobApplication, Job } from "@/lib/types";
import { SubscriptionModal } from "@/components/subscription-modal";
import { Lock, Loader2 } from "lucide-react";

export default function GuardDetailsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const jobId = searchParams.get("jobId");
    
    const router = useRouter();
    const { profile } = useAuth();
    const [guard, setGuard] = useState<UserProfile | null>(null);
    const [kyc, setKyc] = useState<KYCData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sendingRequest, setSendingRequest] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [showSubscription, setShowSubscription] = useState(false);

    // Applicant Context
    const [application, setApplication] = useState<JobApplication | null>(null);
    const [jobDetails, setJobDetails] = useState<Job | null>(null);
    const [processingApp, setProcessingApp] = useState(false);

    useEffect(() => {
        if (profile?.uid && guard?.uid) {
            isProfileUnlocked(profile.uid, guard.uid).then(setIsUnlocked);
        }
    }, [profile, guard]);

    async function handleApplicationAction(newStatus: JobApplication["status"]) {
        if (!application || !profile || !jobDetails || !guard) return;
        setProcessingApp(true);
        try {
            await updateJobApplicationStatus(application.id as string, newStatus, profile, jobDetails);
            toast.success(`Applicant marked as ${newStatus}`);
            // Refresh application state
            const updated = await getJobApplicationByGuard(jobDetails.id as string, guard.uid, profile.uid);
            setApplication(updated);
            if (newStatus === "accepted") {
                setIsUnlocked(true);
            }
        } catch (err: any) {
            if (err.message === "Insufficient credits") {
                setShowSubscription(true);
            } else {
                toast.error(err.message || "Action failed");
            }
        } finally {
            setProcessingApp(false);
        }
    }

    async function handleUnlock() {
        if (!profile || !guard) return;
        const currentCredits = profile.credits || 0;

        if (currentCredits < 1) {
            setShowSubscription(true);
            return;
        }

        setUnlocking(true);
        try {
            const success = await unlockProfile(profile.uid, guard.uid);
            if (success) {
                setIsUnlocked(true);
                toast.success("Profile unlocked!");
            } else {
                toast.error("Failed to unlock. Check credits.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred.");
        } finally {
            setUnlocking(false);
        }
    }

    async function handleHiringRequest() {
        if (!profile || !guard || !kyc) return;

        if (!isUnlocked) {
            toast.error("Please unlock the profile first.");
            return;
        }

        setSendingRequest(true);
        try {
            const request: HiringRequest = {
                hrId: profile.uid,
                hrName: profile.fullName,
                hrEmail: profile.email,
                companyName: profile.companyDetails?.name || "Unknown Company",
                guardId: guard.uid,
                guardName: guard.fullName,
                guardEmail: guard.email,
                status: "pending",
                createdAt: new Date().toISOString(),
                message: "We are interested in hiring you. Please contact us to discuss further."
            };

            await sendHiringRequest(request);
            toast.success("Hiring request sent successfully!");
        } catch (error: any) {
            if (error.message === "Insufficient credits to send a direct hiring request.") {
                toast.error("Insufficient credits. Please purchase a pack to hire directly.");
                setShowSubscription(true);
            } else if (error.message && error.message.includes("24 hours")) {
                toast.error(error.message);
            } else {
                toast.error(error.message || "Failed to send hiring request.");
            }
        } finally {
            setSendingRequest(false);
        }
    }

    const [existingRequest, setExistingRequest] = useState<HiringRequest | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (params.id && profile?.uid) {
                try {
                    const uid = Array.isArray(params.id) ? params.id[0] : params.id;
                    const [guardData, kycData] = await Promise.all([
                        getUserProfile(uid),
                        getKYC(uid)
                    ]);
                    
                    setGuard(guardData);
                    setKyc(kycData);

                    if (jobId) {
                        const [appData, jobData] = await Promise.all([
                            getJobApplicationByGuard(jobId, uid, profile.uid),
                            getJobById(jobId)
                        ]);
                        if (appData) setApplication(appData);
                        if (jobData) setJobDetails(jobData);
                    }

                    // Query existing hiring request for both guards and agencies
                    const { collection, query, where, getDocs } = await import("firebase/firestore");
                    const reqsQueryGuard = query(
                        collection(db, "hiring_requests"),
                        where("hrId", "==", profile.uid),
                        where("guardId", "==", uid)
                    );
                    const reqsQueryAgency = query(
                        collection(db, "hiring_requests"),
                        where("hrId", "==", profile.uid),
                        where("agencyId", "==", uid)
                    );
                    
                    const [reqsGuardSnap, reqsAgencySnap] = await Promise.all([
                        getDocs(reqsQueryGuard),
                        getDocs(reqsQueryAgency)
                    ]);

                    const combinedDocs = [
                        ...reqsGuardSnap.docs,
                        ...reqsAgencySnap.docs
                    ];

                    if (combinedDocs.length > 0) {
                        const reqs = combinedDocs.map((d: any) => ({ id: d.id, ...d.data() } as HiringRequest));
                        const activeReq = reqs.find((r: any) => r.status === "accepted" || r.status === "hired") || reqs[0];
                        setExistingRequest(activeReq);
                    }
                } catch (error) {
                    console.error("Error fetching details:", error);
                } finally {
                    setLoading(false);
                }
            } else if (params.id && !profile) {
                setLoading(true);
            }
        }
        fetchData();
    }, [params.id, jobId, profile]);

    if (loading) return <div className="p-8">Loading profile...</div>;
    if (!guard) return <div className="p-8">Security professional not found.</div>;

    return (
        <div className="flex flex-col gap-6">
            <Button variant="ghost" className="w-fit gap-2" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4 text-3xl font-bold text-muted-foreground">
                            {guard.fullName.charAt(0)}
                        </div>
                        <CardTitle>{guard.fullName}</CardTitle>
                        <CardDescription>
                            {guard.role === "agency" ? "Security Agency" : "Security Professional"}
                        </CardDescription>
                        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                <BadgeCheck className="h-3 w-3" /> Verified
                            </span>
                            <div className={cn(
                                "flex items-center text-xs font-medium w-fit px-2 py-1 rounded-full ring-1",
                                kyc?.availabilityStatus === "Hired/Unavailable" ? "text-red-600 bg-red-500/10 ring-red-600/20" :
                                    kyc?.availabilityStatus === "On Leave" ? "text-yellow-600 bg-yellow-500/10 ring-yellow-600/20" :
                                        "text-blue-600 bg-blue-500/10 ring-blue-600/20"
                            )}>
                                <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse",
                                    kyc?.availabilityStatus === "Hired/Unavailable" ? "bg-red-500" :
                                        kyc?.availabilityStatus === "On Leave" ? "bg-yellow-500" :
                                            "bg-blue-500"
                                )}></span>
                                {kyc?.availabilityStatus || "Actively Looking"}
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-center">
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="font-medium text-foreground">{kyc?.preferredCity || (guard as any).companyDetails?.city || "Location not specified"}</span>
                            </div>
                            <Separator className="my-1" />
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{isUnlocked ? guard.email : "•".repeat(guard.email.length)}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{isUnlocked ? guard.phone : "•".repeat(10)}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {isUnlocked ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="w-full">
                                        <Mail className="mr-2 h-4 w-4" /> {guard.role === "agency" ? "Contact Agency" : "Contact Professional"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuItem onClick={() => window.open(`https://wa.me/${guard.phone.replace(/\D/g, '')}`, '_blank')}>
                                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => window.open(`sms:${guard.phone.replace(/\D/g, '')}`)}>
                                        <MessageSquare className="mr-2 h-4 w-4" /> Text Message
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button className="w-full" onClick={handleUnlock} disabled={unlocking}>
                                {unlocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                                {profile?.credits && profile.credits > 0 ? "Unlock Contact (1 Credit)" : "Unlock Profile"}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Details */}
                <div className="md:col-span-2 grid gap-6">
                    {/* Discovery Attributes */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Discovery Attributes
                             </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {guard.role === "agency" ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground uppercase">Deployment Capacity</span>
                                        <span className="font-bold text-lg">
                                            {kyc?.totalCapacity || (guard as any).agencyDetails?.totalCapacity || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground uppercase">Contact Person</span>
                                        <span className="font-bold text-lg truncate">
                                            {(guard as any).companyDetails?.contactPerson || guard.fullName || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground uppercase">City</span>
                                        <span className="font-bold text-lg capitalize">
                                            {(guard as any).companyDetails?.city || kyc?.preferredCity || "N/A"}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground uppercase">Height (ft)</span>
                                        <span className="font-bold text-lg">{kyc?.height || "N/A"}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground uppercase">Weight (kg)</span>
                                        <span className="font-bold text-lg">{kyc?.weight || "N/A"}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground uppercase">Complexion</span>
                                        <span className="font-bold text-lg capitalize">{kyc?.complexion || "N/A"}</span>
                                    </div>
                                </div>
                            )}

                            {guard.role !== "agency" && kyc?.identifyingFeatures && (
                                <div className="mt-4 pt-4 border-t border-primary/10">
                                    <span className="text-xs text-muted-foreground uppercase block mb-1">Distinguishing Features</span>
                                    <p className="text-sm font-medium">{kyc.identifyingFeatures}</p>
                                </div>
                            )}

                            {guard.role === "agency" && ((guard as any).agencyDetails?.sectors || kyc?.sectors) && (
                                <div className="mt-4 pt-4 border-t border-primary/10">
                                    <span className="text-xs text-muted-foreground uppercase block mb-2">Sectors Serviced & Roles</span>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {((guard as any).agencyDetails?.sectors || kyc?.sectors || []).map((sector: any, idx: number) => (
                                            <div key={idx} className="p-2.5 bg-muted/40 rounded-xl border border-border/60 animate-in fade-in-50 duration-300">
                                                <span className="text-[10px] font-black text-primary uppercase block">{sector.category}</span>
                                                <span className="text-xs font-semibold text-muted-foreground mt-0.5 block">
                                                    {Array.isArray(sector.roles) ? sector.roles.join(", ") : sector.roles || "All roles"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions Card */}
                    <Card className={cn((application || (existingRequest && (existingRequest.status === "accepted" || existingRequest.status === "hired"))) && "border-primary/50 bg-primary/5")}>
                        <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
                            <div>
                                {application && jobDetails ? (
                                    <>
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            Applicant for {jobDetails.title}
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize font-bold">
                                                {application.status}
                                            </Badge>
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {isUnlocked 
                                                ? "Manage this candidate's application for your job posting." 
                                                : `Accepting this applicant will cost 1 credit. (${profile?.credits || 0} remaining)`}
                                        </p>
                                    </>
                                ) : existingRequest && (existingRequest.status === "accepted" || existingRequest.status === "hired") ? (
                                    <>
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            {existingRequest.status === "hired" ? "Hired Candidate 🎉" : "Interview Pipeline Candidate ⏳"}
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 capitalize font-bold">
                                                {existingRequest.status}
                                            </Badge>
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {existingRequest.status === "hired" 
                                                ? "This candidate has been successfully hired." 
                                                : "This candidate has accepted your screening/request and is in your active pipeline."}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-semibold">
                                            {isUnlocked ? "Interested in this candidate?" : "Unlock to view full details"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isUnlocked
                                                ? "Contact them directly or send a hiring request."
                                                : `You have ${profile?.credits || 0} credits remaining.`}
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                {application && jobDetails ? (
                                    <>
                                        {application.status === "pending" ? (
                                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                                <Button 
                                                    onClick={() => handleApplicationAction("accepted")} 
                                                    disabled={processingApp}
                                                    className="bg-green-600 hover:bg-green-700 font-bold w-full sm:w-auto"
                                                >
                                                    {processingApp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                                    Accept
                                                </Button>
                                                <Button 
                                                    variant="destructive" 
                                                    onClick={() => handleApplicationAction("rejected")}
                                                    disabled={processingApp}
                                                    className="font-bold w-full sm:w-auto"
                                                >
                                                    {processingApp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                                                    Reject
                                                </Button>
                                            </div>
                                        ) : application.status === "accepted" ? (
                                            <Link href={`/dashboard/messages?chat=${guard?.uid}`} className="w-full md:w-auto">
                                                <Button className="font-bold w-full">
                                                    <MessageSquare className="mr-2 h-4 w-4" /> Go to Chat
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Badge variant="secondary" className="px-5 py-2 text-sm uppercase font-bold w-full text-center justify-center">Decision: {application.status}</Badge>
                                        )}
                                    </>
                                ) : existingRequest && (existingRequest.status === "accepted" || existingRequest.status === "hired") ? (
                                    <Link href={`/dashboard/messages?chat=${guard?.uid}`} className="w-full md:w-auto">
                                        <Button className="font-bold w-full">
                                            <MessageSquare className="mr-2 h-4 w-4" /> Go to Chat
                                        </Button>
                                    </Link>
                                ) : isUnlocked ? (
                                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                                        <Link href={`/dashboard/messages?chat=${guard?.uid}`} className="w-full sm:flex-1 md:w-auto">
                                            <Button variant="outline" className="w-full">
                                                <Mail className="mr-2 h-4 w-4" /> Message
                                            </Button>
                                        </Link>
                                        {(kyc?.availabilityStatus === "Hired/Unavailable" || kyc?.availabilityStatus === "On Leave") ? (
                                            <Button disabled variant="secondary" className="cursor-not-allowed w-full sm:flex-1 md:w-auto">
                                                Currently Unavailable
                                            </Button>
                                        ) : (
                                            <Button onClick={handleHiringRequest} disabled={sendingRequest} className="w-full sm:flex-1 md:w-auto">
                                                {sendingRequest ? "Sending..." : "Send Hiring Request"}
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <Button onClick={handleUnlock} disabled={unlocking} variant={profile?.credits === 0 ? "destructive" : "default"} className="w-full">
                                        {unlocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {profile?.credits === 0 ? "Buy Credits" : "Unlock Profile"}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Professional Background</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex gap-3">
                                    <Building className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Experience</p>
                                        <p className="text-sm text-muted-foreground">
                                            {kyc?.yearsOfExperience ? `${kyc.yearsOfExperience} years` : "Not specified"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Birth Date</p>
                                        <p className="text-sm text-muted-foreground">
                                            {isUnlocked ? (kyc?.dateOfBirth || "Not specified") : "Locked"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Skills & Training</p>
                                <div className="flex flex-wrap gap-2">
                                    {kyc?.skills?.map((skill: string, i: number) => (
                                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">{skill}</span>
                                    ))}
                                    {!kyc?.skills?.length && <span className="text-sm italic text-muted-foreground">No custom skills listed</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Resume / Professional PDF</p>
                                {kyc?.resumeUrl ? (
                                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 relative overflow-hidden">
                                        <div className="h-10 w-10 bg-red-100 text-red-600 rounded flex items-center justify-center font-bold">
                                            PDF
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">
                                                {isUnlocked
                                                    ? `Resume_${guard.fullName.replace(/\s+/g, '_')}.pdf`
                                                    : "Resume_Protected.pdf"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Uploaded Professionally</p>
                                        </div>
                                        {isUnlocked ? (
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={kyc.resumeUrl} target="_blank" rel="noopener noreferrer">Download</a>
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" size="sm" onClick={handleUnlock} disabled={unlocking}>
                                                {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4 mr-1" />}
                                                Unlock
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No resume uploaded.</p>
                                )}
                            </div>

                            {/* Certifications Section */}
                            <div className="space-y-3 pt-2">
                                <p className="text-sm font-medium flex items-center gap-2">
                                    <Award className="h-4 w-4 text-primary" /> Certifications & Proofs
                                </p>
                                {kyc?.certifications ? (
                                    <p className="text-sm bg-muted/50 p-3 rounded-lg border italic">
                                        {kyc.certifications}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No certification details provided.</p>
                                )}
                                
                                {kyc?.certificationUrls && kyc.certificationUrls.length > 0 && (
                                    <div className="grid gap-2">
                                        {kyc.certificationUrls.map((url, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 border rounded-md bg-background group">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm truncate max-w-[200px]">Certification Doc {idx + 1}</span>
                                                </div>
                                                {isUnlocked ? (
                                                    <Button variant="ghost" size="sm" className="h-8" asChild>
                                                        <a href={url} target="_blank" rel="noopener noreferrer">View</a>
                                                    </Button>
                                                ) : (
                                                  <span className="text-[10px] uppercase font-bold text-muted-foreground/50 flex items-center gap-1">
                                                    <Lock className="h-2.5 w-2.5" /> Locked
                                                  </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <SubscriptionModal
                open={showSubscription}
                onOpenChange={setShowSubscription}
                onSuccess={() => window.location.reload()}
            />
        </div>
    );
}
