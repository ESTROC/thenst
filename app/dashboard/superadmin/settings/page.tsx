"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSystemConfig, updateSystemConfig } from "@/lib/firestore";
import type { SystemConfig, Package } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Settings,
    ShieldAlert,
    CreditCard,
    MessageSquare,
    Save,
    Plus,
    Trash2,
    DollarSign,
    Info,
    AlertTriangle,
    Users,
    RefreshCcw
} from "lucide-react";

export default function SuperadminSettingsPage() {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pricingView, setPricingView] = useState<"hr" | "guard">("hr");

    useEffect(() => {
        async function fetchConfig() {
            try {
                const data = await getSystemConfig();
                setConfig(data);
            } catch (error) {
                toast.error("Failed to load system settings");
            } finally {
                setLoading(false);
            }
        }
        fetchConfig();
    }, []);

    async function handleSave() {
        if (!config) return;
        setSaving(true);
        try {
            await updateSystemConfig(config);
            toast.success("System settings updated successfully!");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    }

    const updatePackage = (index: number, updates: Partial<Package>) => {
        if (!config) return;
        const newPackages = [...config.packages];
        newPackages[index] = { ...newPackages[index], ...updates };
        setConfig({ ...config, packages: newPackages });
    };

    const updateBanner = (updates: any) => {
        if (!config) return;
        setConfig({
            ...config,
            globalBanner: { ...config.globalBanner, ...updates }
        });
    };

    const updateGuardPlan = (index: number, updates: any) => {
        if (!config) return;
        const newPlans = [...(config.guardPlans || [])];
        newPlans[index] = { ...newPlans[index], ...updates };
        setConfig({ ...config, guardPlans: newPlans });
    };

    const applyInrMigration = () => {
        const newConfig: SystemConfig = {
            maintenanceMode: false,
            allowRegistrations: true,
            currency: "INR",
            globalBanner: {
                message: "",
                active: false,
                type: "info",
            },
            packages: [
                {
                    id: "silver",
                    name: "Silver Pack",
                    credits: 50,
                    price: 499,
                    features: ["Access to 50 Profiles", "Email & Phone Details", "No Expiry"],
                },
                {
                    id: "platinum",
                    name: "Platinum Pack",
                    credits: 200,
                    price: 999,
                    features: ["Access to 200 Profiles", "Email & Phone Details", "Priority Support", "Best Value"],
                },
            ],
            guardPlans: [
                {
                    id: "monthly",
                    name: "Monthly",
                    price: 99,
                    duration: "month",
                    features: ["Unlimited applications", "Access to verified security jobs", "Standard profile ranking"]
                },
                {
                    id: "yearly",
                    name: "Yearly",
                    price: 999,
                    duration: "year",
                    features: ["Unlimited applications", "Featured profile ranking", "Direct recruiter chat", "Priority support"]
                }
            ],
            updatedAt: new Date().toISOString(),
        };
        setConfig(newConfig);
        toast.info("Config reset to INR defaults. Click 'Save' to apply to database.");
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-8 pb-10">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
                        <div className="h-4 w-96 bg-muted animate-pulse rounded-lg" />
                    </div>
                    <div className="h-12 w-40 bg-muted animate-pulse rounded-xl" />
                </div>
                <div className="h-10 w-full bg-muted animate-pulse rounded-lg" />
                <div className="space-y-6 mt-6">
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="h-20 w-full bg-muted animate-pulse rounded-xl" />
                            <div className="h-20 w-full bg-muted animate-pulse rounded-xl" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
                    <p className="text-muted-foreground">Master control for platform behavior and pricing.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={applyInrMigration} className="rounded-xl">
                        <RefreshCcw className="mr-2 h-4 w-4" /> Reset to Latest Defaults
                    </Button>
                    <Button onClick={handleSave} disabled={saving} size="lg" className="rounded-xl shadow-lg shadow-primary/20">
                        {saving ? "Saving Changes..." : <><Save className="mr-2 h-4 w-4" /> Save Master Config</>}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="banners">Banners</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-6">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-primary" />
                                Platform Controls
                            </CardTitle>
                            <CardDescription>Emergency toggles for site-wide functionality.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold text-destructive">Maintenance Mode</Label>
                                    <p className="text-sm text-muted-foreground">Restrict all user access except for Superadmins.</p>
                                </div>
                                <Switch
                                    checked={config?.maintenanceMode}
                                    onCheckedChange={(val) => setConfig({ ...config!, maintenanceMode: val })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/30">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Allow New Registrations</Label>
                                    <p className="text-sm text-muted-foreground">Enable or disable the sign-up flow for guards and HR.</p>
                                </div>
                                <Switch
                                    checked={config?.allowRegistrations}
                                    onCheckedChange={(val) => setConfig({ ...config!, allowRegistrations: val })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency">Global Platform Currency</Label>
                                <div className="relative max-w-[200px]">
                                    <span className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground font-bold flex items-center justify-center">₹</span>
                                    <Input
                                        id="currency"
                                        className="pl-9"
                                        value={config?.currency}
                                        onChange={(e) => setConfig({ ...config!, currency: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Updating this changes the symbol used globally.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-8 mt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-muted/30 p-2 rounded-2xl border border-border/50 max-w-2xl mx-auto shadow-sm">
                        <Button 
                            variant={pricingView === "hr" ? "default" : "ghost"}
                            onClick={() => setPricingView("hr")}
                            className={cn(
                                "flex-1 h-12 rounded-xl text-md font-bold transition-all",
                                pricingView === "hr" ? "shadow-lg shadow-primary/20" : "hover:bg-background/50"
                            )}
                        >
                            <Users className="mr-2 h-5 w-5" />
                            HR Recruiter Packages
                        </Button>
                        <Button 
                            variant={pricingView === "guard" ? "default" : "ghost"}
                            onClick={() => setPricingView("guard")}
                            className={cn(
                                "flex-1 h-12 rounded-xl text-md font-bold transition-all",
                                pricingView === "guard" ? "shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white" : "hover:bg-background/50"
                            )}
                        >
                            <ShieldAlert className="mr-2 h-5 w-5" />
                            Security Professional Plans
                        </Button>
                    </div>

                    <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {pricingView === "hr" ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="h-8 w-1.5 bg-indigo-500 rounded-full" />
                                    <div>
                                        <h3 className="text-xl font-bold">HR Subscription Packs</h3>
                                        <p className="text-sm text-muted-foreground italic">Tokens and visibility credits for recruiters.</p>
                                    </div>
                                </div>
                                {config?.packages.map((pack, index) => (
                                    <Card key={pack.id} className="border-border/50 bg-card/10 backdrop-blur-sm border-l-4 border-l-indigo-500/50 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-4 border-b border-border/5">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xl">{pack.name}</CardTitle>
                                                    <CardDescription>Configure pricing and credit reward.</CardDescription>
                                                </div>
                                                <Badge variant="outline" className="font-mono bg-indigo-500/5 text-indigo-600 border-indigo-500/20 uppercase tracking-tighter">{pack.id}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="grid gap-6 pt-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Price (INR ₹)</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3   top-2.5 h-4 w-4 text-muted-foreground font-bold flex items-center justify-center">₹</span>
                                                    <Input
                                                        type="number"
                                                        className="pl-9 text-lg font-bold bg-background/50"
                                                        value={pack.price}
                                                        onChange={(e) => updatePackage(index, { price: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Credits Granted</Label>
                                                <div className="relative">
                                                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        className="pl-9 text-lg font-bold bg-background/50"
                                                        value={pack.credits}
                                                        onChange={(e) => updatePackage(index, { credits: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="sm:col-span-2 space-y-2">
                                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Features (Comma separated)</Label>
                                                <Input
                                                    className="bg-background/50"
                                                    value={pack.features.join(", ")}
                                                    onChange={(e) => updatePackage(index, { features: e.target.value.split(",").map(f => f.trim()) })}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="h-8 w-1.5 bg-emerald-500 rounded-full" />
                                    <div>
                                        <h3 className="text-xl font-bold">Security Professional Plans</h3>
                                        <p className="text-sm text-muted-foreground italic">Unlock high-paying job applications for guards.</p>
                                    </div>
                                </div>
                                {config?.guardPlans?.map((plan, index) => (
                                    <Card key={plan.id} className="border-border/50 bg-card/10 backdrop-blur-sm border-l-4 border-l-emerald-500/50 shadow-sm hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-4 border-b border-border/5">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xl">{plan.name} Plan</CardTitle>
                                                    <CardDescription>Dynamic {plan.duration}ly subscription logic.</CardDescription>
                                                </div>
                                                <Badge variant="outline" className="font-mono bg-emerald-500/5 text-emerald-600 border-emerald-500/20 uppercase tracking-tighter">{plan.id}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="grid gap-6 pt-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Price (INR ₹)</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground font-bold leading-none flex items-center">₹</span>
                                                    <Input
                                                        type="number"
                                                        className="pl-9 text-lg font-bold bg-background/50"
                                                        value={plan.price}
                                                        onChange={(e) => updateGuardPlan(index, { price: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Billing Cycle</Label>
                                                <select 
                                                    className="w-full h-11 px-3 py-2 rounded-md border border-input bg-background/50 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-bold"
                                                    value={plan.duration}
                                                    onChange={(e) => updateGuardPlan(index, { duration: e.target.value })}
                                                >
                                                    <option value="month">Monthly Cycle</option>
                                                    <option value="year">Yearly Cycle</option>
                                                </select>
                                            </div>
                                            <div className="sm:col-span-2 space-y-2">
                                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Features (Comma separated)</Label>
                                                <Input
                                                    className="bg-background/50"
                                                    value={plan.features.join(", ")}
                                                    onChange={(e) => updateGuardPlan(index, { features: e.target.value.split(",").map(f => f.trim()) })}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="banners" className="space-y-6 mt-6">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Global Communication
                            </CardTitle>
                            <CardDescription>Post an alert banner visible to all logged-in users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Banner Active</Label>
                                    <p className="text-sm text-muted-foreground">Toggle visibility for all users.</p>
                                </div>
                                <Switch
                                    checked={config?.globalBanner.active}
                                    onCheckedChange={(val) => updateBanner({ active: val })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Message Content</Label>
                                <Input
                                    placeholder="e.g. System upgrade scheduled for 2 AM EST..."
                                    value={config?.globalBanner.message}
                                    onChange={(e) => updateBanner({ message: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Banner Style</Label>
                                <div className="flex gap-4">
                                    {['info', 'warning', 'success'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => updateBanner({ type })}
                                            className={`flex-1 p-3 rounded-xl border-2 transition-all capitalize text-sm font-medium ${config?.globalBanner.type === type
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-border/50 hover:border-border'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {type === 'info' && <Info className="h-4 w-4" />}
                                                {type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                                                {type === 'success' && <CheckCircle2 className="h-4 w-4" />}
                                                {type}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {config?.globalBanner.active && (
                                <div className={`p-4 rounded-xl border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${config.globalBanner.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                                    config.globalBanner.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                    }`}>
                                    <Info className="h-5 w-5 shrink-0" />
                                    <p className="font-medium">{config.globalBanner.message || 'Sample Message...'}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

import { CheckCircle2 } from "lucide-react";
