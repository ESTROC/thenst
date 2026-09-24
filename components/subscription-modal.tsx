"use client";
import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Loader2, QrCode, Building, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { purchaseCredits, getSystemConfig } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import type { Package } from "@/lib/types";

interface SubscriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

export function SubscriptionModal({ open, onOpenChange, onSuccess }: SubscriptionModalProps) {
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPack, setSelectedPack] = useState<Package | null>(null);
    const { profile, refreshProfile } = useAuth();
    const [configLoading, setConfigLoading] = useState(true);
    const [transactionId, setTransactionId] = useState("");
    const [manualLoading, setManualLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("cashfree");
    const [cashfreeLoading, setCashfreeLoading] = useState(false);
    const [cashfreeSDKReady, setCashfreeSDKReady] = useState(false);
    const [checkoutActive, setCheckoutActive] = useState(false); // ✅ tracks Cashfree modal state

    const scriptLoadPromise = useRef<Promise<void> | null>(null);

    // Load Cashfree SDK script
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

    // Fetch packages
    useEffect(() => {
        async function fetchConfig() {
            try {
                const config = await getSystemConfig();
                if (profile?.role === "intern") {
                    const internPack: Package = {
                        id: "intern_500",
                        name: "Premium Pack",
                        credits: 500,
                        price: 500,
                        features: [
                            "500 Contact Credits",
                            "Access to Security Professionals & Agencies",
                            "Valid for all profile types",
                            "No Expiry",
                        ],
                    };
                    setPackages([internPack]);
                    setSelectedPack(internPack);
                } else {
                    setPackages(config.packages);
                    setSelectedPack(config.packages[1] || config.packages[0]);
                }
            } catch (error) {
                console.error("Failed to load packages:", error);
            } finally {
                setConfigLoading(false);
            }
        }
        if (open) fetchConfig();
    }, [open, profile]);

    // Handle successful payment (all methods)
    async function handlePaymentSuccess(
        details: any,
        method: "paypal" | "qr_manual" | "bank_manual" | "cashfree" = "paypal"
    ) {
        if (!profile || !selectedPack) return;
        setLoading(true);
        try {
            if (method === "paypal") {
                const res = await fetch("/api/payment/cashfree/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        orderID: details.id,
                        hrId: profile.uid,
                        hrName: profile.fullName,
                        packName: selectedPack.name,
                        credits: selectedPack.credits,
                        amount: selectedPack.price,
                    }),
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Failed to verify payment");
                }
            } else if (method === "cashfree") {
                const res = await fetch("/api/payment/cashfree/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        orderId: details.id || details,
                        userId: profile.uid,
                        userRole: profile.role || "hr",
                        credits: selectedPack.credits,
                        planId: selectedPack.name,
                    }),
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Failed to verify payment");
                }
            } else {
                await purchaseCredits(
                    profile.uid,
                    profile.fullName,
                    selectedPack.name,
                    selectedPack.price,
                    selectedPack.credits,
                    details,
                    method
                );
            }
            await refreshProfile();
            if (method === "qr_manual" || method === "bank_manual") {
                toast.success("Verification pending. Credits will be added once verified (usually within 24 hours).");
            } else if (method === "cashfree") {
                toast.success(`Payment successful! ${selectedPack.credits} credits added.`);
            } else {
                toast.success(`Purchased ${selectedPack.name} successfully!`);
            }
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to record transaction.");
        } finally {
            setLoading(false);
        }
    }

    async function handleManualPayment(method: "qr_manual" | "bank_manual") {
        if (!transactionId.trim()) {
            toast.error("Please enter the Transaction ID / Ref Number.");
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

    // Cashfree payment flow
    async function initiateCashfreePayment() {
        if (!selectedPack || !profile) return;
        if (!cashfreeSDKReady) {
            toast.error("Payment gateway not ready. Please try another method.");
            return;
        }

        setCashfreeLoading(true);
        setCheckoutActive(true); // ✅ Lower dialog overlay z‑index

        // Fix body overflow (dialog locks body scroll)
        const originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "visible";

        try {
            const res = await fetch("/api/payment/cashfree/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: selectedPack.price,
                    userId: profile.uid,
                    userName: profile.fullName,
                    packId: selectedPack.id,
                    credits: selectedPack.credits,
                    userEmail: profile.email || "no-reply@example.com",
                    userPhone: profile.phone || "9999999999",
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

            // ✅ ADD THIS LINE: Close the Shadcn Dialog so it stops blocking Cashfree
            onOpenChange(false);

            const checkoutResult = await cashfree.checkout({
                paymentSessionId,
                redirectTarget: "_modal",
                mode: "production",
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
            document.body.style.overflow = originalBodyOverflow; // Restore body scroll
            setCheckoutActive(false); // ✅ Restore dialog overlay z‑index
            setCashfreeLoading(false);
        }
    }

    if (configLoading && open) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogTitle className="sr-only">Loading Packages</DialogTitle>
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Loading best deals for you...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                // Prevent closing while Cashfree is active (optional)
                if (checkoutActive) return;
                onOpenChange(newOpen);
            }}
        >
            {/* ✅ Lower the overlay z‑index when Cashfree is active */}
            <DialogContent
                className={`max-w-4xl w-[95vw] sm:w-full p-0 overflow-hidden flex flex-col h-[90vh] max-h-[90vh] ${checkoutActive ? "z-10" : ""
                    }`}
                style={checkoutActive ? { zIndex: 10 } : undefined}
            >
                <ScrollArea className="flex-1 w-full">
                    <div className="p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl">Upgrade Your Plan</DialogTitle>
                            <DialogDescription>
                                Purchase credits to view more security professional profiles.
                                Currently you have <b className="text-primary">{profile?.credits || 0}</b> credits.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
                            {packages.map((pack) => (
                                <Card
                                    key={pack.id}
                                    className={`relative border-2 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${selectedPack?.id === pack.id
                                        ? "border-primary ring-1 ring-primary bg-primary/5"
                                        : "border-border"
                                        }`}
                                    onClick={() => setSelectedPack(pack)}
                                >
                                    {pack.id === "platinum" && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-black rounded-full z-10 shadow-xl tracking-wider">
                                            BEST VALUE
                                        </div>
                                    )}
                                    <CardHeader className="text-center pb-2">
                                        <CardTitle className="text-xl font-bold">{pack.name}</CardTitle>
                                        <div className="flex justify-center items-baseline gap-2 mt-2">
                                            <CardDescription className="text-4xl font-black text-foreground">
                                                ₹{pack.price.toLocaleString()}
                                            </CardDescription>
                                        </div>
                                        <p className="text-sm font-medium text-primary mt-2">{pack.credits} Contact Credits</p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-px bg-border/50 w-full my-4" />
                                        <ul className="space-y-3 text-sm text-muted-foreground">
                                            {pack.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                    </div>
                                                    <span className="font-medium text-foreground/80">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {selectedPack && (
                            <div className="mt-8 p-6 bg-secondary/20 rounded-2xl border border-border/50">
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-xl">Confirm Selection: {selectedPack.name}</h4>
                                            <p className="text-muted-foreground">{selectedPack.credits} new credits will be added.</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Amount</p>
                                            <p className="text-2xl font-black text-primary">₹{selectedPack.price.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                        <TabsList className="flex flex-wrap w-full max-w-[700px] mx-auto mb-8 h-auto bg-muted/50 p-1 gap-1">
                                            <TabsTrigger value="cashfree" className="flex-1 text-sm py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                                                Cashfree
                                                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">RECOMMENDED</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="paypal" className="flex-1 text-sm py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                                Card / PayPal
                                            </TabsTrigger>
                                            <TabsTrigger value="qr" className="flex-1 text-sm py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                                Scan QR
                                            </TabsTrigger>
                                            <TabsTrigger value="bank" className="flex-1 text-sm py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
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
                                                            Pay ₹{selectedPack.price.toLocaleString()}
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
                                                    <p className="text-sm text-muted-foreground">
                                                        Pay internationally with PayPal or use your card without a PayPal account.
                                                    </p>
                                                </div>
                                                <div className="w-full md:w-[320px]">
                                                    {loading ? (
                                                        <Button disabled className="w-full h-12 text-lg">
                                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                                                        </Button>
                                                    ) : (
                                                        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}>
                                                            <PayPalButtons
                                                                style={{ layout: "horizontal", color: "blue", shape: "rect", label: "pay" }}
                                                                createOrder={(_, actions) => {
                                                                    const usdAmount = (selectedPack.price / 83).toFixed(2);
                                                                    return actions.order.create({
                                                                        intent: "CAPTURE",
                                                                        purchase_units: [{
                                                                            amount: { value: usdAmount, currency_code: "USD" },
                                                                            description: `${selectedPack.name} - ${selectedPack.credits} credits`,
                                                                        }],
                                                                    });
                                                                }}
                                                                onApprove={async (data) => {
                                                                    await handlePaymentSuccess(data, "paypal");
                                                                }}
                                                                onError={() => toast.error("PayPal error. Please try again.")}
                                                            />
                                                        </PayPalScriptProvider>
                                                    )}
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* QR Tab */}
                                        <TabsContent value="qr" className="mt-0 outline-none">
                                            <div className="p-6 bg-background rounded-xl border border-border shadow-sm space-y-4">
                                                <div className="flex items-center gap-2 text-lg font-semibold">
                                                    <QrCode className="h-6 w-6 text-primary" /> Scan & Pay
                                                </div>
                                                <p className="text-muted-foreground">
                                                    Scan the QR code below using any UPI app and enter the Transaction ID after payment.
                                                </p>
                                                <div className="flex justify-center">
                                                    <img src="/upi-qr-placeholder.png" alt="UPI QR Code" className="w-48 h-48 border rounded-xl p-2" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Enter UPI Transaction ID"
                                                        value={transactionId}
                                                        onChange={(e) => setTransactionId(e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Button onClick={() => handleManualPayment("qr_manual")} disabled={manualLoading}>
                                                        {manualLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                                        Submit
                                                    </Button>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* Bank Transfer Tab */}
                                        <TabsContent value="bank" className="mt-0 outline-none">
                                            <div className="p-6 bg-background rounded-xl border border-border shadow-sm space-y-4">
                                                <div className="flex items-center gap-2 text-lg font-semibold">
                                                    <Building className="h-6 w-6 text-primary" /> Bank Transfer
                                                </div>
                                                <p className="text-muted-foreground">
                                                    Transfer directly to our bank account and enter the reference number below.
                                                </p>
                                                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                                                    <p><span className="font-medium">Account Name:</span> Your Company Name</p>
                                                    <p><span className="font-medium">Bank:</span> Example Bank</p>
                                                    <p><span className="font-medium">Account Number:</span> 1234567890</p>
                                                    <p><span className="font-medium">IFSC Code:</span> EXMP0001234</p>
                                                    <p><span className="font-medium">SWIFT:</span> EXMPINBBXXX</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Enter Reference / Transaction ID"
                                                        value={transactionId}
                                                        onChange={(e) => setTransactionId(e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Button onClick={() => handleManualPayment("bank_manual")} disabled={manualLoading}>
                                                        {manualLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                                        Submit
                                                    </Button>
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