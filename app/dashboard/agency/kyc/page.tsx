"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { submitAgencyKYC, getAgencyKYC, updateAgencyKYC } from "@/lib/firestore";
import type { AgencyKYCData } from "@/lib/types";
import { Clock, CheckCircle2, AlertCircle, LogOut, Edit2, ArrowLeft, FileText, Upload, X, Building, Save } from "lucide-react";
import { uploadKYCDocument } from "@/lib/storage";
import { Country, State, City } from "country-state-city";
import { Checkbox } from "@/components/ui/checkbox";

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

export default function AgencyKYCPage() {
    const { user, profile, refreshProfile, signOut } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [companyName, setCompanyName] = useState(profile?.companyDetails?.name || "");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [gstNumber, setGstNumber] = useState("");
    const [psaraLicenseNumber, setPsaraLicenseNumber] = useState("");
    const [website, setWebsite] = useState(profile?.companyDetails?.website || "");
    const [address, setAddress] = useState("");
    const [capacity, setCapacity] = useState("");
    const [sectors, setSectors] = useState<{ category: string; roles: string[] }[]>([]);
    const [serviceLocations, setServiceLocations] = useState<{ country: string; state: string; cities: string[] }[]>([]);
    const [selectedCountryCode, setSelectedCountryCode] = useState("IN");
    const [selectedStateCode, setSelectedStateCode] = useState("");
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    
    const [incorporationCert, setIncorporationCert] = useState("");
    const [gstCertificate, setGstCertificate] = useState("");
    const [psaraLicense, setPsaraLicense] = useState("");
    const [idProof, setIdProof] = useState("");
    const [logoUrl, setLogoUrl] = useState(profile?.companyDetails?.logoUrl || "");

    const [idProofFile, setIdProofFile] = useState<File | null>(null);
    const [incorpFile, setIncorpFile] = useState<File | null>(null);
    const [gstFile, setGstFile] = useState<File | null>(null);
    const [psaraFile, setPsaraFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        async function fetchAgencyKyc() {
            if (!user) return;
            setFetching(true);
            try {
                const data = await getAgencyKYC(user.uid);
                if (data) {
                    setCompanyName(data.companyName);
                    setRegistrationNumber(data.registrationNumber);
                    setGstNumber(data.gstNumber);
                    setPsaraLicenseNumber(data.psaraLicenseNumber);
                    setWebsite(data.website || "");
                    setAddress(data.address);
                    setCapacity(data.capacity.toString());
                    setSectors(data.sectors || []);
                    setServiceLocations((data.serviceLocations || []).map((loc: any) => ({
                        country: loc.country || "India",
                        state: loc.state,
                        cities: loc.cities
                    })));
                    
                    setIncorporationCert(data.documents?.incorporationCert || "");
                    setGstCertificate(data.documents?.gstCertificate || "");
                    setPsaraLicense(data.documents?.psaraLicense || "");
                    setIdProof(data.documents?.idProof || "");
                    setLogoUrl(data.logoUrl || "");
                }
            } catch (error) {
                console.error("Error fetching KYC data:", error);
            } finally {
                setFetching(false);
            }
        }
        fetchAgencyKyc();
    }, [user]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !profile) return;

        if (!companyName.trim()) return toast.error("Company Name is required");
        if (!registrationNumber.trim()) return toast.error("CIN/Registration Number is required");
        if (!gstNumber.trim()) return toast.error("GST Number is required");
        if (!psaraLicenseNumber.trim()) return toast.error("PSARA / Security License Number is required");
        if (!address.trim()) return toast.error("Registered Address is required");
        if (!capacity.trim() || isNaN(Number(capacity))) return toast.error("Total Valid Capacity is required");
        if (sectors.length === 0) return toast.error("Please select at least one Security Sector & Role");
        if (serviceLocations.length === 0) return toast.error("Please add at least one Service Location");

        if (!incorporationCert && !incorpFile) return toast.error("Incorporation Certificate is required");
        if (!gstCertificate && !gstFile) return toast.error("GST Certificate is required");
        if (!psaraLicense && !psaraFile) return toast.error("PSARA License is required");
        if (!idProof && !idProofFile) return toast.error("Owner ID Proof is required");

        setLoading(true);

        try {
            setUploading(true);
            let finalIncorpUrl = incorporationCert;
            let finalGstUrl = gstCertificate;
            let finalPsaraUrl = psaraLicense;
            let finalIdUrl = idProof;
            let finalLogoUrl = logoUrl;

            if (incorpFile) finalIncorpUrl = await uploadKYCDocument(incorpFile, user.uid, "incorporation");
            if (gstFile) finalGstUrl = await uploadKYCDocument(gstFile, user.uid, "gst");
            if (psaraFile) finalPsaraUrl = await uploadKYCDocument(psaraFile, user.uid, "psara");
            if (idProofFile) finalIdUrl = await uploadKYCDocument(idProofFile, user.uid, "id_proof");
            if (logoFile) finalLogoUrl = await uploadKYCDocument(logoFile, user.uid, "logo");

            const capNumber = parseInt(capacity, 10);

            if (profile.kycStatus === "approved") {
                await updateAgencyKYC(user.uid, {
                    website,
                    address,
                    capacity: capNumber,
                    sectors,
                    serviceLocations,
                    logoUrl: finalLogoUrl,
                } as any);
                toast.success("Profile updated successfully!");
            } else {
                const kycData: AgencyKYCData = {
                    uid: user.uid,
                    agencyId: user.uid,
                    companyName,
                    registrationNumber,
                    gstNumber,
                    psaraLicenseNumber,
                    email: user.email || "",
                    website,
                    address,
                    capacity: capNumber,
                    sectors,
                    serviceLocations,
                    logoUrl: finalLogoUrl,
                    documents: {
                        incorporationCert: finalIncorpUrl,
                        gstCertificate: finalGstUrl,
                        psaraLicense: finalPsaraUrl,
                        idProof: finalIdUrl,
                    },
                    status: "pending",
                    submittedAt: new Date().toISOString(),
                };
                await submitAgencyKYC(kycData);
                toast.success(profile.kycStatus === "rejected" ? "Verification resubmitted!" : "Verification submitted successfully!");
            }

            await refreshProfile();
            setIsEditing(false);
            setIdProofFile(null);
            setIncorpFile(null);
            setGstFile(null);
            setPsaraFile(null);
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
                        Thank you! Please wait while your agency profile and licenses are under review.
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
                    <h2 className="text-3xl font-bold text-foreground">Agency Verified!</h2>
                    <p className="text-muted-foreground text-lg">
                        Your agency has been successfully verified. You are now eligible to receive bulk hiring requests.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button size="lg" onClick={() => router.push("/dashboard/agency")}>
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
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isRejected && !isEditing && (
                <div className="mb-8 p-6 rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-lg">Verification Rejected</h3>
                        <p className="mt-1">Reason: {profile.rejectionReason || "Documents unclear or invalid."}</p>
                        <p className="mt-2 text-sm opacity-80">Please update the highlighted information and resubmit your application below.</p>
                    </div>
                </div>
            )}

            <div className="mb-8">
                {isEditing && isApproved && (
                    <Button variant="ghost" className="mb-4" onClick={() => setIsEditing(false)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                )}
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Building className="h-8 w-8 text-primary" />
                    {isEditing && isApproved ? "Update Agency Profile" : "Agency Registration & KYC"}
                </h1>
                <p className="text-muted-foreground mt-2">
                    {isEditing && isApproved 
                        ? "Update your contact details or capacity. Core business identity cannot be changed without re-verification." 
                        : "Complete your profile to prove your authenticity. This is mandatory to receive bulk requests."}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Basic Info */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                            <CardTitle className="text-lg">1. Business Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Company / Agency Name <span className="text-destructive">*</span></Label>
                                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={isEditing && isApproved} required />
                            </div>
                            <div className="space-y-2">
                                <Label>CIN / Registration Number <span className="text-destructive">*</span></Label>
                                <Input value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} disabled={isEditing && isApproved} required />
                            </div>
                            <div className="space-y-2">
                                <Label>GST Number <span className="text-destructive">*</span></Label>
                                <Input value={gstNumber} onChange={e => setGstNumber(e.target.value)} disabled={isEditing && isApproved} required />
                            </div>
                            <div className="space-y-2">
                                <Label>PSARA / Security License Number <span className="text-destructive">*</span></Label>
                                <Input value={psaraLicenseNumber} onChange={e => setPsaraLicenseNumber(e.target.value)} disabled={isEditing && isApproved} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Company Website (Optional)</Label>
                                <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Registered Business Address <span className="text-destructive">*</span></Label>
                                <Input value={address} onChange={e => setAddress(e.target.value)} required />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Capacity & Security Sectors */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                            <CardTitle className="text-lg">2. Workforce & Services</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-6">
                            <div className="space-y-2 md:w-1/2">
                                <Label>Total Available Capacity <span className="text-destructive">*</span></Label>
                                <Input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 500" required />
                                <p className="text-xs text-muted-foreground">The total number of professionals you can deploy.</p>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t">
                                <div>
                                    <Label className="text-base font-semibold">Security Sectors & Roles <span className="text-destructive">*</span></Label>
                                    <p className="text-xs text-muted-foreground mb-4">Select the specific services your agency provides. This helps HRs find you easily.</p>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2">
                                    {SECURITY_SECTORS.map((sector) => {
                                        const currentSector = sectors.find(s => s.category === sector.category || (sector.category === "Other" && s.category.startsWith("Other")));
                                        return (
                                            <div key={sector.category} className="space-y-3 p-4 border rounded-md bg-muted/10">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {sector.category === "Other" ? (
                                                        <Input 
                                                            placeholder="Other Sector Name..."
                                                            className="h-8 text-sm font-semibold bg-background"
                                                            value={currentSector?.category.startsWith("Other: ") ? currentSector.category.replace("Other: ", "") : ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const newSectors = [...sectors];
                                                                const sIdx = newSectors.findIndex(s => s.category === "Other" || s.category.startsWith("Other: "));
                                                                if (sIdx >= 0) {
                                                                    newSectors[sIdx].category = val ? `Other: ${val}` : "Other";
                                                                    setSectors(newSectors);
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <h4 className="font-semibold text-sm text-primary">{sector.category}</h4>
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    {sector.roles.map((role) => {
                                                        const isOtherRole = role === "Other";
                                                        const customRoleValue = currentSector?.roles.find(r => r.startsWith("Other: "))?.replace("Other: ", "") || "";
                                                        const isChecked = isOtherRole 
                                                            ? currentSector?.roles.some(r => r.startsWith("Other")) 
                                                            : currentSector?.roles.includes(role) || false;

                                                        return (
                                                            <div key={role} className="space-y-2">
                                                                <div className="flex items-start space-x-2">
                                                                    <Checkbox 
                                                                        id={`role-${sector.category}-${role}`} 
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) => {
                                                                            const newSectors = [...sectors];
                                                                            let sIdx = newSectors.findIndex(s => s.category === sector.category || (sector.category === "Other" && s.category.startsWith("Other")));
                                                                            
                                                                            if (checked) {
                                                                                if (sIdx >= 0) {
                                                                                    if (isOtherRole) {
                                                                                        if (!newSectors[sIdx].roles.some(r => r.startsWith("Other"))) {
                                                                                            newSectors[sIdx].roles.push("Other");
                                                                                        }
                                                                                    } else {
                                                                                        newSectors[sIdx].roles.push(role);
                                                                                    }
                                                                                } else {
                                                                                    newSectors.push({ 
                                                                                        category: sector.category, 
                                                                                        roles: [isOtherRole ? "Other" : role] 
                                                                                    });
                                                                                }
                                                                            } else {
                                                                                if (sIdx >= 0) {
                                                                                    if (isOtherRole) {
                                                                                        newSectors[sIdx].roles = newSectors[sIdx].roles.filter(r => !r.startsWith("Other"));
                                                                                    } else {
                                                                                        newSectors[sIdx].roles = newSectors[sIdx].roles.filter(r => r !== role);
                                                                                    }
                                                                                    if (newSectors[sIdx].roles.length === 0) {
                                                                                        newSectors.splice(sIdx, 1);
                                                                                    }
                                                                                }
                                                                            }
                                                                            setSectors(newSectors);
                                                                        }}
                                                                    />
                                                                    <Label htmlFor={`role-${sector.category}-${role}`} className="text-sm font-normal leading-none cursor-pointer">
                                                                        {role}
                                                                    </Label>
                                                                </div>
                                                                {isOtherRole && isChecked && (
                                                                    <Input 
                                                                        placeholder="Specify role..."
                                                                        className="h-8 ml-6 text-xs"
                                                                        value={customRoleValue}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            const newSectors = [...sectors];
                                                                            const sIdx = newSectors.findIndex(s => s.category === sector.category || (sector.category === "Other" && s.category.startsWith("Other")));
                                                                            if (sIdx >= 0) {
                                                                                newSectors[sIdx].roles = newSectors[sIdx].roles.map(r => r.startsWith("Other") ? (val ? `Other: ${val}` : "Other") : r);
                                                                                setSectors(newSectors);
                                                                            }
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Locations */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                            <CardTitle className="text-lg">Service Locations (Pan-India)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {serviceLocations.length > 0 && (
                                <div className="space-y-3 mb-6">
                                    <Label>Added Locations</Label>
                                    <div className="grid gap-3">
                                        {serviceLocations.map((loc, index) => (
                                            <div key={index} className="flex justify-between items-start p-3 border rounded-md bg-muted/20">
                                                <div>
                                                    <p className="font-semibold text-primary">{loc.country && `${loc.country}, `}{loc.state}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{loc.cities.join(", ")}</p>
                                                </div>
                                                <button type="button" onClick={() => {
                                                    const updated = [...serviceLocations];
                                                    updated.splice(index, 1);
                                                    setServiceLocations(updated);
                                                }} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                                <div className="space-y-2">
                                    <Label>Select Country</Label>
                                    <select 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedCountryCode}
                                        onChange={(e) => {
                                            setSelectedCountryCode(e.target.value);
                                            setSelectedStateCode("");
                                            setSelectedCities([]);
                                        }}
                                    >
                                        {Country.getAllCountries().map(country => (
                                            <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Select State</Label>
                                    <select 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedStateCode}
                                        onChange={(e) => {
                                            setSelectedStateCode(e.target.value);
                                            setSelectedCities([]);
                                        }}
                                    >
                                        <option value="">-- Select State --</option>
                                        {selectedCountryCode && State.getStatesOfCountry(selectedCountryCode).map(state => (
                                            <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                                    <Label>Select Cities (Multiple)</Label>
                                    <select 
                                        multiple
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedCities}
                                        onChange={(e) => {
                                            const values = Array.from(e.target.selectedOptions, option => option.value);
                                            setSelectedCities(values);
                                        }}
                                        disabled={!selectedStateCode}
                                    >
                                        {selectedStateCode && City.getCitiesOfState(selectedCountryCode, selectedStateCode).map(city => (
                                            <option key={city.name} value={city.name}>{city.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-muted-foreground">Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</p>
                                </div>
                                <Button 
                                    type="button" 
                                    className="md:col-span-2 lg:col-span-3 mt-2"
                                    disabled={!selectedStateCode || selectedCities.length === 0}
                                    onClick={() => {
                                        const countryName = Country.getCountryByCode(selectedCountryCode)?.name || "";
                                        const stateName = State.getStateByCodeAndCountry(selectedStateCode, selectedCountryCode)?.name || "";
                                        const existingIndex = serviceLocations.findIndex(s => s.state === stateName && s.country === countryName);
                                        if (existingIndex >= 0) {
                                            const updated = [...serviceLocations];
                                            const combinedCities = Array.from(new Set([...updated[existingIndex].cities, ...selectedCities]));
                                            updated[existingIndex].cities = combinedCities;
                                            setServiceLocations(updated);
                                        } else {
                                            setServiceLocations([...serviceLocations, { country: countryName, state: stateName, cities: selectedCities }]);
                                        }
                                        setSelectedStateCode("");
                                        setSelectedCities([]);
                                    }}
                                >
                                    Add Selected Locations
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Document Uploads */}
                    {!(isEditing && isApproved) && (
                        <Card className="border-border/60 shadow-sm overflow-hidden border-l-4 border-l-primary">
                            <CardHeader className="bg-primary/5 border-b border-border/50 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    3. Legal Document Uploads
                                </CardTitle>
                                <CardDescription>Upload clear, legible copies of your official documents in PDF or Image format.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Incorporation / Registration Certificate <span className="text-destructive">*</span></Label>
                                        <div className="flex items-center gap-2">
                                            <Input type="file" onChange={e => setIncorpFile(e.target.files?.[0] || null)} accept="image/*,.pdf" className="cursor-pointer" />
                                            {incorporationCert && !incorpFile && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>GST Certificate <span className="text-destructive">*</span></Label>
                                        <div className="flex items-center gap-2">
                                            <Input type="file" onChange={e => setGstFile(e.target.files?.[0] || null)} accept="image/*,.pdf" className="cursor-pointer" />
                                            {gstCertificate && !gstFile && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>PSARA / Agency License <span className="text-destructive">*</span></Label>
                                        <div className="flex items-center gap-2">
                                            <Input type="file" onChange={e => setPsaraFile(e.target.files?.[0] || null)} accept="image/*,.pdf" className="cursor-pointer" />
                                            {psaraLicense && !psaraFile && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Owner ID Proof (Aadhar/PAN) <span className="text-destructive">*</span></Label>
                                        <div className="flex items-center gap-2">
                                            <Input type="file" onChange={e => setIdProofFile(e.target.files?.[0] || null)} accept="image/*,.pdf" className="cursor-pointer" />
                                            {idProof && !idProofFile && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Logo Upload - Always available during edit/reg */}
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building className="h-5 w-5 text-primary" />
                                4. Brand Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="h-32 w-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/20 overflow-hidden shrink-0">
                                    {logoUrl || logoFile ? (
                                        <img 
                                            src={logoFile ? URL.createObjectURL(logoFile) : logoUrl} 
                                            alt="Preview" 
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Building className="h-10 w-10 text-muted-foreground opacity-20" />
                                    )}
                                </div>
                                <div className="space-y-2 flex-1">
                                    <Label>Company Logo</Label>
                                    <p className="text-xs text-muted-foreground mb-4">Recommended: Square image, max 2MB.</p>
                                    <div className="flex items-center gap-2">
                                        <Input type="file" onChange={e => setLogoFile(e.target.files?.[0] || null)} accept="image/*" className="cursor-pointer" />
                                        {logoUrl && !logoFile && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4 pt-4">
                        {isEditing && isApproved && (
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" size="lg" disabled={loading} className="w-full md:w-auto min-w-[200px]">
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {uploading ? "Uploading Documents..." : "Saving..."}
                                </>
                            ) : (
                                <>
                                    {isEditing && isApproved ? <Save className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isEditing && isApproved ? "Save Changes" : "Submit for Verification"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
