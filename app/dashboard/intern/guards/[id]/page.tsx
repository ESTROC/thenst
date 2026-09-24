"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, BadgeCheck, Shield, Award, Calendar, Building, MessageCircle, MessageSquare, CheckCircle, XCircle, FileText, Lock, Loader2 } from "lucide-react";
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
import { getUserProfile, getKYC, getJobApplicationByGuard, getJobById, unlockProfile, isProfileUnlocked } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import type { UserProfile, KYCData, JobApplication, Job } from "@/lib/types";
import { SubscriptionModal } from "@/components/subscription-modal";

export default function InternGuardDetailsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const jobId = searchParams.get("jobId");
    
    const router = useRouter();
    const { profile, refreshProfile } = useAuth();
    const [guard, setGuard] = useState<UserProfile | null>(null);
    const [kyc, setKyc] = useState<KYCData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingApp, setProcessingApp] = useState(false);

    // Applicant Context
    const [application, setApplication] = useState<JobApplication | null>(null);
    const [jobDetails, setJobDetails] = useState<Job | null>(null);

    const [isUnlocked, setIsUnlocked] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [showSubscription, setShowSubscription] = useState(false);

    useEffect(() => {
        if (profile?.uid && guard?.uid) {
            isProfileUnlocked(profile.uid, guard.uid).then(setIsUnlocked);
        }
    }, [profile, guard]);

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
                await refreshProfile();
                toast.success("Profile unlocked successfully!");
            } else {
                toast.error("Failed to unlock profile. Please check your credit balance.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during unlock.");
        } finally {
            setUnlocking(false);
        }
    }

    async function handleApplicationAction(newStatus: JobApplication["status"]) {
        if (!application || !profile || !jobDetails || !guard) return;
        setProcessingApp(true);
        try {
            const { doc, updateDoc, addDoc, collection } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");

            const appRef = doc(db, "job_applications", application.id);
            await updateDoc(appRef, { status: newStatus });

            if (newStatus === "accepted") {
                // Create Hiring Request
                const newRequestData = {
                  hrId: profile.uid,
                  guardId: guard.uid,
                  hrName: profile.fullName || "TheNST Intern",
                  hrEmail: profile.email || "",
                  guardName: guard.fullName,
                  guardEmail: guard.email,
                  companyName: jobDetails.companyName || "TheNST",
                  status: "accepted",
                  message: `Your job application for ${jobDetails.title} has been accepted by TheNST team. We are interested in your profile.`,
                  createdAt: new Date().toISOString(),
                  ...(application.agencyId && { agencyId: application.agencyId }),
                };

                const requestRef = await addDoc(collection(db, "hiring_requests"), newRequestData);

                // Create Chat Room
                const { createChatRoom, createNotification } = await import("@/lib/firestore");
                const roomId = await createChatRoom(requestRef.id, { ...newRequestData, id: requestRef.id } as any);
                await updateDoc(requestRef, { chatRoomId: roomId });

                // In-App Notification
                await createNotification(guard.uid, {
                  title: "Application Accepted! 🎉",
                  message: `TheNST has accepted your application for ${jobDetails.title}. Check your Job Offers to connect!`,
                  type: "success"
                });

                toast.success("Application accepted and candidate added to the Interview Pipeline.");
            } else {
                toast.success("Application successfully rejected.");
            }

            // Refresh application state
            const updated = await getJobApplicationByGuard(jobDetails.id as string, guard.uid, profile.uid);
            setApplication(updated);
        } catch (err: any) {
            console.error("Action failed:", err);
            toast.error(err.message || "Action failed");
        } finally {
            setProcessingApp(false);
        }
    }

    useEffect(() => {
        async function fetchData() {
            if (params.id && profile?.uid) {
                try {
                    const uid = Array.isArray(params.id) ? params.id[0] : params.id;
                    const fetchPromises: any[] = [
                        getUserProfile(uid),
                        getKYC(uid)
                    ];

                    if (jobId) {
                        fetchPromises.push(getJobApplicationByGuard(jobId, uid, profile.uid));
                        fetchPromises.push(getJobById(jobId));
                    }

                    const [guardData, kycData, appData, jobData] = await Promise.all(fetchPromises);
                    
                    setGuard(guardData);
                    setKyc(kycData);
                    if (appData) setApplication(appData);
                    if (jobData) setJobDetails(jobData);
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
            <Button variant="ghost" className="w-fit gap-2 rounded-xl" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1 h-fit border-slate-200">
                    <CardHeader className="text-center">
                        <div className="mx-auto h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-3xl font-bold text-slate-500">
                            {guard.fullName.charAt(0)}
                        </div>
                        <CardTitle className="text-slate-800 font-bold">{guard.fullName}</CardTitle>
                        <CardDescription className="font-semibold text-slate-500">
                            {guard.role === "agency" ? "Security Agency" : "Security Professional"}
                        </CardDescription>
                        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center gap-1 border border-green-150 font-bold">
                                <BadgeCheck className="h-3 w-3" /> Verified Profile
                            </span>
                            <div className={cn(
                                "flex items-center text-xs font-bold w-fit px-2 py-1 rounded-full ring-1",
                                kyc?.availabilityStatus === "Hired/Unavailable" ? "text-red-600 bg-red-500/10 ring-red-650/20" :
                                    kyc?.availabilityStatus === "On Leave" ? "text-yellow-600 bg-yellow-500/10 ring-yellow-650/20" :
                                        "text-blue-600 bg-blue-500/10 ring-blue-650/20"
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
                            <div className="flex items-center justify-center gap-2 text-slate-500">
                                <MapPin className="h-4 w-4 text-cyan-600" />
                                <span className="font-bold text-slate-700">{kyc?.preferredCity || (guard as any).companyDetails?.city || "Location not specified"}</span>
                            </div>
                            <Separator className="my-1 border-slate-100" />
                            <div className="flex items-center justify-center gap-2 text-slate-500">
                                <Mail className="h-4 w-4" />
                                <span className="font-semibold">{isUnlocked ? guard.email : "•".repeat(guard.email.length)}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-slate-500">
                                <Phone className="h-4 w-4" />
                                <span className="font-semibold">{isUnlocked ? guard.phone : "•".repeat(10)}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {isUnlocked ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-sm">
                                        <Mail className="mr-2 h-4 w-4" /> {guard.role === "agency" ? "Contact Agency" : "Contact Professional"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px] bg-white rounded-2xl p-2 border-slate-200">
                                    <DropdownMenuItem className="rounded-xl font-semibold cursor-pointer" onClick={() => window.open(`https://wa.me/${guard.phone.replace(/\D/g, '')}`, '_blank')}>
                                        <MessageCircle className="mr-2 h-4 w-4 text-emerald-500" /> WhatsApp
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl font-semibold cursor-pointer" onClick={() => window.open(`sms:${guard.phone.replace(/\D/g, '')}`)}>
                                        <MessageSquare className="mr-2 h-4 w-4 text-cyan-600" /> Text Message
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-sm" onClick={handleUnlock} disabled={unlocking}>
                                {unlocking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                                {profile?.credits && profile.credits > 0 ? "Unlock Contact (1 Credit)" : "Unlock Profile"}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Details */}
                <div className="md:col-span-2 grid gap-6">
                    {/* Discovery Attributes */}
                    <Card className="border-cyan-200 bg-cyan-50/20">
                        <CardHeader className="pb-2">
                             <CardTitle className="text-xs font-black uppercase tracking-wider text-cyan-700 flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Discovery Attributes
                             </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {guard.role === "agency" ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Deployment Capacity</span>
                                        <span className="font-black text-slate-800 text-lg">
                                            {kyc?.totalCapacity || (guard as any).agencyDetails?.totalCapacity || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</span>
                                        <span className="font-black text-slate-800 text-lg truncate">
                                            {(guard as any).companyDetails?.contactPerson || guard.fullName || "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">City</span>
                                        <span className="font-black text-slate-800 text-lg capitalize">
                                            {(guard as any).companyDetails?.city || kyc?.preferredCity || "N/A"}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Height (ft)</span>
                                        <span className="font-black text-slate-800 text-lg">{kyc?.height || "N/A"}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Weight (kg)</span>
                                        <span className="font-black text-slate-800 text-lg">{kyc?.weight || "N/A"}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Complexion</span>
                                        <span className="font-black text-slate-800 text-lg capitalize">{kyc?.complexion || "N/A"}</span>
                                    </div>
                                </div>
                            )}
                            
                            {guard.role !== "agency" && kyc?.identifyingFeatures && (
                                <div className="mt-4 pt-4 border-t border-cyan-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Distinguishing Features</span>
                                    <p className="text-sm font-semibold text-slate-700">{kyc.identifyingFeatures}</p>
                                </div>
                            )}

                            {guard.role === "agency" && ((guard as any).agencyDetails?.sectors || kyc?.sectors) && (
                                <div className="mt-4 pt-4 border-t border-cyan-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Sectors Serviced & Roles</span>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {((guard as any).agencyDetails?.sectors || kyc?.sectors || []).map((sector: any, idx: number) => (
                                            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                                                <span className="text-[10px] font-black text-cyan-700 uppercase block">{sector.category}</span>
                                                <span className="text-xs font-semibold text-slate-650 mt-0.5 block">
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
                    <Card className={cn(application && "border-cyan-200 bg-cyan-50/10")}>
                        <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
                            <div>
                                {application && jobDetails ? (
                                    <>
                                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                            Applicant for {jobDetails.title}
                                            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-100 capitalize font-bold text-[10px]">
                                                {application.status}
                                            </Badge>
                                        </h3>
                                        <p className="text-xs font-semibold text-slate-500 mt-1">
                                            {isUnlocked 
                                                ? "Manage this candidate's application for your job posting." 
                                                : `Accepting this applicant will cost 1 credit. (${profile?.credits || 0} remaining)`}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-black text-slate-800">
                                            {isUnlocked ? "Interested in this candidate?" : "Unlock to view full details"}
                                        </h3>
                                        <p className="text-xs font-semibold text-slate-500">
                                            {isUnlocked
                                                ? "You have full access to view, contact, or invite this verified professional."
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
                                                {isUnlocked ? (
                                                    <>
                                                        <Button 
                                                            onClick={() => handleApplicationAction("accepted")} 
                                                            disabled={processingApp}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 shadow-sm w-full sm:w-auto"
                                                        >
                                                            {processingApp ? "Processing..." : "Accept"}
                                                        </Button>
                                                        <Button 
                                                            variant="destructive" 
                                                            onClick={() => handleApplicationAction("rejected")}
                                                            disabled={processingApp}
                                                            className="bg-red-50 text-red-650 hover:bg-red-100 border border-red-200 font-bold rounded-xl h-10 shadow-none w-full sm:w-auto"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button 
                                                        onClick={handleUnlock}
                                                        disabled={unlocking}
                                                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl h-10 shadow-sm w-full"
                                                    >
                                                        {unlocking ? "Unlocking..." : "Unlock to Process"}
                                                    </Button>
                                                )}
                                            </div>
                                        ) : application.status === "accepted" ? (
                                            <Link href={`/dashboard/messages?chat=${guard?.uid}`} className="w-full md:w-auto">
                                                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl h-10 shadow-sm w-full">
                                                    <MessageSquare className="mr-2 h-4 w-4" /> Open Chat Pipeline
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Badge variant="secondary" className="px-5 py-2 text-sm uppercase font-black rounded-xl border border-slate-200 w-full text-center justify-center">Decision: {application.status}</Badge>
                                        )}
                                    </>
                                ) : isUnlocked ? (
                                    <Link href={`/dashboard/messages?chat=${guard?.uid}`} className="w-full md:w-auto">
                                        <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-slate-700 w-full">
                                            <Mail className="mr-2 h-4 w-4" /> Chat Directly
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button onClick={handleUnlock} disabled={unlocking} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl h-10 shadow-sm w-full">
                                        {unlocking && <Loader2 className="mr-2 h-4 w-4 animate-spin mr-2" />}
                                        Unlock Profile
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-slate-800 font-bold text-lg">Professional Background</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex gap-3">
                                    <Building className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Experience</p>
                                        <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                            {kyc?.yearsOfExperience ? `${kyc.yearsOfExperience} years` : "Not specified"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Calendar className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Birth Date</p>
                                        <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                            {isUnlocked ? (kyc?.dateOfBirth || "Not specified") : "Locked"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-bold text-slate-700">Skills & Training</p>
                                <div className="flex flex-wrap gap-2">
                                    {kyc?.skills?.map((skill: string, i: number) => (
                                        <span key={i} className="px-3 py-1 rounded-xl bg-cyan-50 text-cyan-750 text-xs font-bold border border-cyan-100">{skill}</span>
                                    ))}
                                    {!kyc?.skills?.length && <span className="text-sm italic text-slate-400">No custom skills listed</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-bold text-slate-700">Resume / Professional PDF</p>
                                {kyc?.resumeUrl ? (
                                    <div className="flex items-center gap-3 p-3 border rounded-xl bg-slate-50 relative overflow-hidden border-slate-200">
                                        <div className="h-10 w-10 bg-red-100 text-red-600 rounded flex items-center justify-center font-bold">
                                            PDF
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">
                                                {isUnlocked
                                                    ? `Resume_${guard.fullName.replace(/\s+/g, '_')}.pdf`
                                                    : "Resume_Protected.pdf"}
                                            </p>
                                            <p className="text-xs text-slate-400 font-semibold">Uploaded Professionally</p>
                                        </div>
                                        {isUnlocked ? (
                                            <Button variant="ghost" size="sm" className="rounded-xl font-bold border border-slate-200 bg-white" asChild>
                                                <a href={kyc.resumeUrl} target="_blank" rel="noopener noreferrer">Download</a>
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" size="sm" className="rounded-xl font-bold border border-slate-200 bg-white" onClick={handleUnlock} disabled={unlocking}>
                                                {unlocking ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
                                                Unlock
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No resume uploaded.</p>
                                )}
                            </div>

                            {/* Certifications Section */}
                            <div className="space-y-3 pt-2">
                                <p className="text-sm font-bold text-slate-755 flex items-center gap-2">
                                    <Award className="h-4 w-4 text-cyan-600" /> Certifications & Proofs
                                </p>
                                {kyc?.certifications ? (
                                    <p className="text-sm bg-slate-50 p-3 rounded-xl border border-slate-200 italic text-slate-600 font-semibold">
                                        {kyc.certifications}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No certification details provided.</p>
                                )}
                                
                                {kyc?.certificationUrls && kyc.certificationUrls.length > 0 && (
                                    <div className="grid gap-2">
                                        {kyc.certificationUrls.map((url, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2.5 border rounded-xl bg-white border-slate-200 group">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-slate-400" />
                                                    <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">Certification Doc {idx + 1}</span>
                                                </div>
                                                {isUnlocked ? (
                                                    <Button variant="ghost" size="sm" className="h-8 rounded-xl font-bold bg-slate-50 border border-slate-200" asChild>
                                                        <a href={url} target="_blank" rel="noopener noreferrer">View</a>
                                                    </Button>
                                                ) : (
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
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
