"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Navbar } from "@/components/nst/navbar";
import { Footer } from "@/components/nst/footer";
import { toast } from "sonner";
import { type ConfirmationResult } from "firebase/auth";
import { useAuth, type PendingSignUp } from "@/lib/auth-context";
import { PhoneOtpModal } from "@/components/auth/phone-otp-modal";
import type { UserRole } from "@/lib/types";

// ─── role → internal UserRole mapping ────────────────────────────────────────
// Fixed: Researcher→researcher, Learner→learner, Organisation→hr
const ROLE_MAP: Record<string, UserRole> = {
  "Security Professional": "guard",
  "Drone Pilot": "pilot",
  "Educator": "educator",
  "Organisation": "hr",
  "Researcher": "researcher",
  "Learner": "learner",
};

// ─── forgot-password sub-flow steps ──────────────────────────────────────────
type ForgotStep = "idle" | "enter_email" | "otp" | "new_password";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, prepareSignUp, completeSignUp, getPhoneForPasswordReset, resetPasswordWithPhone } = useAuth();

  const requestedMode =
    searchParams.get("mode") === "onboarding" ||
    searchParams.get("mode") === "register"
      ? "onboarding"
      : "signin";

  const [mode, setMode] = useState<"signin" | "onboarding">(requestedMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Sign-in state ─────────────────────────────────────────────────────────
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // ── Onboarding state ──────────────────────────────────────────────────────
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("Security Professional");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [otherInterestText, setOtherInterestText] = useState("");

  // Step-3 credential fields
  const [fullName, setFullName] = useState("");
  const [obEmail, setObEmail] = useState("");
  const [obPhone, setObPhone] = useState(""); // 10-digit local
  const [obCountryCode] = useState("+91");
  const [obPassword, setObPassword] = useState("");
  const [obConfirmPassword, setObConfirmPassword] = useState("");

  // ── Signup OTP state ──────────────────────────────────────────────────────
  const [signupOtpOpen, setSignupOtpOpen] = useState(false);
  const [pendingSignUp, setPendingSignUp] = useState<PendingSignUp | null>(null);

  // ── Forgot-password state ─────────────────────────────────────────────────
  const [forgotStep, setForgotStep] = useState<ForgotStep>("idle");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtpOpen, setForgotOtpOpen] = useState(false);
  const [forgotConfirmation, setForgotConfirmation] = useState<ConfirmationResult | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ─── interest options per role ────────────────────────────────────────────

  const roleOptions = [
    { id: "Security Professional", desc: "Build professional identity & discover high-impact briefs." },
    { id: "Drone Pilot", desc: "Deploy aerial and counter-UAS field capabilities." },
    { id: "Educator", desc: "Design structured curricula and teach security cohorts." },
    { id: "Organisation", desc: "Procure verified talent & commission strategic research." },
    { id: "Researcher", desc: "Publish peer-reviewed defense and intelligence monographs." },
    { id: "Learner", desc: "Acquire foundational and advanced security competencies." },
  ];

  const ROLE_INTERESTS: Record<string, { subtitle: string; options: string[] }> = {
    "Security Professional": {
      subtitle: "Choose security areas and responsibilities you want to work or specialize in:",
      options: [
        "Facility & Campus Security", "CCTV & Camera Monitoring", "Emergency Response & First Aid",
        "Guard Team Supervision", "Access Control & Checkpoints", "Fire Safety & Evacuation Drills",
        "VIP & Event Protection", "Incident Reporting & Patrols",
      ],
    },
    "Drone Pilot": {
      subtitle: "Choose drone flight operations and field missions you want to take on:",
      options: [
        "Aerial Perimeter Inspection", "Site Mapping & 3D Surveying", "Thermal & Night Camera Flights",
        "Drone Flight Controls & Safety", "Drone Video & Data Tagging", "Long-Range Flight Operations",
        "Counter-Drone Detection Systems", "Drone Maintenance & Battery Care",
      ],
    },
    "Educator": {
      subtitle: "Choose topics you want to teach or create learning materials for:",
      options: [
        "Security Guard Fundamentals", "Cyber Safety for Beginners", "Drone Flight Training & Rules",
        "First Aid & CPR Workshops", "Password & Online Threat Defense", "Workplace Safety & Fire Drills",
        "Curriculum & Lesson Planning", "Student Mentoring & Certification",
      ],
    },
    "Organisation": {
      subtitle: "Choose security solutions and staffing services your organization needs:",
      options: [
        "Hiring Verified Security Guards", "Booking Drone Inspection Flights", "Upgrading CCTV & Camera Systems",
        "Training Staff in Cyber Safety", "Facility Safety & Risk Audits", "24/7 Emergency Response Setup",
        "Security Supervisor Placements", "Safety Compliance Certification",
      ],
    },
    "Researcher": {
      subtitle: "Choose research fields and analysis topics for your briefings:",
      options: [
        "Daily Threat News Tracking", "Cyber Attack Trends & Defense", "Power Grid & Infrastructure Safety",
        "Regional & Maritime Security", "AI & Automated Threat Detection", "Satellite & Communication Protection",
        "Defense Technology Case Studies", "Safety Policy Briefs & Summaries",
      ],
    },
    "Learner": {
      subtitle: "Choose practical skills and courses you want to learn:",
      options: [
        "Cyber Defense Basics", "Drone Flying & Camera Controls", "Security Guarding Essentials",
        "First Aid & Emergency Response", "Safe Online Habits & Passwords", "CCTV Setup & Troubleshooting",
        "Building a Security Resume", "Earning Skill Certificates",
      ],
    },
  };

  const currentInterestData =
    ROLE_INTERESTS[selectedRole] || ROLE_INTERESTS["Security Professional"];

  function toggleInterest(topic: string) {
    setSelectedInterests((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  // ─── Sign-in submit ───────────────────────────────────────────────────────

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!siEmail || !siPassword) {
      toast.error("Please provide both email and password.");
      return;
    }
    try {
      setLoading(true);
      await signIn(siEmail, siPassword);
      toast.success("Signed in successfully. Welcome to TheNST.");
      router.push("/platform");
    } catch (err: any) {
      toast.error(err?.message || "Sign in failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Forgot password: step 1 — resolve phone ─────────────────────────────

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
    } catch (err: any) {
      toast.error(err?.message || "Could not look up account.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Forgot password: step 2 — OTP verified ──────────────────────────────

  function handleForgotOtpVerified(cr: ConfirmationResult) {
    setForgotOtpOpen(false);
    setForgotConfirmation(cr);
    setForgotStep("new_password");
  }

  // ─── Forgot password: step 3 — set new password ──────────────────────────

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
      await resetPasswordWithPhone(forgotEmail, newPassword, forgotConfirmation);
      toast.success("Password updated. You can now sign in with your new password.");
      resetForgot();
    } catch (err: any) {
      toast.error(err?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  function resetForgot() {
    setForgotStep("idle");
    setForgotEmail("");
    setForgotPhone("");
    setForgotOtpOpen(false);
    setForgotConfirmation(null);
    setNewPassword("");
    setNewPasswordConfirm("");
  }

  // ─── Onboarding step 3: validate → duplicate check → open OTP modal ──────

  async function handleOnboardingSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (obPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (obPassword !== obConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const phoneDigits = obPhone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    const fullPhone = obCountryCode + phoneDigits;
    const internalRole: UserRole = ROLE_MAP[selectedRole] ?? "guard";

    setLoading(true);
    try {
      const pending = await prepareSignUp({
        email: obEmail,
        password: obPassword,
        fullName,
        phone: fullPhone,
        role: internalRole,
      });
      setPendingSignUp(pending);
      setSignupOtpOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Registration check failed.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Onboarding OTP verified → complete signup ────────────────────────────

  async function handleSignupOtpVerified(_cr: ConfirmationResult) {
    setSignupOtpOpen(false);
    if (!pendingSignUp) return;
    setLoading(true);
    try {
      await completeSignUp(pendingSignUp);
      toast.success("Account verified and created. Personalizing your TheNST workspace…");
      router.push("/platform");
    } catch (err: any) {
      toast.error(err?.message || "Account creation failed. Please try again.");
    } finally {
      setLoading(false);
      setPendingSignUp(null);
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-[#171b22]">
      <Navbar />

      {/* ── OTP modals ─────────────────────────────────────────────────────── */}
      {pendingSignUp && (
        <PhoneOtpModal
          open={signupOtpOpen}
          onClose={() => { setSignupOtpOpen(false); setPendingSignUp(null); }}
          phone={pendingSignUp.phone}
          mode="signup"
          onVerified={handleSignupOtpVerified}
        />
      )}

      <PhoneOtpModal
        open={forgotOtpOpen}
        onClose={() => { setForgotOtpOpen(false); setForgotStep("enter_email"); }}
        phone={forgotPhone}
        mode="forgot"
        onVerified={handleForgotOtpVerified}
      />

      <main className="flex-1 py-16 sm:py-24">
        <div className="w-full max-w-xl mx-auto px-6">

          {/* ── Auth mode tabs ─────────────────────────────────────────────── */}
          {forgotStep === "idle" && (
            <div className="flex border-b border-[#e5e3db] mb-8">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  mode === "signin"
                    ? "border-[#d95325] text-[#171b22]"
                    : "border-transparent text-[#737a83] hover:text-[#171b22]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("onboarding")}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  mode === "onboarding"
                    ? "border-[#d95325] text-[#171b22]"
                    : "border-transparent text-[#737a83] hover:text-[#171b22]"
                }`}
              >
                Create Account & Onboard
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* SIGN IN                                                         */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {mode === "signin" && forgotStep === "idle" && (
            <div className="bg-white border border-[#e5e3db] p-8 sm:p-10 shadow-sm">
              <div className="mb-6">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold block mb-1">
                  Institutional Authentication
                </span>
                <h2 className="text-2xl font-medium tracking-tight text-[#171b22]">
                  Sign in to TheNST
                </h2>
                <p className="text-xs text-[#737a83] font-sans mt-1">
                  Access your personalized platform, learning modules, and opportunity briefings.
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                    placeholder="name@institution.org"
                    className="w-full px-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] focus:bg-white font-sans"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-[#737a83]">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotStep("enter_email")}
                      className="text-[11px] font-semibold text-[#d95325] hover:text-[#bc3f18]"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={siPassword}
                      onChange={(e) => setSiPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] focus:bg-white font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737a83] hover:text-[#171b22]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] transition-all uppercase mt-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? "Authenticating…" : "Sign In to Platform →"}
                </button>
              </form>

              <div className="pt-6 border-t border-[#e5e3db] mt-6 text-center text-xs text-[#737a83]">
                New to TheNST?{" "}
                <button
                  type="button"
                  onClick={() => setMode("onboarding")}
                  className="text-[#d95325] font-semibold hover:underline"
                >
                  Start Guided Onboarding
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* FORGOT PASSWORD                                                 */}
          {/* ════════════════════════════════════════════════════════════════ */}

          {/* Step: enter email */}
          {forgotStep === "enter_email" && (
            <div className="bg-white border border-[#e5e3db] p-8 sm:p-10 shadow-sm">
              <div className="mb-6">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold block mb-1">
                  Password Recovery
                </span>
                <h2 className="text-2xl font-medium tracking-tight text-[#171b22]">
                  Reset Your Password
                </h2>
                <p className="text-xs text-[#737a83] font-sans mt-1">
                  Enter your registered email. An OTP will be sent to the mobile number linked to your account.
                </p>
              </div>

              <form onSubmit={handleForgotSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                    Registered Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] focus:bg-white font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase shadow-sm disabled:opacity-50"
                >
                  {loading ? "Looking up account…" : "Send OTP to Mobile →"}
                </button>
              </form>

              <div className="pt-6 border-t border-[#e5e3db] mt-6 text-center text-xs text-[#737a83]">
                <button
                  type="button"
                  onClick={resetForgot}
                  className="text-[#d95325] font-semibold hover:underline"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Step: new password (after OTP verified) */}
          {forgotStep === "new_password" && (
            <div className="bg-white border border-[#e5e3db] p-8 sm:p-10 shadow-sm">
              <div className="mb-6">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold block mb-1">
                  Password Recovery
                </span>
                <h2 className="text-2xl font-medium tracking-tight text-[#171b22]">
                  Set New Password
                </h2>
                <p className="text-xs text-[#737a83] font-sans mt-1">
                  Mobile verified. Choose a strong new password for your account.
                </p>
              </div>

              <div className="mb-4 px-3 py-2.5 bg-green-50 border border-green-200 text-xs text-green-800 font-sans">
                ✓ Mobile number verified successfully.
              </div>

              <form onSubmit={handleForgotSetPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] focus:bg-white font-sans pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737a83] hover:text-[#171b22]"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                    Confirm New Password *
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] focus:bg-white font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase shadow-sm disabled:opacity-50"
                >
                  {loading ? "Updating Password…" : "Update Password →"}
                </button>
              </form>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* GUIDED ONBOARDING                                               */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {mode === "onboarding" && forgotStep === "idle" && (
            <div className="bg-white border border-[#e5e3db] p-8 sm:p-10 shadow-sm">
              {/* Step indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-[#e5e3db] mb-6 text-xs font-mono text-[#737a83]">
                <span className="text-[#d95325] font-semibold">
                  Step 0{onboardingStep} of 03
                </span>
                <span>
                  {onboardingStep === 1
                    ? "Role Pathway"
                    : onboardingStep === 2
                    ? "Domain Focus"
                    : "Profile Credentials"}
                </span>
              </div>

              {/* ── Step 1: Role selection ──────────────────────────────── */}
              {onboardingStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-medium tracking-tight text-[#171b22] mb-1">
                      What brings you to TheNST?
                    </h2>
                    <p className="text-xs text-[#737a83] font-sans">
                      Select your primary professional track to personalize your interface.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {roleOptions.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRole(r.id)}
                        className={`p-4 border transition-all cursor-pointer flex items-start justify-between ${
                          selectedRole === r.id
                            ? "border-[#d95325] bg-[#faf9f5] ring-1 ring-[#d95325]"
                            : "border-[#e5e3db] hover:border-[#171b22]/30"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium text-[#171b22]">{r.id}</div>
                          <div className="text-xs text-[#737a83] font-sans mt-0.5">{r.desc}</div>
                        </div>
                        {selectedRole === r.id && (
                          <CheckCircle2 className="w-4 h-4 text-[#d95325] flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOnboardingStep(2)}
                    className="w-full inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] transition-all uppercase"
                  >
                    Continue to Interests →
                  </button>
                </div>
              )}

              {/* ── Step 2: Interests selection ─────────────────────────── */}
              {onboardingStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#fff3ee] border border-[#ffd5c4] text-[#d95325] text-[10px] font-mono font-semibold uppercase tracking-wider mb-2">
                      {selectedRole} Track
                    </div>
                    <h2 className="text-xl font-medium tracking-tight text-[#171b22] mb-1">
                      What are you interested in?
                    </h2>
                    <p className="text-xs text-[#737a83] font-sans leading-relaxed">
                      {currentInterestData.subtitle}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentInterestData.options.map((topic) => {
                        const isSelected = selectedInterests.includes(topic);
                        return (
                          <div
                            key={topic}
                            onClick={() => toggleInterest(topic)}
                            className={`p-3 border text-xs font-medium font-sans cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-[#d95325] bg-[#faf9f5] text-[#171b22]"
                                : "border-[#e5e3db] text-[#616872] hover:border-[#171b22]/30"
                            }`}
                          >
                            <span>{topic}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#d95325]" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div
                      onClick={() => toggleInterest("Other")}
                      className={`p-3 border text-xs font-medium font-sans cursor-pointer transition-all flex items-center justify-between ${
                        selectedInterests.includes("Other")
                          ? "border-[#d95325] bg-[#faf9f5] text-[#171b22] font-semibold"
                          : "border-[#e5e3db] text-[#616872] hover:border-[#171b22]/30 bg-white"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-[#d95325] font-bold">+</span>{" "}
                        Other / Custom Focus Area
                      </span>
                      {selectedInterests.includes("Other") && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#d95325]" />
                      )}
                    </div>

                    {selectedInterests.includes("Other") && (
                      <div className="p-3.5 bg-[#faf9f5] border border-[#d95325]/30 space-y-1.5 animate-in fade-in duration-200">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-[#d95325] font-semibold block">
                          Specify Your Specific Interest Area
                        </label>
                        <input
                          type="text"
                          value={otherInterestText}
                          onChange={(e) => setOtherInterestText(e.target.value)}
                          placeholder="e.g. Agricultural Drone Mapping, Industrial Site Patrol…"
                          className="w-full px-3 py-2 bg-white border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] font-sans"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(1)}
                      className="px-5 py-2.5 border border-[#e5e3db] text-xs font-semibold uppercase tracking-wider text-[#171b22] hover:bg-[#f7f6f2]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(3)}
                      className="flex-1 inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#171b22] hover:bg-[#d95325] transition-all uppercase"
                    >
                      Continue to Profile →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Account credentials + phone + OTP trigger ───── */}
              {onboardingStep === 3 && (
                <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-medium tracking-tight text-[#171b22] mb-1">
                      Create Your Profile Credentials
                    </h2>
                    <p className="text-xs text-[#737a83] font-sans">
                      Your identity as{" "}
                      <span className="text-[#d95325] font-semibold">
                        {selectedRole}
                      </span>
                      .
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dr. / Col. / First Last"
                      className="w-full px-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] focus:bg-white font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={obEmail}
                      onChange={(e) => setObEmail(e.target.value)}
                      placeholder="name@institution.org"
                      className="w-full px-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] focus:bg-white font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                      Mobile Number * (10 digits, OTP will be sent)
                    </label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#737a83] font-mono select-none">
                        {obCountryCode}
                      </span>
                      <input
                        type="tel"
                        required
                        value={obPhone}
                        onChange={(e) =>
                          setObPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        placeholder="10-digit mobile"
                        className="flex-1 px-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] focus:bg-white font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                      Password (min 8 characters) *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={obPassword}
                        onChange={(e) => setObPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] focus:bg-white font-sans pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737a83] hover:text-[#171b22] transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-[#737a83] block mb-1.5">
                      Confirm Password *
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={obConfirmPassword}
                      onChange={(e) => setObConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2.5 bg-[#f7f6f2] border border-[#e5e3db] text-xs text-[#171b22] focus:outline-none focus:border-[#d95325] focus:bg-white font-sans"
                    />
                  </div>

                  <p className="text-[10px] text-[#737a83] font-sans leading-relaxed bg-[#f7f6f2] border border-[#e5e3db] px-3 py-2">
                    A 6-digit OTP will be sent to your mobile number to verify your account before it is created.
                  </p>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(2)}
                      className="px-5 py-2.5 border border-[#e5e3db] text-xs font-semibold uppercase tracking-wider text-[#171b22] hover:bg-[#f7f6f2]"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center min-h-[44px] px-6 text-xs font-semibold tracking-wider text-white bg-[#d95325] hover:bg-[#bc3f18] transition-all uppercase shadow-md disabled:opacity-50"
                    >
                      {loading ? "Checking…" : "Verify Mobile & Launch TheNST →"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SignInPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#f7f6f2]" />}>
      <SignInContent />
    </React.Suspense>
  );
}
