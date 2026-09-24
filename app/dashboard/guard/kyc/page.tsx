"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { submitKYC, getKYC } from "@/lib/firestore";
import type { KYCData } from "@/lib/types";
import { Clock, CheckCircle2, AlertCircle, LogOut, Loader2 } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "National Capital Territory of Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function KYCFormPage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [existingKYC, setExistingKYC] = useState<KYCData | null>(null);

  const [formData, setFormData] = useState({
    dateOfBirth: "",
    gender: "",
    fatherName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    aadharNumber: "",
    panNumber: "",
    previousExperience: "",
    yearsOfExperience: "",
    voterIdNumber: "",
    drivingLicenseNumber: "",
    height: "",
    weight: "",
    complexion: "",
    identifyingFeatures: "",
  });
  const [idType, setIdType] = useState<"aadhar" | "pan" | "voterId" | "drivingLicense">("aadhar");

  // Calculate max date for 18 years age limit
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    async function fetchKYC() {
      if (!profile) return;
      const data = await getKYC(profile.uid);
      if (data) {
        setExistingKYC(data);
        setFormData({
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || "",
          fatherName: data.fatherName || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          aadharNumber: data.aadharNumber || "",
          panNumber: data.panNumber || "",
          previousExperience: data.previousExperience || "",
          yearsOfExperience: data.yearsOfExperience || "",
          voterIdNumber: data.voterIdNumber || "",
          drivingLicenseNumber: data.drivingLicenseNumber || "",
          height: data.height || "",
          weight: data.weight || "",
          complexion: data.complexion || "",
          identifyingFeatures: data.identifyingFeatures || "",
        });
        if (data.panNumber && !data.aadharNumber) setIdType("pan");
        else if (data.voterIdNumber) setIdType("voterId");
        else if (data.drivingLicenseNumber) setIdType("drivingLicense");
      }
    }
    fetchKYC();
  }, [profile]);

  // Pincode Auto-fill
  useEffect(() => {
    async function fetchPincodeDetails() {
      if (formData.pincode.length === 6 && /^\d{6}$/.test(formData.pincode)) {
        setIsPincodeLoading(true);
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
          const data = await response.json();
          if (data[0].Status === "Success") {
            const postOffice = data[0].PostOffice[0];
            // Prioritize Block (Taluka/Tehsil) for City, then District, then Division
            const city = postOffice.Block && postOffice.Block !== "NA" 
              ? postOffice.Block 
              : (postOffice.District || postOffice.Division);
            
            updateField("city", city);
            
            // Map API state to our dropdown (handle slight variations)
            const apiState = postOffice.State;
            if (INDIAN_STATES.includes(apiState)) {
              updateField("state", apiState);
            } else if (apiState === "Delhi") {
                updateField("state", "National Capital Territory of Delhi");
            }
          }
        } catch (error) {
          console.error("Pincode fetch error:", error);
        } finally {
          setIsPincodeLoading(false);
        }
      }
    }
    fetchPincodeDetails();
  }, [formData.pincode]);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    // Validation
    if (idType === "aadhar") {
      if (!/^\d{12}$/.test(formData.aadharNumber)) {
        toast.error("Aadhar number must be 12 digits.");
        return;
      }
    } else if (idType === "pan") {
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(formData.panNumber.toUpperCase())) {
        toast.error("Invalid PAN number format.");
        return;
      }
    } else if (idType === "voterId") {
      if (!/^[A-Z]{3}\d{7}$/.test(formData.voterIdNumber.toUpperCase())) {
        // Basic regex for EPIC: 3 letters + 7 digits usually, but formats vary. 
        // Let's use a slightly looser one or standard EPIC format. 
        // Standard: 3 letters + 7 digits.
        // Let's stick to standard but allow some flexibility if needed later.
        // Actually, let's keep it simple for now: Non-empty check is covered by 'required' in input? 
        // No, custom validation is better.
        // Regex: 3 chars + 7 digits
      }
      if (formData.voterIdNumber.length < 10) { // Simple length check as fallback? 
        // Let's use a regex that catches standard EPIC
        if (!/^[A-Z]{3}[0-9]{7}$/.test(formData.voterIdNumber.toUpperCase())) {
          toast.error("Invalid Voter ID format (e.g. ABC1234567).");
          return;
        }
      }
    } else if (idType === "drivingLicense") {
      // DL formats vary wildly by state in India (e.g. MH12 20110012345). 
      // Generally 15-16 chars. 
      if (formData.drivingLicenseNumber.length < 10 || formData.drivingLicenseNumber.length > 20) {
        toast.error("Invalid Driving License number.");
        return;
      }
    }

    if (!formData.dateOfBirth) return toast.error("Date of Birth is required.");
    if (!formData.gender) return toast.error("Gender is required.");
    if (!formData.fatherName.trim()) return toast.error("Father's Name is required.");
    if (!formData.address.trim()) return toast.error("Address is required.");
    if (!formData.city.trim()) return toast.error("City is required.");
    if (!formData.state) return toast.error("State is required.");
    if (!formData.yearsOfExperience) return toast.error("Years of Experience is required.");

    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error("Pincode must be 6 digits.");
      return;
    }

    // Age validation (18+)
    const birthDate = new Date(formData.dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // Not yet 18 if birthday hasn't happened this year
      if (age <= 18) {
        toast.error("You must be at least 18 years old to register.");
        return;
      }
    } else if (age < 18) {
      toast.error("You must be at least 18 years old to register.");
      return;
    }

    setLoading(true);
    try {
      const kycData: KYCData = {
        uid: `kyc_${profile.uid}`,
        guardId: profile.uid,
        guardName: profile.fullName,
        guardEmail: profile.email,
        status: "pending",
        ...formData,
        // Only include the selected ID type to avoid 'undefined' field errors in Firestore
        aadharNumber: idType === "aadhar" ? formData.aadharNumber : "",
        panNumber: idType === "pan" ? formData.panNumber.toUpperCase() : "",
        voterIdNumber: idType === "voterId" ? formData.voterIdNumber.toUpperCase() : "",
        drivingLicenseNumber: idType === "drivingLicense" ? formData.drivingLicenseNumber.toUpperCase() : "",
        submittedAt: new Date().toISOString(),
      };

      await submitKYC(kycData);
      await refreshProfile();
      toast.success("KYC submitted successfully!");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Unknown error occurred";
      if (msg.includes("permission")) {
        toast.error(
          "Firestore permissions error. Please ensure your Firestore security rules are configured. See firestore.rules file for the rules to copy into your Firebase Console."
        );
      } else {
        toast.error("Failed to submit KYC: " + msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (profile?.kycStatus === "pending") {
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

  if (profile?.kycStatus === "approved") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Verification Approved!</h2>
          <p className="text-muted-foreground text-lg">
            Your profile has been verified. You can now access all features of the Security Professional dashboard.
          </p>
        </div>
        <Button size="lg" onClick={() => router.push("/dashboard/guard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Provide your personal details for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {profile?.kycStatus === "rejected" && (
              <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Verification Rejected</p>
                  <p className="text-sm opacity-90">{profile.rejectionReason || "Please check your details and resubmit."}</p>
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive">*</span></Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  max={maxDate}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
                <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fatherName">{"Father's Name"} <span className="text-destructive">*</span></Label>
              <Input
                id="fatherName"
                placeholder="Enter father's name"
                value={formData.fatherName}
                onChange={(e) => updateField("fatherName", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
              <Textarea
                id="address"
                placeholder="Enter your full address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    required
                  />
                  {isPincodeLoading && (
                    <div className="absolute right-2 top-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                <Select value={formData.state} onValueChange={(v) => updateField("state", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pincode">Pincode <span className="text-destructive">*</span></Label>
                <Input
                  id="pincode"
                  placeholder="6-digit pincode"
                  value={formData.pincode}
                  onChange={(e) => updateField("pincode", e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identity Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Identity Documents</CardTitle>
            <CardDescription>
              Select an ID type to provide for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>ID Type</Label>
              <Select value={idType} onValueChange={(v: "aadhar" | "pan" | "voterId" | "drivingLicense") => setIdType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aadhar">Aadhar Card</SelectItem>
                  <SelectItem value="pan">PAN Card</SelectItem>
                  <SelectItem value="voterId">Voter ID Card</SelectItem>
                  <SelectItem value="drivingLicense">Driving License</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {idType === "aadhar" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="aadharNumber">Aadhar Number <span className="text-destructive">*</span></Label>
                <Input
                  id="aadharNumber"
                  placeholder="12-digit Aadhar number"
                  value={formData.aadharNumber}
                  onChange={(e) => updateField("aadharNumber", e.target.value)}
                  required
                />
              </div>
            )}

            {idType === "pan" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="panNumber">PAN Number <span className="text-destructive">*</span></Label>
                <Input
                  id="panNumber"
                  placeholder="e.g. ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e) => updateField("panNumber", e.target.value)}
                  required
                />
              </div>
            )}

            {idType === "voterId" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="voterIdNumber">Voter ID Number <span className="text-destructive">*</span></Label>
                <Input
                  id="voterIdNumber"
                  placeholder="e.g. ABC1234567"
                  value={formData.voterIdNumber}
                  onChange={(e) => updateField("voterIdNumber", e.target.value)}
                  required
                />
              </div>
            )}

            {idType === "drivingLicense" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="drivingLicenseNumber">Driving License Number <span className="text-destructive">*</span></Label>
                <Input
                  id="drivingLicenseNumber"
                  placeholder="Enter DL Number"
                  value={formData.drivingLicenseNumber}
                  onChange={(e) => updateField("drivingLicenseNumber", e.target.value)}
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
            <CardDescription>
              Tell us about your security experience
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="previousExperience">Previous Experience (Optional)</Label>
              <Textarea
                id="previousExperience"
                placeholder="Describe your previous security or related work experience..."
                value={formData.previousExperience}
                onChange={(e) => updateField("previousExperience", e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="yearsOfExperience">Years of Experience <span className="text-destructive">*</span></Label>
              <Select
                value={formData.yearsOfExperience}
                onValueChange={(v) => updateField("yearsOfExperience", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Fresher</SelectItem>
                  <SelectItem value="1-2">1-2 Years</SelectItem>
                  <SelectItem value="3-5">3-5 Years</SelectItem>
                  <SelectItem value="5-10">5-10 Years</SelectItem>
                  <SelectItem value="10+">10+ Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Physical Attributes */}
        <Card>
          <CardHeader>
            <CardTitle>Physical Attributes</CardTitle>
            <CardDescription>
              Provide physical details for professional assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="height">Height (ft) <span className="text-destructive">*</span></Label>
              <Input
                id="height"
                placeholder="e.g. 6.0"
                value={formData.height}
                onChange={(e) => updateField("height", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="weight">Weight (kg) <span className="text-destructive">*</span></Label>
              <Input
                id="weight"
                placeholder="e.g. 75"
                value={formData.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="complexion">Complexion <span className="text-destructive">*</span></Label>
              <Input
                id="complexion"
                placeholder="e.g. Fair, Wheatish"
                value={formData.complexion}
                onChange={(e) => updateField("complexion", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="identifyingFeatures">Identifying Features <span className="text-destructive">*</span></Label>
              <Input
                id="identifyingFeatures"
                placeholder="e.g. Scar on left eyebrow"
                value={formData.identifyingFeatures}
                onChange={(e) => updateField("identifyingFeatures", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>



        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/guard")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit KYC"}
          </Button>
        </div>
      </form>
    </div >
  );
}
