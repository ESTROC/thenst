"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { updateUserProfile } from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { User, Phone, Mail, Save, KeyRound, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
    const { profile, refreshProfile } = useAuth();
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Profile field states
    const [fullName, setFullName] = useState(profile?.fullName || "");
    const [phone, setPhone] = useState(profile?.phone || "");

    // Password field states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    // Visibility toggle states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handle Profile Info Update
    async function handleProfileSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!profile) return;
        setProfileLoading(true);

        try {
            await updateUserProfile(profile.uid, {
                fullName,
                phone,
            });
            await refreshProfile();
            toast.success("Profile updated successfully!");
        } catch (error: any) {
            console.error("Profile Update Error:", error);
            toast.error(`Failed to update profile: ${error.message || "Unknown error"}`);
        } finally {
            setProfileLoading(false);
        }
    }

    // Handle Password Change Update
    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user || !user.email) {
            toast.error("Active user session not found. Please log in again.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }

        setPasswordLoading(true);

        try {
            // 1. Reauthenticate the user first to prevent recent-login issues
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // 2. Update the password
            await updatePassword(user, newPassword);

            toast.success("Password updated successfully!");

            // Reset password input states
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (error: any) {
            console.error("Password Update Error:", error);
            let message = "Failed to update password.";
            if (error.code === "auth/wrong-password") {
                message = "Incorrect current password. Please try again.";
            } else if (error.code === "auth/weak-password") {
                message = "The new password is too weak. Please use a stronger password.";
            } else if (error.code === "auth/requires-recent-login") {
                message = "For security reasons, please sign out and sign back in to change your password.";
            } else {
                message = error.message || message;
            }
            toast.error(message);
        } finally {
            setPasswordLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h2>
                <p className="text-muted-foreground">Manage your personal information, contact details, and account security.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Info Card */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <User className="h-5 w-5 text-primary" />
                            Personal Information
                        </CardTitle>
                        <CardDescription>Update your display name and contact phone number.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="fullName" className="text-sm font-semibold text-muted-foreground">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="fullName"
                                            className="pl-9 h-11 rounded-xl bg-white border-border/50 focus-visible:ring-primary"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="phone" className="text-sm font-semibold text-muted-foreground">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            className="pl-9 h-11 rounded-xl bg-white border-border/50 focus-visible:ring-primary"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        className="pl-9 h-11 rounded-xl bg-muted/50 cursor-not-allowed border-border/50 text-muted-foreground"
                                        value={profile?.email || ""}
                                        disabled
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground px-1">Email cannot be changed as it is used for login.</p>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={profileLoading} className="px-6 h-11 rounded-xl font-bold bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/10">
                                    {profileLoading ? (
                                        "Saving..."
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Password & Security Card */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                            <KeyRound className="h-5 w-5 text-primary" />
                            Account Security
                        </CardTitle>
                        <CardDescription>Update your password. You will need to provide your current password.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                            {/* Current Password */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="currentPassword" className="text-sm font-semibold text-muted-foreground">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        className="h-11 rounded-xl bg-white border-border/50 focus-visible:ring-primary pr-10"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="newPassword" className="text-sm font-semibold text-muted-foreground">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        className="h-11 rounded-xl bg-white border-border/50 focus-visible:ring-primary pr-10"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        placeholder="At least 8 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm New Password */}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="confirmNewPassword" className="text-sm font-semibold text-muted-foreground">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmNewPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="h-11 rounded-xl bg-white border-border/50 focus-visible:ring-primary pr-10"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        required
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={passwordLoading} className="px-6 h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10">
                                    {passwordLoading ? (
                                        "Updating..."
                                    ) : (
                                        <>
                                            <KeyRound className="mr-2 h-4 w-4" /> Update Password
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
