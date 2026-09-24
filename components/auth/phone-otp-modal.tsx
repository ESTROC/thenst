"use client";

/**
 * PhoneOtpModal
 *
 * Two flows:
 *   mode="signup"  – verifies phone before account creation
 *   mode="forgot"  – verifies phone before a password reset
 *
 * ─── Diagnostic logging ────────────────────────────────────────────────────
 * Every significant lifecycle event is logged to the browser console with a
 * [OTP] prefix and a short verifier identity tag so you can trace exactly
 * which instance is being created, reused, or destroyed.
 *
 * Remove the LOG_OTP_LIFECYCLE flag (set to false) once the issue is
 * confirmed resolved in production.
 *
 * ─── reCAPTCHA lifecycle rules ─────────────────────────────────────────────
 * • auth is imported as a stable module-level singleton (fixed in
 *   lib/firebase.ts — was previously a Proxy that returned a different
 *   object reference on each property access, causing assertNotDestroyed).
 *
 * • RecaptchaVerifier is created once per OTP request and stored in a ref.
 *   It is NOT recreated on re-renders and NOT destroyed before
 *   signInWithPhoneNumber() resolves.
 *
 * • The reCAPTCHA container <div> is rendered unconditionally (outside the
 *   open guard) so it exists in the DOM when Firebase needs it.
 *
 * • clear() is called only on failure (so the next retry gets a fresh
 *   instance) or on true component unmount.
 *
 * • A ref-based lock (sendingRef) prevents concurrent sendOtp() calls.
 *
 * • React Strict Mode safe: prevOpenRef tracks genuine open/close
 *   transitions; the mount effect's cleanup only fires on true unmount.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS } from "input-otp";

// ─── diagnostic flag ──────────────────────────────────────────────────────────
// Set to false to silence OTP lifecycle logs in production.
const LOG_OTP_LIFECYCLE = true;

function otpLog(msg: string, ...args: unknown[]) {
  if (LOG_OTP_LIFECYCLE) {
    console.log(`[OTP] ${msg}`, ...args);
  }
}

// ─── constants ────────────────────────────────────────────────────────────────

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;
const RECAPTCHA_CONTAINER_ID = "recaptcha-container-phone-otp";

// ─── verifier identity helper ─────────────────────────────────────────────────
// Gives each verifier instance a short tag so logs are traceable.
let _verifierCounter = 0;
const _verifierIds = new WeakMap<RecaptchaVerifier, string>();

function verifierId(v: RecaptchaVerifier): string {
  if (!_verifierIds.has(v)) {
    _verifierIds.set(v, `RV#${++_verifierCounter}`);
  }
  return _verifierIds.get(v)!;
}

// ─── props ────────────────────────────────────────────────────────────────────

interface PhoneOtpModalProps {
  open: boolean;
  onClose: () => void;
  /** E.164 format, e.g. "+919876543210" */
  phone: string;
  mode: "signup" | "forgot";
  onVerified: (confirmationResult: ConfirmationResult) => void;
}

// ─── component ────────────────────────────────────────────────────────────────

