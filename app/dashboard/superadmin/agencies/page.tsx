"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, MapPin, Users, Briefcase, PlusCircle, Loader2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import type { AgencyKYCData } from "@/lib/types";
import { updateAgencyKYCStatus, createNotification, updateHiringFinalStatus } from "@/lib/firestore";
import { sendEmail } from "@/lib/email";

export default function SuperAdminAgenciesPage() {
    const { profile } = useAuth();
    const [agencies, setAgencies] = useState<AgencyKYCData[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Bulk Request Modal State
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedAgency, setSelectedAgency] = useState<AgencyKYCData | null>(null);
    const [requestCount, setRequestCount] = useState("");
    const [requestMessage, setRequestMessage] = useState("");
    const [selectedSector, setSelectedSector] = useState("");
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [submittingRequest, setSubmittingRequest] = useState(false);

    // Sent Requests State
    const [sentRequests, setSentRequests] = useState<any[]>([]);
    const [fetchingRequests, setFetchingRequests] = useState(false);

    // Agency Details Modal State
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAgencyDetails, setSelectedAgencyDetails] = useState<AgencyKYCData | null>(null);
    const [headName, setHeadName] = useState<string>("Loading...");
    const [headEmail, setHeadEmail] = useState<string>("Loading...");

    const [pendingAgencies, setPendingAgencies] = useState<AgencyKYCData[]>([]);

    const fetchAgencies = async () => {
        try {
            const qApproved = query(collection(db, "agency_kyc"), where("status", "==", "approved"));
            const qPending = query(collection(db, "agency_kyc"), where("status", "==", "pending"));
            
            const [snapApproved, snapPending] = await Promise.all([getDocs(qApproved), getDocs(qPending)]);
            
            setAgencies(snapApproved.docs.map(doc => ({ ...doc.data(), agencyId: doc.id } as AgencyKYCData)));
            setPendingAgencies(snapPending.docs.map(doc => ({ ...doc.data(), agencyId: doc.id } as AgencyKYCData)));
        } catch (error) {
            console.error("Error fetching agencies:", error);
            toast.error("Failed to load agencies");
        } finally {
            setLoading(false);
        }
    };

    const fetchSentRequests = async () => {
        if (!profile) return;
        setFetchingRequests(true);
        try {
            const { orderBy } = await import("firebase/firestore");
            const q = query(
                collection(db, "hiring_requests"),
                where("hrId", "==", profile.uid),
                where("isBulk", "==", true),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            setSentRequests(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        } catch (error) {
            console.error("Error fetching sent requests:", error);
        } finally {
            setFetchingRequests(false);
        }
    };

    useEffect(() => {
        fetchAgencies();
        fetchSentRequests();
    }, [profile]);

    const handleFinalizeDeal = async (requestId: string) => {
        const confirm = window.confirm("Are you sure you want to finalize this deal? This will mark the request as successfully hired.");
        if (!confirm) return;

        try {
            await updateHiringFinalStatus(requestId, "hired");
            toast.success("Deal finalized successfully!");
            fetchSentRequests(); // Refresh the list
        } catch (err) {
            console.error("Failed to finalize deal:", err);
            toast.error("Failed to finalize deal");
        }
    };

    const handleApproval = async (agencyId: string, approved: boolean) => {
        try {
            await updateAgencyKYCStatus(
                agencyId,
                approved ? "approved" : "rejected",
                "admin",
                approved ? undefined : "Declined by Admin"
            );
            toast.success(approved ? "Agency Approved" : "Agency Rejected");
            fetchAgencies();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const openRequestModal = (agency: AgencyKYCData) => {
        setSelectedAgency(agency);
        setIsRequestModalOpen(true);
        setRequestCount("");
        setRequestMessage("");
        setSelectedSector("");
        setSelectedRoles([]);
        setSelectedState("");
        setSelectedCity("");
    };

    const openDetailsModal = async (agency: AgencyKYCData) => {
        setSelectedAgencyDetails(agency);
        setIsDetailsModalOpen(true);
        setHeadName("Loading...");
        setHeadEmail("Loading...");
        try {
            const { doc, getDoc } = await import("firebase/firestore");
            const userDoc = await getDoc(doc(db, "users", agency.agencyId));
            if (userDoc.exists()) {
                setHeadName(userDoc.data().fullName || "Unknown");
                setHeadEmail(userDoc.data().email || agency.email || "Unknown");
            } else {
                setHeadName("Unknown");
                setHeadEmail(agency.email || "Unknown");
            }
        } catch (e) {
            setHeadName("Unknown");
            setHeadEmail(agency.email || "Unknown");
        }
    };

    const handleSendBulkRequest = async () => {
        if (!selectedAgency || !profile) return;
        
        const count = parseInt(requestCount, 10);
        if (isNaN(count) || count <= 0) {
            return toast.error("Please enter a valid number of professionals required.");
        }

        if (count > selectedAgency.capacity) {
            return toast.error(`Requested count exceeds agency's total capacity (${selectedAgency.capacity}).`);
        }

        if (!selectedSector) {
            return toast.error("Please select a sector.");
        }

        if (selectedRoles.length === 0) {
            return toast.error("Please select at least one sub-sector/role.");
        }

        if (!selectedState || !selectedCity) {
            return toast.error("Please specify a location preference (State and City).");
        }

        setSubmittingRequest(true);
        try {
            // Fetch agency's actual email - prioritize KYC doc email, fallback to users collection
            let agencyEmail = selectedAgency.email;
            
            if (!agencyEmail) {
                const { doc, getDoc } = await import("firebase/firestore");
                const agencyUserDoc = await getDoc(doc(db, "users", selectedAgency.agencyId));
                agencyEmail = agencyUserDoc.exists() ? agencyUserDoc.data().email : null;
            }

            if (!agencyEmail || agencyEmail === "unknown@agency.com") {
                toast.error("Could not verify agency email address. Please contact support.");
                setSubmittingRequest(false);
                return;
            }

            const requestData = {
                hrId: profile.uid,
                hrName: profile.fullName || "Platform SuperAdmin",
                hrRole: "superadmin",
                hrEmail: profile.email,
                companyName: "Internal Platform Request",
                guardId: "BULK",
                guardName: selectedAgency.companyName,
                guardEmail: agencyEmail,
                agencyId: selectedAgency.agencyId,
                status: "pending",
                message: requestMessage || `We urgently need ${count} professionals from your agency. Please review and accept to proceed.`,
                createdAt: new Date().toISOString(),
                isBulk: true,
                bulkCount: count,
                selectedSector,
                selectedRoles,
                locationPreference: `${selectedCity}, ${selectedState}`,
            };

            await addDoc(collection(db, "hiring_requests"), requestData);

            // 1. Notify Agency via Email
            await sendEmail({
                to: agencyEmail,
                subject: "New Workforce Hiring Request 📩",
                template: "hired",
                data: {
                    fullName: selectedAgency.companyName,
                    companyName: "TheNST Platform",
                    hrName: profile.fullName || "SuperAdmin",
                    message: requestData.message
                }
            }).catch(console.error);

            // 2. Notify Agency via In-App Notification
            await createNotification(selectedAgency.agencyId, {
                title: "New High-Priority Workforce Request!",
                message: `TheNST Admin has requested ${count} professionals from your agency.`,
                type: "info",
                link: "/dashboard/agency/requests"
            });
            
            toast.success("Hiring request sent to agency!");
            setIsRequestModalOpen(false);
            fetchSentRequests(); // Refresh sent requests list
        } catch (error) {
            console.error("Error sending bulk request:", error);
            toast.error("Failed to send request.");
        } finally {
            setSubmittingRequest(false);
        }
    };

    const handleRevoke = async () => {
        if (!selectedAgencyDetails || !profile) return;
        try {
            await updateAgencyKYCStatus(selectedAgencyDetails.agencyId, "rejected", profile.uid, "Admin requested profile update");
            toast.success("Verification revoked successfully");
            setIsDetailsModalOpen(false);
            fetchAgencies();
        } catch (error) {
            console.error(error);
            toast.error("Failed to revoke verification");
        }
    };

    return (
        <RoleGuard allowedRoles={["superadmin"]}>
            <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Building className="h-8 w-8 text-primary" />
                        Verified Security Agencies
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Browse registered security agencies and send them workforce requests directly.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="approved" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="approved">Approved Agencies ({agencies.length})</TabsTrigger>
                            <TabsTrigger value="pending">Pending Verification ({pendingAgencies.length})</TabsTrigger>
                            <TabsTrigger value="requests">Sent Requests ({sentRequests.length})</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="approved">
                            {agencies.length === 0 ? (
                                <Card className="border-border/60 shadow-sm">
                                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                        <Building className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                        <h3 className="text-lg font-medium">No Verified Agencies</h3>
                                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                                            There are currently no approved agencies on the platform.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {agencies.map((agency) => (
                                        <Card key={agency.agencyId} className="border-border/60 shadow-sm hover:border-primary/30 transition-colors flex flex-col">
                                            <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    {agency.logoUrl ? (
                                                        <img src={agency.logoUrl} alt="Logo" className="h-10 w-10 rounded-md object-cover border border-border" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                            <Building className="h-5 w-5 text-muted-foreground opacity-50" />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <CardTitle className="text-xl line-clamp-1">{agency.companyName}</CardTitle>
                                                        <CardDescription className="flex items-center gap-1 text-xs">
                                                            <MapPin className="h-3 w-3" />
                                                            {agency.address}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openDetailsModal(agency)} title="View Details">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="flex-1 pb-4">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50 border border-border/50">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-primary" />
                                                            <span className="text-sm font-medium">Total Capacity</span>
                                                        </div>
                                                        <span className="font-bold text-lg">{agency.capacity}</span>
                                                    </div>
                                                    
                                                    <div>
                                                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Security Sectors</p>
                                                        {agency.sectors && agency.sectors.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {agency.sectors.map((sector, idx) => (
                                                                    <div key={idx} className="bg-muted/30 p-1.5 rounded-md border border-border/50">
                                                                        <p className="text-[10px] font-semibold text-primary mb-1">
                                                                            {sector.category.startsWith("Other: ") ? sector.category.replace("Other: ", "") : sector.category}
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {sector.roles.map((role, rIdx) => (
                                                                                <Badge key={rIdx} variant="secondary" className="bg-background text-[9px] border-border/60">
                                                                                    {role.startsWith("Other: ") ? role.replace("Other: ", "") : role}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {agency.specialties?.map((spec, i) => (
                                                                    <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                                                        {spec}
                                                                    </Badge>
                                                                )) || <span className="text-xs text-muted-foreground">No services listed</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div>
                                                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Service Locations</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {agency.serviceLocations && agency.serviceLocations.length > 0 ? (
                                                                agency.serviceLocations.map((loc, i) => (
                                                                    <Badge key={i} variant="outline" className="text-[10px]">
                                                                        {loc.country && `${loc.country}, `}{loc.state}
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">Pan-India</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <div className="p-4 pt-0 mt-auto">
                                                <Button className="w-full" onClick={() => openRequestModal(agency)}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Request Workforce
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        
                        <TabsContent value="pending">
                            {pendingAgencies.length === 0 ? (
                                <Card className="border-border/60 shadow-sm">
                                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                        <Building className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                        <h3 className="text-lg font-medium">No Pending Applications</h3>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {pendingAgencies.map((agency) => (
                                        <Card key={agency.agencyId} className="border-border/60 shadow-sm flex flex-col">
                                            <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    {agency.logoUrl ? (
                                                        <img src={agency.logoUrl} alt="Logo" className="h-10 w-10 rounded-md object-cover border border-border" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                                            <Building className="h-5 w-5 text-muted-foreground opacity-50" />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <CardTitle className="text-xl line-clamp-1">{agency.companyName}</CardTitle>
                                                        <CardDescription className="flex items-center gap-1 text-xs">
                                                            <MapPin className="h-3 w-3" />
                                                            {agency.address}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openDetailsModal(agency)} title="View Details">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="flex-1 pb-4">
                                                <div className="space-y-2 text-sm">
                                                    <p><span className="font-semibold text-muted-foreground">GST:</span> {agency.gstNumber}</p>
                                                    <p><span className="font-semibold text-muted-foreground">PSARA:</span> {agency.psaraLicenseNumber}</p>
                                                    <p><span className="font-semibold text-muted-foreground">Capacity:</span> {agency.capacity}</p>
                                                    <p><span className="font-semibold text-muted-foreground">Locations:</span> {agency.serviceLocations && agency.serviceLocations.length > 0 ? agency.serviceLocations.map(l => `${l.country ? l.country + ", " : ""}${l.state}`).join("; ") : "Pan-India"}</p>
                                                </div>
                                            </CardContent>
                                            <div className="p-4 pt-0 mt-auto flex gap-2">
                                                <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10" onClick={() => handleApproval(agency.agencyId, false)}>
                                                    Reject
                                                </Button>
                                                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApproval(agency.agencyId, true)}>
                                                    Approve
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="requests">
                            {fetchingRequests ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : sentRequests.length === 0 ? (
                                <Card className="border-border/60 shadow-sm">
                                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                        <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                                        <h3 className="text-lg font-medium">No Sent Requests</h3>
                                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                                            You haven't sent any bulk workforce requests yet.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4">
                                    {sentRequests.map((req) => (
                                        <Card key={req.id} className="border-border/60 shadow-sm overflow-hidden group">
                                            <CardContent className="p-0">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <Building className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-lg">{req.guardName}</h4>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                                <span>{req.bulkCount} Professionals</span>
                                                                <span>•</span>
                                                                <span>{req.selectedSector}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col md:items-end gap-2">
                                                        <Badge variant={
                                                            req.status === "pending" ? "outline" : 
                                                            req.status === "accepted" ? "default" : "destructive"
                                                        } className={`px-4 py-1 text-sm font-semibold capitalize ${
                                                            req.status === "accepted" ? "bg-green-600 hover:bg-green-700" : ""
                                                        }`}>
                                                            {req.status}
                                                        </Badge>
                                                        <p className="text-xs text-muted-foreground">
                                                            Sent on {new Date(req.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="px-5 pb-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Required Roles</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {req.selectedRoles?.map((role: string, idx: number) => (
                                                                <Badge key={idx} variant="secondary" className="text-[10px] bg-background">
                                                                    {role.startsWith("Other: ") ? role.replace("Other: ", "") : role}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Location</p>
                                                        <p className="text-sm font-medium">{req.locationPreference}</p>
                                                    </div>
                                                </div>

                                                {req.status === "accepted" && (
                                                    <div className="bg-primary/5 p-3 flex justify-end gap-3 border-t border-primary/10">
                                                        <Button 
                                                            size="sm" 
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                                            onClick={() => handleFinalizeDeal(req.id)}
                                                        >
                                                            Finalize Deal
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold"
                                                            onClick={() => window.location.href = `/dashboard/messages?chat=${req.chatRoomId || req.id}&req=${req.id}`}
                                                        >
                                                            <MessageSquare className="h-4 w-4 mr-2" /> Open Chat
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Bulk Request Modal */}
                <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Send Bulk Request</DialogTitle>
                            <DialogDescription>
                                Request personnel from <span className="font-bold text-foreground">{selectedAgency?.companyName}</span>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="grid gap-2">
                                <Label htmlFor="sector">Select Sector</Label>
                                <Select value={selectedSector} onValueChange={(val) => {
                                    setSelectedSector(val);
                                    setSelectedRoles([]);
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a sector" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedAgency?.sectors?.map((sector, idx) => (
                                            <SelectItem key={idx} value={sector.category}>
                                                {sector.category.startsWith("Other: ") ? sector.category.replace("Other: ", "") : sector.category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedSector && (
                                <div className="grid gap-2">
                                    <Label>Select Roles / Sub-Sectors</Label>
                                    <div className="grid grid-cols-2 gap-3 border rounded-md p-3 bg-muted/30">
                                        {selectedAgency?.sectors?.find(s => s.category === selectedSector)?.roles.map((role, idx) => (
                                            <div key={idx} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`role-${idx}`} 
                                                    checked={selectedRoles.includes(role)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedRoles([...selectedRoles, role]);
                                                        } else {
                                                            setSelectedRoles(selectedRoles.filter(r => r !== role));
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`role-${idx}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {role.startsWith("Other: ") ? role.replace("Other: ", "") : role}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="state">Select State / Region</Label>
                                <Select value={selectedState} onValueChange={(val) => {
                                    setSelectedState(val);
                                    setSelectedCity("");
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedAgency?.serviceLocations?.map((loc, idx) => (
                                            <SelectItem key={idx} value={loc.state}>
                                                {loc.state}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedState && (
                                <div className="grid gap-2">
                                    <Label htmlFor="city">Select City</Label>
                                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select city" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedAgency?.serviceLocations?.find(l => l.state === selectedState)?.cities.map((city, idx) => (
                                                <SelectItem key={idx} value={city}>
                                                    {city}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="count">Number of Professionals Needed</Label>
                                <Input
                                    id="count"
                                    type="number"
                                    min="1"
                                    max={selectedAgency?.capacity || 100}
                                    placeholder="e.g. 50"
                                    value={requestCount}
                                    onChange={(e) => setRequestCount(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Max available capacity: {selectedAgency?.capacity}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="message">Custom Message (Optional)</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Describe any additional job requirements or site details..."
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSendBulkRequest} disabled={submittingRequest}>
                                {submittingRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Briefcase className="mr-2 h-4 w-4" />}
                                Send Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Agency Details Modal */}
                <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Agency Full Details</DialogTitle>
                            <DialogDescription className="flex items-center gap-4">
                                {selectedAgencyDetails?.logoUrl && (
                                    <img src={selectedAgencyDetails?.logoUrl} alt="Logo" className="h-12 w-12 rounded-md object-cover border border-border" />
                                )}
                                <span>Review all submitted information before approval.</span>
                            </DialogDescription>
                        </DialogHeader>
                        {selectedAgencyDetails && (
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Company Name</p>
                                        <p className="font-medium">{selectedAgencyDetails.companyName}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Head of Agency</p>
                                        <p className="font-medium">{headName}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Agency Email</p>
                                        <p className="font-medium">{headEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">CIN/Registration</p>
                                        <p className="font-medium">{selectedAgencyDetails.registrationNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">GST Number</p>
                                        <p className="font-medium">{selectedAgencyDetails.gstNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">PSARA License</p>
                                        <p className="font-medium">{selectedAgencyDetails.psaraLicenseNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Total Capacity</p>
                                        <p className="font-medium">{selectedAgencyDetails.capacity}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Website</p>
                                        <p className="font-medium">{selectedAgencyDetails.website || "N/A"}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground">Address</p>
                                        <p className="font-medium">{selectedAgencyDetails.address}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground">Security Sectors & Roles</p>
                                        {selectedAgencyDetails.sectors && selectedAgencyDetails.sectors.length > 0 ? (
                                            <div className="mt-2 space-y-3">
                                                {selectedAgencyDetails.sectors.map((sector, idx) => (
                                                    <div key={idx} className="bg-muted/30 p-3 rounded-md border border-border/50">
                                                        <p className="text-sm font-semibold text-foreground mb-2">
                                                            {sector.category.startsWith("Other: ") ? sector.category.replace("Other: ", "") : sector.category}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {sector.roles.map((role, rIdx) => (
                                                                <Badge key={rIdx} variant="secondary" className="bg-background border-border/60 font-medium">
                                                                    {role.startsWith("Other: ") ? role.replace("Other: ", "") : role}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedAgencyDetails.specialties?.map((s, i) => (
                                                    <Badge key={i} variant="outline">{s}</Badge>
                                                )) || <span className="text-sm text-muted-foreground">No services listed</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground">Service Locations</p>
                                        <div className="mt-1 space-y-2">
                                            {selectedAgencyDetails.serviceLocations && selectedAgencyDetails.serviceLocations.length > 0 ? (
                                                selectedAgencyDetails.serviceLocations.map((loc, i) => (
                                                    <div key={i} className="text-sm border-l-2 border-primary/20 pl-2">
                                                        <span className="font-semibold">{loc.country && `${loc.country}, `}{loc.state}</span>
                                                        <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">{loc.cities.join(", ")}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm">Pan-India (No specific restrictions)</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-semibold mb-3 border-b pb-2">Uploaded Documents</h4>
                                    <div className="grid gap-3">
                                        {selectedAgencyDetails.documents?.incorporationCert && (
                                            <a href={selectedAgencyDetails.documents.incorporationCert} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-3 rounded border hover:bg-muted/50 transition-colors">
                                                <span className="text-sm font-medium">Incorporation Certificate</span>
                                                <ExternalLink className="h-4 w-4 text-primary" />
                                            </a>
                                        )}
                                        {selectedAgencyDetails.documents?.gstCertificate && (
                                            <a href={selectedAgencyDetails.documents.gstCertificate} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-3 rounded border hover:bg-muted/50 transition-colors">
                                                <span className="text-sm font-medium">GST Certificate</span>
                                                <ExternalLink className="h-4 w-4 text-primary" />
                                            </a>
                                        )}
                                        {selectedAgencyDetails.documents?.psaraLicense && (
                                            <a href={selectedAgencyDetails.documents.psaraLicense} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-3 rounded border hover:bg-muted/50 transition-colors">
                                                <span className="text-sm font-medium">PSARA License</span>
                                                <ExternalLink className="h-4 w-4 text-primary" />
                                            </a>
                                        )}
                                        {selectedAgencyDetails.documents?.idProof && (
                                            <a href={selectedAgencyDetails.documents.idProof} target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-3 rounded border hover:bg-muted/50 transition-colors">
                                                <span className="text-sm font-medium">Owner ID Proof</span>
                                                <ExternalLink className="h-4 w-4 text-primary" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter className="gap-2 sm:justify-between">
                            <Button variant="ghost" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
                            {selectedAgencyDetails?.status === "approved" && (
                                <Button variant="destructive" onClick={handleRevoke}>
                                    Revoke Verification
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </RoleGuard>
    );
}
