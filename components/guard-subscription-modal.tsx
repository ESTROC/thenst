"use client";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Loader2, Star, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { recordTransaction, getSystemConfig, updateTransactionStatusByPaymentId } from "@/lib/firestore";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface GuardSubscriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";

const DEFAULT_PLANS = [
    {
        id: "monthly",
        name: "Monthly",
        price: 99,
        duration: "month" as const,
        features: ["Unlimited applications", "Access to verified security jobs", "Standard profile ranking"],
    },
    {
        id: "yearly",
        name: "Yearly",
        price: 999,
        duration: "year" as const,
        features: [
            "Unlimited applications",
            "Featured profile ranking",
            "Direct recruiter chat",
            "Priority support",
        ],
    },
];

export function GuardSubscriptionModal({ open, onOpenChange, onSuccess }: GuardSubscriptionModalProps) {
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState(DEFAULT_PLANS);
    const [selectedPlan, setSelectedPlan] = useState<any>(DEFAULT_PLANS[0]);
    const { profile, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState("cashfree");
    const [transactionId, setTransactionId] = useState("");
    const [manualLoading, setManualLoading] = useState(false);
    const [configLoading, setConfigLoading] = useState(true);
    const [cashfreeLoading, setCashfreeLoading] = useState(false);
    const [cashfreeSDKReady, setCashfreeSDKReady] = useState(false);
    const [checkoutActive, setCheckoutActive] = useState(false);

    const scriptLoadPromise = useRef<Promise<void> | null>(null);
    const dialogBackdropRef = useRef<HTMLElement | null>(null);

    // ---------- Load Cashfree SDK ----------
    useEffect(() => {
        if (!open || cashfreeSDKReady) return;
        if (!scriptLoadPromise.current) {
            scriptLoadPromise.current = new Promise<void>((resolve, reject) => {
                if (document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]')) {
                    setCashfreeSDKReady(true);
                    resolve();
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
                script.async = true;
                script.onload = () => {
                    setCashfreeSDKReady(true);
                    resolve();
                };
                script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
                document.head.appendChild(script);
            });
        }
        scriptLoadPromise.current.catch((err) => {
            console.error(err);
            toast.error("Cashfree payment SDK could not be loaded.");
        });
    }, [open, cashfreeSDKReady]);

    // ---------- Fetch guard plans ----------
    useEffect(() => {
        async function fetchConfig() {
            try {
                const config = await getSystemConfig();
                if (config.guardPlans && config.guardPlans.length > 0) {
                    setPlans(config.guardPlans as any);
                    setSelectedPlan(config.guardPlans[0]);
                }
            } catch (error) {
                console.error("Failed to load guard plans:", error);
            } finally {
                setConfigLoading(false);
            }
        }
        if (open) fetchConfig();
    }, [open]);

    // ---------- Hide dialog overlay when Cashfree is active ----------
    useEffect(() => {
        if (checkoutActive) {
            // Find the backdrop (data-slot="dialog-overlay")
            const backdrop = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
            if (backdrop) {
                dialogBackdropRef.current = backdrop;
                backdrop.style.display = "none"; // completely remove from view
            }
        } else {
            // Restore backdrop
            if (dialogBackdropRef.current) {
                dialogBackdropRef.current.style.display = "";
                dialogBackdropRef.current = null;
            }
        }
    }, [checkoutActive]);

    // ---------- Payment success handler ----------
    async function handlePaymentSuccess(
        details: any,
        method: "paypal" | "qr_manual" | "bank_manual" | "cashfree" = "paypal"
    ) {
        if (!profile || !selectedPlan) return;
        setLoading(true);
        try {
            const expiresAt = new Date();
            if (selectedPlan.id === "yearly") {
                expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            } else {
                expiresAt.setDate(expiresAt.getDate() + 30);
            }

            if (method === "cashfree") {
                const res = await fetch("/api/payment/cashfree/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        orderId: details.id || details,
                        userId: profile.uid,
                        userRole: "guard",
                        credits: 0,
                        planId: selectedPlan.id,
                    }),
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Failed to verify payment");
                }
            } else {
                await updateDoc(doc(db, "users", profile.uid), {
                    guardSubscription: {
                        plan: selectedPlan.id,
                        status: "active",
                        expiresAt: expiresAt.toISOString(),
                        paymentId: details.id || details,
                        paymentMethod: method,
                    },
                });

                await recordTransaction({
                    userId: profile.uid,
                    userName: profile.fullName,
                    userRole: "guard",
                    amount: selectedPlan.price,
                    planName: selectedPlan.name,
                    type: "subscription",
                    paymentId: details.id || details,
                    paymentMethod: method,
                });
            }

            await refreshProfile();
            toast.success(`Successfully subscribed to the ${selectedPlan.name} plan!`);
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to activate subscription. Please contact support.");
        } finally {
            setLoading(false);
        }
    }

    // ---------- Manual payment (QR / Bank) ----------
    async function handleManualPayment(method: "qr_manual" | "bank_manual") {
        if (!transactionId.trim()) {
            toast.error("Please enter the Transaction ID / Ref Number from your app.");
            return;
        }
        setManualLoading(true);
        try {
            await handlePaymentSuccess(transactionId, method);
        } catch (error) {
            console.error(error);
        } finally {
            setManualLoading(false);
        }
    }

    // ---------- Cashfree checkout ----------
    async function initiateCashfreePayment() {
        if (!selectedPlan || !profile) return;
        if (!cashfreeSDKReady) {
            toast.error("Payment gateway not ready. Please try another method.");
            return;
        }

        setCashfreeLoading(true);
        setCheckoutActive(true); // triggers backdrop hiding

        // Fix body scroll lock
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "visible";

        try {
            const res = await fetch("/api/payment/cashfree/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: selectedPlan.price,
                    userId: profile.uid,
                    userName: profile.fullName,
                    packId: selectedPlan.id,
                    credits: 0,
                    userEmail: profile.email || "no-reply@example.com", // ADD THIS LINE
                    userPhone: profile.phone || "9999999999", // ADD THIS LINE
                }),
            });

            if (!res.ok) {
                let errorMsg = `Server error (${res.status})`;
                try {
                    const errData = await res.json();
                    if (errData?.error) errorMsg = errData.error;
                } catch { }
                throw new Error(errorMsg);
            }

            const data = await res.json();
            const { paymentSessionId, orderId } = data;
            if (!paymentSessionId || !orderId) throw new Error("Invalid response from server");

            const Cashfree = (window as any).Cashfree;
            if (!Cashfree) throw new Error("Cashfree SDK not available");

            const cashfree = new Cashfree();
            onOpenChange(false);
            const checkoutResult = await cashfree.checkout({
                paymentSessionId,
                redirectTarget: "_modal",
                mode: "production", // use "sandbox" for test keys
            });

            console.log("Checkout result:", checkoutResult);

            if (checkoutResult.error) {
                console.error("Cashfree checkout error:", checkoutResult.error);
                toast.error(checkoutResult.error.message || "Payment failed. Please try again.");
                return;
            }

            const msg = checkoutResult.paymentDetails?.paymentMessage || "";
            if (checkoutResult.paymentDetails) {
                if (msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("error")) {
                    toast.error(`Payment failed: ${msg}`);
                } else {
                    await handlePaymentSuccess(orderId, "cashfree");
                }
            } else if (checkoutResult.redirect) {
                toast.error("Payment requires redirect which is not supported right now.");
            } else {
                toast.error(`Payment was not successful (Status: ${msg || 'Unknown'}). Please try again.`);
            }
        } catch (error: any) {
            console.error("Cashfree error:", error);
            toast.error(error.message || "Cashfree payment failed.");
        } finally {
            document.body.style.overflow = originalOverflow;
            setCheckoutActive(false); // restores backdrop
            setCashfreeLoading(false);
        }
    }

    // ---------- Loading state ----------
    if (configLoading && open) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogTitle className="sr-only">Loading Plans</DialogTitle>
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Loading plans...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                if (checkoutActive) return; // prevent closing while Cashfree modal is active
                onOpenChange(newOpen);
            }}
        >
            <DialogContent
                className={`max-w-4xl w-[95vw] sm:w-full p-0 overflow-hidden flex flex-col h-[90vh] max-h-[90vh] ${checkoutActive ? "z-10" : ""
                    }`}
                style={checkoutActive ? { zIndex: 10 } : undefined}
            >
                <ScrollArea className="flex-1 w-full">
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl">Unlock Job Applications</DialogTitle>
                            <DialogDescription>
                                To apply for high-paying security jobs, please upgrade your account to an active subscription.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6 md:grid-cols-2">
                            {plans.map((plan: any) => (
                                <Card
                                    key={plan.id}
                                    className={`relative border-2 cursor-pointer transition-all hover:shadow-md ${selectedPlan?.id === plan.id
                                        ? "border-primary ring-1 ring-primary bg-primary/5"
                                        : "border-border"
                                        }`}
                                    onClick={() => setSelectedPlan(plan)}
                                >
                                    {plan.id === "yearly" && (
                                        <div className="absolute -top-3 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full z-10 flex items-center gap-1 shadow-lg">
                                            <Star className="w-3 h-3" fill="currentColor" /> BEST VALUE
                                        </div>
                                    )}
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">{plan.name} Plan</CardTitle>
                                            {selectedPlan?.id === plan.id && (
                                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="h-3 w-3 text-primary-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <CardDescription className="text-3xl font-bold text-foreground mt-2">
                                            ₹{plan.price.toLocaleString()}
                                            <span className="text-sm font-normal text-muted-foreground">/{plan.duration}</span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {plan.features.map((feature: string, i: number) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-emerald-500 shrink-0" /> {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {selectedPlan && (
                            <div className="mt-8 p-6 bg-secondary/20 rounded-2xl border border-border/50">
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-xl">Confirm: {selectedPlan.name} Plan</h4>
                                            <p className="text-muted-foreground text-sm">
                                                Full access to job applications for 1 {selectedPlan.duration}.
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                                                Total Price
                                            </p>
                                            <p className="text-2xl font-black text-primary">
                                                ₹{selectedPlan.price.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                        <TabsList className="flex flex-col sm:flex-row w-full max-w-[700px] mb-8 h-auto bg-muted/50 p-1 gap-1">
                                            <TabsTrigger
                                                value="cashfree"
                                                className="w-full text-sm py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
                                            >
                                                Cashfree
                                                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                                    RECOMMENDED
                                                </span>
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="paypal"
                                                className="w-full text-sm py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                Card / PayPal
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="qr"
                                                className="w-full text-sm py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                Scan QR
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="bank"
                                                className="w-full text-sm py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                Bank Transfer
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* Cashfree Tab */}
                                        <TabsContent value="cashfree" className="mt-0 outline-none">
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-8 p-6 bg-background rounded-xl border border-border shadow-sm">
                                                <div className="flex-1 space-y-2">
                                                    <p className="font-semibold flex items-center gap-2">
                                                        <Check className="h-5 w-5 text-emerald-500" /> UPI, Cards, Netbanking
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Pay securely with UPI, cards, or netbanking via Cashfree. Instant activation.
                                                    </p>
                                                </div>
                                                <div className="w-full md:w-[320px]">
                                                    {cashfreeLoading || loading ? (
                                                        <Button disabled className="w-full h-12 text-lg">
                                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={initiateCashfreePayment}
                                                            className="w-full h-12 text-lg font-semibold bg-orange-600 hover:bg-orange-700"
                                                        >
                                                            Pay ₹{selectedPlan.price.toLocaleString()}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* PayPal Tab */}
                                        <TabsContent value="paypal" className="mt-0 outline-none">
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-8 p-6 bg-background rounded-xl border border-border shadow-sm">
                                                <div className="flex-1 space-y-2">
                                                    <p className="font-semibold flex items-center gap-2">
                                                        <CreditCard className="h-5 w-5 text-blue-600" /> Credit/Debit Cards & PayPal
                                                    </p>
                                                    <p className="text-sm text-muted-foreground italic">
                                                        Note: PayPal will charge the equivalent in USD (~$
                                                        {(selectedPlan.price / 83).toFixed(2)})
                                                    </p>
                                                </div>
                                                <div className="w-full md:w-[320px]">
                                                    {loading ? (
                                                        <Button disabled className="w-full h-12 text-lg">
                                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Activating...
                                                        </Button>
                                                    ) : (
                                                        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}>
                                                            <PayPalButtons
                                                                style={{ layout: "horizontal", height: 48 }}
                                                                createOrder={(data, actions) => {
                                                                    return actions.order.create({
                                                                        intent: "CAPTURE",
                                                                        purchase_units: [
                                                                            {
                                                                                amount: {
                                                                                    currency_code: "USD",
                                                                                    value: (selectedPlan.price / 83).toFixed(2),
                                                                                },
                                                                                description: `TheNST ${selectedPlan.name} Subscription`,
                                                                            },
                                                                        ],
                                                                    });
                                                                }}
                                                                onApprove={async (data, actions) => {
                                                                    if (actions.order) {
                                                                        const details = await actions.order.capture();
                                                                        await handlePaymentSuccess(details, "paypal");
                                                                    }
                                                                }}
                                                            />
                                                        </PayPalScriptProvider>
                                                    )}
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* QR Tab */}
                                        <TabsContent value="qr" className="mt-0 outline-none">
                                            <div className="flex flex-col lg:flex-row items-stretch gap-8 bg-background p-6 rounded-xl border border-border shadow-sm">
                                                <div className="bg-white rounded-2xl shadow-xl shrink-0 flex flex-col items-center justify-center border border-border/50 overflow-hidden w-[220px] mx-auto lg:w-[260px] pb-3">
                                                    <a
                                                        href={`upi://pay?pa=nebulex@icici&pn=MSNEBULEXDEFTECHFOUNDATION&mc=7392&cu=INR&am=${selectedPlan.price.toFixed(2)}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            window.location.href = `upi://pay?pa=nebulex@icici&pn=MSNEBULEXDEFTECHFOUNDATION&mc=7392&tr=TXN${Date.now()}&cu=INR&am=${selectedPlan.price.toFixed(2)}`;
                                                        }}
                                                        className="block w-full"
                                                    >
                                                        <img
                                                            src="/images/payment_qr.jpg"
                                                            alt="Paytm UPI QR Code"
                                                            className="w-full h-auto object-contain p-2 hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src =
                                                                    "https://via.placeholder.com/400?text=QR+Code+Missing";
                                                            }}
                                                        />
                                                    </a>
                                                    <a
                                                        href={`upi://pay?pa=nebulex@icici&pn=MSNEBULEXDEFTECHFOUNDATION&mc=7392&cu=INR&am=${selectedPlan.price.toFixed(2)}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            window.location.href = `upi://pay?pa=nebulex@icici&pn=MSNEBULEXDEFTECHFOUNDATION&mc=7392&tr=TXN${Date.now()}&cu=INR&am=${selectedPlan.price.toFixed(2)}`;
                                                        }}
                                                        className="text-[13px] font-bold text-primary hover:underline mt-2 mb-1 flex items-center gap-1"
                                                    >
                                                        <span>📱 Tap to Pay on Mobile</span>
                                                    </a>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center space-y-8">
                                                    <div className="space-y-2">
                                                        <h5 className="font-bold text-2xl text-primary flex items-center gap-2">
                                                            Scan to Pay
                                                        </h5>
                                                        <p className="text-muted-foreground leading-relaxed italic text-sm">
                                                            Scan the QR code with any UPI app (Paytm, GPay, PhonePe). Pay exactly{" "}
                                                            <strong className="text-foreground">₹{selectedPlan.price.toLocaleString()}</strong> to
                                                            activate your plan.
                                                        </p>
                                                    </div>
                                                    <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-foreground">
                                                                Transaction ID / Ref Number
                                                            </label>
                                                            <Input
                                                                placeholder="Enter the 12-digit transaction ID"
                                                                value={transactionId}
                                                                onChange={(e) => setTransactionId(e.target.value)}
                                                                className="h-12 bg-background border-primary/20 focus:border-primary"
                                                            />
                                                        </div>
                                                        <Button
                                                            className="w-full h-auto py-3 text-lg font-bold shadow-lg shadow-primary/20 whitespace-normal"
                                                            onClick={() => handleManualPayment("qr_manual")}
                                                            disabled={manualLoading}
                                                        >
                                                            {manualLoading ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...
                                                                </>
                                                            ) : (
                                                                "Confirm & Activate Plan Instantly"
                                                            )}
                                                        </Button>
                                                        <p className="text-[11px] text-center text-muted-foreground font-medium">
                                                            💡 Trust confirmation: Your plan activates immediately. We verify IDs within 24 hours.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* Bank Transfer Tab */}
                                        <TabsContent value="bank" className="mt-0 outline-none">
                                            <div className="flex flex-col lg:flex-row items-stretch gap-8 bg-background p-6 rounded-xl border border-border shadow-sm">
                                                <div className="flex-1 flex flex-col justify-between space-y-6">
                                                    <div className="space-y-2">
                                                        <h5 className="font-bold text-2xl text-primary flex items-center gap-2">
                                                            Direct Bank Transfer
                                                        </h5>
                                                        <p className="text-muted-foreground leading-relaxed italic text-sm">
                                                            Transfer exactly{" "}
                                                            <strong className="text-foreground">₹{selectedPlan.price.toLocaleString()}</strong> to the
                                                            account below, then enter your reference number.
                                                        </p>
                                                        <div className="mt-4 p-5 bg-muted/30 border border-border/50 rounded-xl text-xs sm:text-sm space-y-2 font-mono shadow-inner break-all whitespace-normal sm:break-normal">
                                                            <p className="font-bold text-foreground mb-3 font-sans uppercase text-xs tracking-widest border-b pb-2">
                                                                Bank Details
                                                            </p>
                                                            <p>
                                                                <span className="text-muted-foreground w-24 inline-block">Entity:</span> MS NEBULEX
                                                                DEFTECH FOUNDATION
                                                            </p>
                                                            <p>
                                                                <span className="text-muted-foreground w-24 inline-block">A/C No:</span> 018905014878
                                                            </p>
                                                            <p>
                                                                <span className="text-muted-foreground w-24 inline-block">IFSC:</span> ICIC0000189
                                                            </p>
                                                            <p>
                                                                <span className="text-muted-foreground w-24 inline-block">Swift:</span> ICICINBBCTS
                                                            </p>
                                                            <p>
                                                                <span className="text-muted-foreground w-24 inline-block">UPI ID:</span>{" "}
                                                                <a
                                                                    href={`upi://pay?pa=nebulex@icici&pn=MSNEBULEXDEFTECHFOUNDATION&mc=7392&cu=INR&am=${selectedPlan.price.toFixed(2)}`}
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        window.location.href = `upi://pay?pa=nebulex@icici&pn=MSNEBULEXDEFTECHFOUNDATION&mc=7392&tr=TXN${Date.now()}&cu=INR&am=${selectedPlan.price.toFixed(2)}`;
                                                                    }}
                                                                    className="text-blue-600 hover:underline cursor-pointer"
                                                                >
                                                                    nebulex@icici
                                                                </a>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-end space-y-6">
                                                    <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-foreground">
                                                                Transaction ID / UTR Number
                                                            </label>
                                                            <Input
                                                                placeholder="Enter the transaction reference"
                                                                value={transactionId}
                                                                onChange={(e) => setTransactionId(e.target.value)}
                                                                className="h-12 bg-background border-primary/20 focus:border-primary"
                                                            />
                                                        </div>
                                                        <Button
                                                            className="w-full h-auto py-3 text-lg font-bold shadow-lg shadow-primary/20 whitespace-normal"
                                                            onClick={() => handleManualPayment("bank_manual")}
                                                            disabled={manualLoading}
                                                        >
                                                            {manualLoading ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...
                                                                </>
                                                            ) : (
                                                                "Confirm & Activate Plan Instantly"
                                                            )}
                                                        </Button>
                                                        <p className="text-[11px] text-center text-muted-foreground font-medium">
                                                            💡 Trust confirmation: Your plan activates immediately. We verify IDs within 24 hours.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}