export function PhoneOtpModal({
  open,
  onClose,
  phone,
  mode,
  onVerified,
}: PhoneOtpModalProps) {
  // ── UI state ──────────────────────────────────────────────────────────────
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // ── stable refs ───────────────────────────────────────────────────────────
  const verifierRef   = useRef<RecaptchaVerifier | null>(null);
  const sendingRef    = useRef(false);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef    = useRef(true);
  const prevOpenRef   = useRef(false);

  // ── mount / unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    otpLog("Component mounted. auth object identity:", auth);
    return () => {
      mountedRef.current = false;
      otpLog("Component UNMOUNTED — destroying verifier if any");
      destroyVerifier("unmount");
      stopCooldown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── open/close detection ──────────────────────────────────────────────────
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      otpLog("Modal OPENED (phone=%s mode=%s)", phone, mode);
      setOtp("");
      setOtpSent(false);
      setConfirmationResult(null);
      stopCooldown();
      // Do NOT call sendOtp() here. The async operation + effect cleanup race
      // causes the verifier to be destroyed while signInWithPhoneNumber() is
      // pending. Let the user click "Send OTP" explicitly.
    }
    if (!open && prevOpenRef.current) {
      otpLog("Modal CLOSED — stopping cooldown");
      stopCooldown();
    }
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── helpers ──────────────────────────────────────────────────────────────

  function destroyVerifier(reason: string) {
    if (verifierRef.current) {
      const id = verifierId(verifierRef.current);
      otpLog("destroyVerifier [%s] reason=%s", id, reason);
      try {
        verifierRef.current.clear();
        otpLog("destroyVerifier [%s] clear() completed", id);
      } catch (e) {
        otpLog("destroyVerifier [%s] clear() threw (safe to ignore):", id, e);
      }
      verifierRef.current = null;
    } else {
      otpLog("destroyVerifier: no active verifier (reason=%s)", reason);
    }

    // CRITICAL: clear() only detaches Firebase's internal widget reference.
    // It does NOT reset the DOM container. Even after wiping innerHTML, the
    // Google reCAPTCHA script's internal widget registry may still associate
    // the old widget ID with that exact DOM node identity, causing the next
    // new RecaptchaVerifier() on the same element to throw:
    //   "reCAPTCHA has already been rendered in this element"
    //
    // The only reliable fix is to REPLACE the container element entirely.
    // A brand-new DOM node has no entry in Google's widget registry, so
    // RecaptchaVerifier always renders into it cleanly.
    const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
    if (container && container.parentNode) {
      const replacement = document.createElement("div");
      replacement.id = RECAPTCHA_CONTAINER_ID;
      replacement.style.cssText = container.style.cssText;
      replacement.setAttribute("aria-hidden", "true");
      container.parentNode.replaceChild(replacement, container);
      otpLog("destroyVerifier: DOM container replaced with fresh element");
    }
  }

  function stopCooldown() {
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
      cooldownTimer.current = null;
    }
    if (mountedRef.current) setCooldown(0);
  }

  function startCooldown() {
    stopCooldown();
    if (mountedRef.current) setCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownTimer.current = setInterval(() => {
      if (!mountedRef.current) {
        clearInterval(cooldownTimer.current!);
        return;
      }
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimer.current!);
          cooldownTimer.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  /**
   * Return the existing live verifier, or create a fresh one.
   * Never returns a cleared/destroyed instance.
   */
  function getOrCreateVerifier(): RecaptchaVerifier {
    if (verifierRef.current) {
      const id = verifierId(verifierRef.current);
      otpLog("getOrCreateVerifier: REUSING existing verifier [%s]", id);
      return verifierRef.current;
    }

    otpLog(
      "getOrCreateVerifier: creating NEW RecaptchaVerifier. " +
        "container=%s auth=%O",
      RECAPTCHA_CONTAINER_ID,
      auth
    );

    const container = document.getElementById(RECAPTCHA_CONTAINER_ID);
    if (!container) {
      const msg =
        "reCAPTCHA container #" +
        RECAPTCHA_CONTAINER_ID +
        " not found in DOM. This should never happen.";
      otpLog("ERROR:", msg);
      throw new Error(msg);
    }

    const verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
      size: "invisible",
      callback: () => {
        otpLog(
          "reCAPTCHA solved callback fired for [%s]",
          verifierId(verifier)
        );
      },
      "expired-callback": () => {
        otpLog(
          "reCAPTCHA token EXPIRED for [%s] — destroying",
          verifierId(verifier)
        );
        destroyVerifier("token-expired");
        if (mountedRef.current) {
          toast.error("reCAPTCHA expired. Please click 'Resend OTP'.");
          setSending(false);
          sendingRef.current = false;
        }
      },
    });

    verifierRef.current = verifier;
    otpLog("getOrCreateVerifier: created [%s]", verifierId(verifier));
    return verifier;
  }

  // ─── sendOtp ──────────────────────────────────────────────────────────────

  const sendOtp = useCallback(async () => {
    if (!phone) {
      otpLog("sendOtp: aborted — phone is empty");
      return;
    }
    if (sendingRef.current) {
      otpLog("sendOtp: aborted — already in flight (concurrent call prevented)");
      return;
    }

    sendingRef.current = true;
    if (mountedRef.current) setSending(true);
    if (mountedRef.current) setOtp("");

    otpLog("sendOtp: START phone=%s", phone);

    let verifier: RecaptchaVerifier;
    try {
      verifier = getOrCreateVerifier();
    } catch (err) {
      otpLog("sendOtp: getOrCreateVerifier threw:", err);
      sendingRef.current = false;
      if (mountedRef.current) setSending(false);
      toast.error("Could not initialise reCAPTCHA. Please refresh the page.");
      return;
    }

    otpLog(
      "sendOtp: calling signInWithPhoneNumber with auth=%O verifier=[%s]",
      auth,
      verifierId(verifier)
    );

    try {
      const result = await signInWithPhoneNumber(auth, phone, verifier);

      otpLog("sendOtp: signInWithPhoneNumber SUCCESS — ConfirmationResult received");

      if (mountedRef.current) {
        setConfirmationResult(result);
        setOtpSent(true);
        startCooldown();
        toast.success(`OTP sent to ${phone}`);
      }
    } catch (err: any) {
      const code: string = err?.code ?? "unknown";
      const msg: string  = err?.message ?? String(err);

      otpLog(
        "sendOtp: signInWithPhoneNumber FAILED code=%s message=%s",
        code,
        msg
      );
      otpLog("sendOtp: full error object:", err);

      // Firebase recommends destroying the verifier after any failure so the
      // next attempt gets a clean widget.
      destroyVerifier("send-failed:" + code);

      if (mountedRef.current) {
        if (code.includes("invalid-phone-number")) {
          toast.error("Invalid phone number. Please check and try again.");
        } else if (code.includes("too-many-requests")) {
          toast.error(
            "Too many attempts. Please wait a few minutes before trying again."
          );
        } else if (code.includes("quota-exceeded")) {
          toast.error("SMS quota exceeded. Please try again later.");
        } else {
          toast.error(`Failed to send OTP (${code}). Please try again.`);
        }
      }
    } finally {
      sendingRef.current = false;
      if (mountedRef.current) setSending(false);
      otpLog("sendOtp: END");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  // ─── handleVerify ─────────────────────────────────────────────────────────

  async function handleVerify() {
    if (!confirmationResult) {
      toast.error("No OTP session found. Please request a new OTP.");
      return;
    }
    if (otp.length !== OTP_LENGTH) {
      toast.error("Please enter the complete 6-digit OTP.");
      return;
    }

    otpLog("handleVerify: confirming OTP code");
    setVerifying(true);
    try {
      await confirmationResult.confirm(otp);
      otpLog("handleVerify: OTP confirmed — calling onVerified");
      onVerified(confirmationResult);
    } catch (err: any) {
      const code: string = err?.code ?? "";
      otpLog("handleVerify: confirm failed code=%s", code, err);
      if (
        code === "auth/invalid-verification-code" ||
        code === "auth/code-expired"
      ) {
        toast.error("Incorrect or expired OTP. Please request a new one.");
        setOtp("");
      } else {
        toast.error("Verification failed. Please try again.");
      }
    } finally {
      if (mountedRef.current) setVerifying(false);
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────

  const title =
    mode === "signup" ? "Verify Your Mobile Number" : "Verify Your Identity";

  const subtitle =
    mode === "signup"
      ? "Enter the 6-digit OTP sent to your registered mobile to complete signup."
      : "Enter the 6-digit OTP sent to your registered mobile to continue with password reset.";

  return (
    <>
      {/*
       * The reCAPTCHA container must exist in the DOM at all times while this
       * component is mounted — before, during and after the modal is visible.
       * It is positioned off-screen and hidden from screen readers.
       */}
      <div
        id={RECAPTCHA_CONTAINER_ID}
        style={{ position: "fixed", bottom: 0, left: 0, visibility: "hidden" }}
        aria-hidden="true"
      />

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="w-full max-w-sm bg-[#f7f6f2] border border-[#e5e3db] p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-[#737a83] hover:text-[#171b22] text-xl leading-none font-light"
              aria-label="Close"
            >
              ×
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#d95325] font-semibold block mb-1">
                {mode === "signup" ? "Phone Verification" : "Identity Verification"}
              </span>
              <h2 className="text-xl font-medium tracking-tight text-[#171b22]">
                {title}
              </h2>
              <p className="text-xs text-[#737a83] font-sans mt-1 leading-relaxed">
                {subtitle}
              </p>
              <p className="text-xs font-semibold text-[#171b22] mt-2">
                {phone}
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              {!otpSent ? (
                // Before OTP is sent: show the "Send OTP" button
                <>
                  <p className="text-xs text-[#737a83] font-sans leading-relaxed bg-[#f0eded] px-3 py-2 border border-[#e5e3db]">
                    Click the button below to send a 6-digit OTP to your mobile number.
                  </p>
                  <Button
                    type="button"
                    onClick={sendOtp}
                    disabled={sending}
                    className="w-full h-11 bg-[#d95325] hover:bg-[#bc3f18] text-white text-xs font-semibold tracking-wider uppercase rounded-none shadow-sm transition-all"
                  >
                    {sending ? "Sending OTP…" : "Send OTP to Mobile"}
                  </Button>
                </>
              ) : (
                // After OTP is sent: show the OTP input and verify button
                <>
                  <InputOTP
                    maxLength={OTP_LENGTH}
                    value={otp}
                    onChange={setOtp}
                    pattern={REGEXP_ONLY_DIGITS}
                    disabled={verifying || sending}
                  >
                    <InputOTPGroup className="gap-2">
                      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="w-11 h-12 text-base font-semibold border-[#e5e3db] rounded-none first:rounded-none last:rounded-none bg-white text-[#171b22] focus:ring-[#d95325]"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>

                  <Button
                    type="button"
                    onClick={handleVerify}
                    disabled={otp.length !== OTP_LENGTH || verifying || sending}
                    className="w-full h-11 bg-[#d95325] hover:bg-[#bc3f18] text-white text-xs font-semibold tracking-wider uppercase rounded-none shadow-sm transition-all"
                  >
                    {verifying ? "Verifying…" : "Verify OTP"}
                  </Button>

                  <p className="text-xs text-[#737a83] font-sans text-center">
                    Didn&apos;t receive it?{" "}
                    {cooldown > 0 ? (
                      <span className="text-[#171b22] font-semibold">
                        Resend in {cooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={sending}
                        className="font-semibold text-[#d95325] hover:text-[#bc3f18] disabled:opacity-50"
                      >
                        {sending ? "Sending…" : "Resend OTP"}
                      </button>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
