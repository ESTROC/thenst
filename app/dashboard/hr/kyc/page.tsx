"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { submitHrKYC, getHrKYC, updateHrKYC } from "@/lib/firestore";
import type { HrKYCData } from "@/lib/types";
import { Clock, CheckCircle2, AlertCircle, LogOut, Edit2, ArrowLeft, FileText, Upload, X, Building } from "lucide-react";
import { uploadKYCDocument } from "@/lib/storage";

export default function HrKYCPage() {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [companyName, setCompanyName] = useState(profile?.companyDetails?.name || "");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [website, setWebsite] = useState(profile?.companyDetails?.website || "");
    const [designation, setDesignation] = useState(profile?.companyDetails?.designation || "");
    const [address, setAddress] = useState("");
    const [incorporationCert, setIncorporationCert] = useState("");
    const [idProof, setIdProof] = useState("");
    const [logoUrl, setLogoUrl] = useState(profile?.companyDetails?.logoUrl || "");

    const [idProofFile, setIdProofFile] = useState<File | null>(null);
    const [incorpFile, setIncorpFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        async function fetchHrKyc() {
            if (!user) return;
            setFetching(true);
            try {
                const data = await getHrKYC(user.uid);
                if (data) {
                    setCompanyName(data.companyName);
                    setRegistrationNumber(data.registrationNumber);
                    setWebsite(data.website);
                    setAddress(data.address);
                    setDesignation((data as any).designation || profile?.companyDetails?.designation || "");
                    setIncorporationCert(data.documents?.incorporationCert || "");
                    setIdProof(data.documents?.idProof || "");
                    setLogoUrl(data.logoUrl || "");
                }
            } catch (error) {
                console.error("Error fetching KYC data:", error);
            } finally {
                setFetching(false);
            }
        }
        fetchHrKyc();
    }, [user]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !profile) return;

        // Strict Validation: All fields are mandatory
        if (!companyName.trim()) return toast.error("Company Name is required");
        if (!registrationNumber.trim()) return toast.error("Registration Number is required");
        if (!website.trim()) return toast.error("Company Website is required");
        if (!designation.trim()) return toast.error("Your Designation is required");
        if (!address.trim()) return toast.error("Registered Address is required");

        // Document Validation: Must have either an existing URL or a new file selected
        if (!incorporationCert && !incorpFile) return toast.error("Incorporation Certificate is required");
        if (!idProof && !idProofFile) return toast.error("ID Proof is required");

        setLoading(true);

        try {
            let finalIncorpUrl = incorporationCert;
            let finalIdUrl = idProof;

            setUploading(true);

            if (incorpFile) {
                finalIncorpUrl = await uploadKYCDocument(incorpFile, user.uid, "incorporation");
            }
            if (idProofFile) {
                finalIdUrl = await uploadKYCDocument(idProofFile, user.uid, "id_proof");
            }

            let finalLogoUrl = logoUrl;
            if (logoFile) {
                finalLogoUrl = await uploadKYCDocument(logoFile, user.uid, "logo");
            }

            if (profile.kycStatus === "approved") {
                await updateHrKYC(user.uid, {
                    companyName,
                    registrationNumber,
                    website,
                    address,
                    designation,
                    logoUrl: finalLogoUrl,
                    documents: {
                        incorporationCert: finalIncorpUrl,
                        idProof: finalIdUrl,
                    }
                } as any);
                toast.success("Profile updated successfully!");
            } else {
                const kycData: HrKYCData = {
                    uid: user.uid,
                    hrId: user.uid,
                    companyName,
                    registrationNumber,
                    website,
                    address,
                    logoUrl: finalLogoUrl,
                    documents: {
                        incorporationCert: finalIncorpUrl,
                        idProof: finalIdUrl,
                    },
                    status: "pending",
                    submittedAt: new Date().toISOString(),
                };
                await submitHrKYC(kycData);
                toast.success(profile.kycStatus === "rejected" ? "Verification resubmitted!" : "Verification submitted successfully!");
            }

            await refreshProfile();
            setIsEditing(false);
            setIdProofFile(null);
            setIncorpFile(null);
            setLogoFile(null);
        } catch (error: any) {
            console.error("KYC Submission Error:", error);
            toast.error(`Failed to update: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
            setUploading(false);
        }
    }

    const isApproved = profile?.kycStatus === "approved";
    const isPending = profile?.kycStatus === "pending";
    const isRejected = profile?.kycStatus === "rejected";

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground animate-pulse text-lg">Loading your details...</p>
            </div>
        );
    }

    if (isPending && !isEditing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">Verification in Progress</h2>
                    <p className="text-muted-foreground text-lg">
                        Thank you! Please wait till your profile is under review.
                        We will get back to you as soon as possible.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => router.push("/")}>
                        Go to Home
                    </Button>
                    <Button variant="ghost" onClick={() => signOut()} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </div>
            </div>
        );
    }

    if (isApproved && !isEditing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-bold text-foreground">Account Verified!</h2>
                    <p className="text-muted-foreground text-lg">
                        Your company has been successfully verified. You now have full access to search and hire security professionals.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button size="lg" onClick={() => router.push("/dashboard/hr")}>
                        Go to Dashboard
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Update Profile
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        {isEditing ? "Update Profile" : "Company Verification"}
                    </h2>
                    <p className="text-muted-foreground">
                        {isApproved ? "Update your company information." : "Please verify your company details to access candidate profiles."}
                    </p>
                </div>
                {isEditing && (
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                )}
            </div>

            {isRejected && !isEditing && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 text-destructive">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-semibold">Verification Rejected</p>
                        <p className="text-sm opacity-90">{profile.rejectionReason || "Please check your document details and resubmit."}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setIsEditing(true)}>
                        Fix & Resubmit
                    </Button>
                </div>
            )}

            {(isEditing || (!isApproved && !isPending)) && (
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Company Details</CardTitle>
                        <CardDescription>
                            Review and update your company registration and identity details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isApproved && (
                            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-bold text-foreground">Legal Fields Locked</p>
                                    <p className="text-muted-foreground">For security, your verified company name, registration number, and legal documents cannot be modified. Please contact support if you need to change your legal entity.</p>
                                </div>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col items-center gap-4 py-4 border-b border-border/50">
                                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors relative group">
                                    {logoUrl || logoFile ? (
                                        <img
                                            src={logoFile ? URL.createObjectURL(logoFile) : logoUrl}
                                            alt="Company Logo"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Building className="h-10 w-10 text-muted-foreground/40" />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById("logo-upload")?.click()}
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                        <Upload className="h-6 w-6 text-white" />
                                    </button>
                                </div>
                                <div className="text-center">
                                    <Label className="text-sm font-bold">Company Logo</Label>
                                    <p className="text-xs text-muted-foreground mt-1">Upload your official company logo</p>
                                    <Input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="companyName">Company Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="companyName"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                    disabled={isApproved}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="registrationNumber">Registration Number (CIN/GST) <span className="text-destructive">*</span></Label>
                                <Input
                                    id="registrationNumber"
                                    value={registrationNumber}
                                    onChange={(e) => setRegistrationNumber(e.target.value)}
                                    required
                                    disabled={isApproved}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="website">Website <span className="text-destructive">*</span></Label>
                                <Input
                                    id="website"
                                    placeholder="e.g. https://company.com"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="designation">Your Designation <span className="text-destructive">*</span></Label>
                                <Input
                                    id="designation"
                                    placeholder="e.g. HR Manager, CEO"
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="address">Registered Address <span className="text-destructive">*</span></Label>
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="incorporationCert">Incorporation Certificate <span className="text-destructive">*</span></Label>
                                <div className="flex flex-col gap-3">
                                    {incorporationCert && (
                                        <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-primary" />
                                                <span className="text-sm font-medium">Currently stored certificate</span>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={incorporationCert} target="_blank" rel="noopener noreferrer">View</a>
                                            </Button>
                                        </div>
                                    )}
                                    <div className="relative">
                                        <Input
                                            id="incorporationCert"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                            disabled={isApproved}
                                            onChange={(e) => setIncorpFile(e.target.files?.[0] || null)}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isApproved}
                                            className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                                            onClick={() => document.getElementById("incorporationCert")?.click()}
                                        >
                                            {incorpFile ? (
                                                <span className="flex items-center gap-2 text-primary font-bold">
                                                    <CheckCircle2 className="h-4 w-4" /> {incorpFile.name}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-muted-foreground">
                                                    <Upload className="h-4 w-4" /> {incorporationCert ? "Replace Certificate" : "Upload Certificate (PDF/Image)"}
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="idProof">HR ID Proof (Aadhar/Voter ID/Work ID) <span className="text-destructive">*</span></Label>
                                <div className="flex flex-col gap-3">
                                    {idProof && (
                                        <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-primary" />
                                                <span className="text-sm font-medium">Currently stored ID proof</span>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={idProof} target="_blank" rel="noopener noreferrer">View</a>
                                            </Button>
                                        </div>
                                    )}
                                    <div className="relative">
                                        <Input
                                            id="idProof"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                            disabled={isApproved}
                                            onChange={(e) => setIdProofFile(e.target.files?.[0] || null)}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isApproved}
                                            className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                                            onClick={() => document.getElementById("idProof")?.click()}
                                        >
                                            {idProofFile ? (
                                                <span className="flex items-center gap-2 text-primary font-bold">
                                                    <CheckCircle2 className="h-4 w-4" /> {idProofFile.name}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-muted-foreground">
                                                    <Upload className="h-4 w-4" /> {idProof ? "Replace ID Proof" : "Upload ID Proof (PDF/Image)"}
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="mt-4 h-11" disabled={loading || uploading}>
                                {uploading ? (
                                    <span className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 animate-spin" /> Uploading Documents...
                                    </span>
                                ) : loading ? (
                                    "Saving Details..."
                                ) : (
                                    isApproved ? "Update Profile" : isRejected ? "Resubmit Documents" : "Submit for Verification"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
