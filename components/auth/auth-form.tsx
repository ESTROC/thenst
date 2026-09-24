"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { type ConfirmationResult } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type PendingSignUp } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneOtpModal } from "@/components/auth/phone-otp-modal";

// ─── country codes ────────────────────────────────────────────────────────────

const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
];

// ─── props ────────────────────────────────────────────────────────────────────

interface AuthFormProps {
  mode: "login" | "register";
  role?: UserRole;
}

// ─── forgot-password sub-flow steps ──────────────────────────────────────────
// idle          → user has not clicked "Forgot Password?"
// enter_email   → user entered email, click "Send OTP"
// otp           → OTP modal is open / being verified
// new_password  → OTP verified, user sets new password
type ForgotStep = "idle" | "enter_email" | "otp" | "new_password";

export function AuthForm({ mode, role = "guard" }: AuthFormProps) {
  // ── shared state ─────────────────────────────────────────────────────────
  const [currentRole, setCurrentRole] = useState<UserRole>(role);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  // ── signup OTP state ─────────────────────────────────────────────────────
  const [signupOtpOpen, setSignupOtpOpen] = useState(false);
  const [pendingSignUp, setPendingSignUp] = useState<PendingSignUp | null>(null);

  // ── forgot-password state ────────────────────────────────────────────────
  const [forgotStep, setForgotStep] = useState<ForgotStep>("idle");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState(""); // resolved E.164
  const [forgotOtpOpen, setForgotOtpOpen] = useState(false);
  const [forgotConfirmation, setForgotConfirmation] =
    useState<ConfirmationResult | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    signIn,
    prepareSignUp,
    completeSignUp,
    getPhoneForPasswordReset,
    resetPasswordWithPhone,
  } = useAuth();
  const router = useRouter();

  // ─── role options ─────────────────────────────────────────────────────────

  const roleOptions = [
    { value: "guard", label: "Security Professional" },
    { value: "pilot", label: "Drone Pilot" },
    { value: "educator", label: "Educator" },
    { value: "hr", label: "Organisation" },
    { value: "researcher", label: "Researcher" },
    { value: "learner", label: "Learner" },
  ];

  // ─── helpers ──────────────────────────────────────────────────────────────

  function resetForgot() {
    setForgotStep("idle");
    setForgotEmail("");
    setForgotPhone("");
    setForgotOtpOpen(false);
    setForgotConfirmation(null);
    setNewPassword("");
    setNewPasswordConfirm("");
  }

  // ─── SIGNUP: step 1 — validate form → check duplicates → open OTP modal ──

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }

      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        toast.error("Please enter exactly 10 digits for the mobile number.");
        return;
      }

      const fullPhone = countryCode + phoneDigits;

      // Duplicate check only — nothing written to Firebase yet
      const pending = await prepareSignUp({
        email,
        password,
        fullName,
        phone: fullPhone,
        role: currentRole,
      });

      setPendingSignUp(pending);
      setSignupOtpOpen(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration check failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // ─── SIGNUP: step 2 — OTP verified → create account ──────────────────────

  async function handleSignupOtpVerified(_cr: ConfirmationResult) {
    setSignupOtpOpen(false);

    if (!pendingSignUp) return;
    setLoading(true);

    try {
      await completeSignUp(pendingSignUp);
      toast.success("Account verified and created. Welcome to TheNST.");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Account creation failed.";
      toast.error(message);
    } finally {
      setLoading(false);
      setPendingSignUp(null);
    }
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let identifier = email;

      if (loginMethod === "phone") {
        const phoneDigits = phone.replace(/\D/g, "");
        if (phoneDigits.length !== 10) {
          toast.error("Please enter a valid 10-digit mobile number.");
          return;
        }
        identifier = countryCode + phoneDigits;
      } else {
        if (!email) {
          toast.error("Email is required.");
          return;
        }
      }

      const { role: userRole } = await signIn(identifier, password);
      toast.success("Welcome back to TheNST!");

      if (userRole === "superadmin") {
        router.push("/dashboard/superadmin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // ─── FORGOT PASSWORD: step 1 — resolve phone from email ──────────────────

  async function handleForgotSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your registered email address.");
      return;
    }
    setLoading(true);

    try {
      const resolvedPhone = await getPhoneForPasswordReset(forgotEmail);
      setForgotPhone(resolvedPhone);
      setForgotStep("otp");
      setForgotOtpOpen(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not look up account.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // ─── FORGOT PASSWORD: step 2 — OTP verified → show new-password form ─────

  function handleForgotOtpVerified(cr: ConfirmationResult) {
    setForgotOtpOpen(false);
    setForgotConfirmation(cr);
    setForgotStep("new_password");
  }

  // ─── FORGOT PASSWORD: step 3 — set new password ──────────────────────────

  async function handleForgotSetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!forgotConfirmation) {
      toast.error("OTP session expired. Please start over.");
      resetForgot();
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithPhone(
        forgotEmail,
        newPassword,
        forgotConfirmation
      );
      toast.success(
        "Password updated successfully. You can now sign in with your new password."
      );
      resetForgot();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Password reset failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // ─── unified submit dispatcher ────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    if (mode === "register") return handleRegisterSubmit(e);
    return handleLoginSubmit(e);
  }

  // ─── derived flags ────────────────────────────────────────────────────────

  const isForgotMode = forgotStep !== "idle";

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Signup OTP modal ──────────────────────────────────────────────── */}
      {pendingSignUp && (
        <PhoneOtpModal
          open={signupOtpOpen}
          onClose={() => {
            setSignupOtpOpen(false);
            setPendingSignUp(null);
          }}
          phone={pendingSignUp.phone}
          mode="signup"
          onVerified={handleSignupOtpVerified}
        />
      )}

      {/* ── Forgot-password OTP modal ─────────────────────────────────────── */}
      <PhoneOtpModal
        open={forgotOtpOpen}
        onClose={() => {
          setForgotOtpOpen(false);
          setForgotStep("enter_email");
        }}
        phone={forgotPhone}
        mode="forgot"
        onVerified={handleForgotOtpVerified}
      />

      <main className="min-h-screen flex flex-col items-center justify-center bg-[#171b22] px-4 py-12 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[#d95325]/5 blur-[120px] pointer-events-none" />

        {/* Institutional Box */}
        <div className="w-full max-w-md bg-[#f7f6f2] border border-[#e5e3db] p-8 sm:p-10 shadow-2xl relative z-10">

          {/* Brand Logo Header */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-baseline gap-0 text-[24px] font-medium tracking-[-1.1px] text-[#171b22] mb-3"
            >
              <span className="font-sans font-bold">The</span>
              <span className="font-serif italic font-normal text-[28px] tracking-[-0.5px]">
                NST
              </span>
            </Link>
            <h1 className="text-3xl font-medium tracking-tight text-[#171b22] mb-1">
              {forgotStep === "enter_email"
                ? "Reset Password"
                : forgotStep === "new_password"
                ? "Set New Password"
                : mode === "login"
                ? "Institutional Sign In"
                : "Create Account"}
            </h1>
            <p className="text-xs text-[#737a83] font-sans">
              {forgotStep === "enter_email"
                ? "Enter your registered email. We'll send an OTP to your linked mobile."
                : forgotStep === "new_password"
                ? "Mobile verified. Choose a strong new password."
                : mode === "login"
                ? "Access your command dashboard and sovereign enclave."
                : "Join the national security talent and research network."}
            </p>
          </div>

          {/* ── FORGOT PASSWORD: enter_email ─────────────────────────────── */}
          {forgotStep === "enter_email" && (
            <form onSubmit={handleForgotSendOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="forgotEmail"
                  className="text-xs font-semibold text-[#171b22]"
                >
                  Registered Email Address
                </Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="bg-white border-[#e5e3db] text-[#171b22] placeholder:text-[#737a83]/50 focus-visible:ring-[#d95325] h-11 rounded-none text-xs"
                />
                <p className="text-[10px] text-[#737a83] font-sans leading-relaxed">
                  An OTP will be sent to the mobile number linked to this account.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#d95325] hover:bg-[#bc3f18] text-white text-xs font-semibold tracking-wider uppercase rounded-none mt-2 shadow-sm transition-all"
              >
                {loading ? "Looking up account…" : "Send OTP to Mobile"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resetForgot}
                  className="text-xs font-semibold text-[#d95325] hover:text-[#bc3f18]"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ── FORGOT PASSWORD: new_password ────────────────────────────── */}
          {forgotStep === "new_password" && (
            <form
              onSubmit={handleForgotSetPassword}
              className="flex flex-col gap-4"
            >
              <div className="p-3 bg-green-50 border border-green-200 text-xs text-green-800 font-sans rounded-sm">
                ✓ Mobile number verified successfully.
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="newPassword"
                  className="text-xs font-semibold text-[#171b22]"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="bg-white border-[#e5e3db] text-[#171b22] placeholder:text-[#737a83]/50 focus-visible:ring-[#d95325] h-11 pr-10 rounded-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737a83] hover:text-[#171b22]"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="newPasswordConfirm"
                  className="text-xs font-semibold text-[#171b22]"
                >
                  Confirm New Password
                </Label>
                <Input
                  id="newPasswordConfirm"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  required
                  className="bg-white border-[#e5e3db] text-[#171b22] placeholder:text-[#737a83]/50 focus-visible:ring-[#d95325] h-11 rounded-none text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#d95325] hover:bg-[#bc3f18] text-white text-xs font-semibold tracking-wider uppercase rounded-none mt-2 shadow-sm transition-all"
              >
                {loading ? "Updating Password…" : "Update Password"}
              </Button>
            </form>
          )}

          {/* ── NORMAL login / register flow ─────────────────────────────── */}
          {!isForgotMode && (
            <>
              {/* Role selector — visible on both login and register */}
              <div className="mb-6 flex flex-col gap-1.5">
                <Label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#737a83]">
                  SELECT ROLE VIEW
                </Label>
                <Select
                  value={currentRole}
                  onValueChange={(v) => setCurrentRole(v as UserRole)}
                >
                  <SelectTrigger className="h-11 bg-white border-[#e5e3db] text-[#171b22] text-xs font-semibold rounded-none focus:ring-[#d95325]">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e5e3db] rounded-none shadow-xl">
                    <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-[#737a83] border-b border-[#e5e3db]/60 mb-1">
                      SELECT ROLE VIEW
                    </div>
                    {roleOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="py-2.5 text-xs text-[#171b22] focus:bg-[#f7f6f2] focus:text-[#d95325] font-medium cursor-pointer"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* ── REGISTER fields ──────────────────────────────────── */}
                {mode === "register" && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="fullName"
                        className="text-xs font-semibold text-[#171b22]"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Col. Vikramaditya Sen / Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="bg-white border-[#e5e3db] text-[#171b22] placeholder:text-[#737a83]/50 focus-visible:ring-[#d95325] h-11 rounded-none text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="email"
                        className="text-xs font-semibold text-[#171b22]"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="analyst@institution.gov.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white border-[#e5e3db] text-[#171b22] placeholder:text-[#737a83]/50 focus-visible:ring-[#d95325] h-11 rounded-none text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="phone"
                        className="text-xs font-semibold text-[#171b22]"
                      >
                        Mobile Number
                      </Label>
                      <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="w-[100px] bg-white border-[#e5e3db] text-[#171b22] h-11 rounded-none text-xs">
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#e5e3db] rounded-none">
                            {countryCodes.map((c) => (
                              <SelectItem
                                key={c.code}
                                value={c.code}
                                className="text-xs"
                              >
                                {c.flag} {c.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="10-digit mobile"
                          value={phone}
                          onChange={(e) =>
                            setPhone(
                              e.target.value.replace(/\D/g, "").slice(0, 10)
                            )
                          }
                          required
                          className="flex-1 bg-white border-[#e5e3db] text-[#171b22] placeholder:text-[#737a83]/50 focus-visible:ring-[#d95325] h-11 rounded-none text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── LOGIN tabs (email / phone) ─────────────────────── */}
                {mode === "login" && (
                  <Tabs
                    value={loginMethod}
                    onValueChange={(v) =>
                      setLoginMethod(v as "email" | "phone")
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 bg-[#eceae3] border border-[#e5e3db] mb-4 h-10 p-1 rounded-none">
                      <TabsTrigger
                        value="email"
                        className="rounded-none data-[state=active]:bg-white data-[state=active]:text-[#171b22] data-[state=active]:shadow-sm text-xs font-semibold uppercase tracking-wider"
                      >
                        Email
                      </TabsTrigger>
                      <TabsTrigger
                        value="phone"
                        className="rounded-none data-[state=active]:bg-white data-[state=active]:text-[#171b22] data-[state=active]:shadow-sm text-xs font-semibold uppercase tracking-wider"
                      >
                        Mobile
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email" className="mt-0">
                      <div className="flex flex-col gap-1.5">
                        <Label
                          htmlFor="loginEmail"
                          className="text-xs font-semibold text-[#171b22]"
                        >
                          Email Address
                        </Label>
                        <Input
                          id="loginEmail"
                          type="email"
                          placeholder="officer@domain.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-white border-[#e5e3db] text-[#171b22] placeholder:text-[#737a83]/50 focus-visible:ring-[#d95325] h-11 rounded-none text-xs"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="phone" className="mt-0">
                      <div className="flex flex-col gap-1.5">
                        <Label
                          htmlFor="loginPhone"
                          className="text-xs font-semibold text-[#171b22]"
                        >
                          Mobile Number
                        </Label>
                        <div className="flex gap-2">
                          <Select
                            value={countryCode}
                            onValueChange={setCountryCode}
                          >
                            <SelectTrigger className="w-[100px] bg-white border-[#e5e3db] text-[#171b22] h-11 rounded-none text-xs">
                              <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#e5e3db] rounded-none">
                              {countryCodes.map((c) => (
                                <SelectItem
                                  key={c.code}
                                  value={c.code}
                                  className="text-xs"
                                >
                                  {c.flag} {c.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            id="loginPhone"
                            type="tel"
                            placeholder="10-digit mobile"
                            value={phone}
                            onChange={(e) =>
                              setPhone(
                                e.target.value.replace(/\D/g, "").slice(0, 10)
                              )
                            }
                            required
                            className="flex-1 bg-white border-[#e5e3db] text-[#171b22] placeholder:text-[#737a83]/50 focus-visible:ring-[#d95325] h-11 rounded-none text-xs"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {/* ── Password field ────────────────────────────────── */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold text-[#171b22]"
                    >
                      Password
                    </Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setForgotStep("enter_email")}
                        className="text-[11px] font-semibold text-[#d95325] hover:text-[#bc3f18]"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white border-[#e5e3db] text-[#171b22] placeholder:text-[#737a83]/50 focus-visible:ring-[#d95325] h-11 pr-10 rounded-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737a83] hover:text-[#171b22]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Confirm password (register only) ──────────────── */}
                {mode === "register" && (
                  <div className="flex flex-col gap-1.5">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-xs font-semibold text-[#171b22]"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white border-[#e5e3db] text-[#171b22] placeholder:text-[#737a83]/50 focus-visible:ring-[#d95325] h-11 rounded-none text-xs"
                    />
                  </div>
                )}

                {/* ── Phone-OTP notice (register only) ─────────────── */}
                {mode === "register" && (
                  <p className="text-[10px] text-[#737a83] font-sans leading-relaxed bg-[#eceae3] px-3 py-2 border border-[#e5e3db]">
                    A 6-digit OTP will be sent to your mobile number to verify your account before it is created.
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#d95325] hover:bg-[#bc3f18] text-white text-xs font-semibold tracking-wider uppercase rounded-none mt-2 shadow-sm transition-all"
                >
                  {loading
                    ? "Processing…"
                    : mode === "login"
                    ? "Sign In to Platform"
                    : "Verify Mobile & Create Account"}
                </Button>
              </form>

              {/* Footer Switch */}
              <div className="mt-6 pt-4 border-t border-[#e5e3db] text-center text-xs text-[#737a83] font-sans">
                {mode === "login" ? (
                  <p>
                    Don&apos;t have an institutional profile?{" "}
                    <Link
                      href="/register"
                      className="font-semibold text-[#d95325] hover:text-[#bc3f18]"
                    >
                      Register here
                    </Link>
                  </p>
                ) : (
                  <p>
                    Already registered?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-[#d95325] hover:text-[#bc3f18]"
                    >
                      Sign In
                    </Link>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
