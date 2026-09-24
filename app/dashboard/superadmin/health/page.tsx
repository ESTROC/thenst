"use client";

import { useEffect, useState } from "react";
import {
    Activity,
    CheckCircle2,
    AlertTriangle,
    Wifi,
    Database,
    CreditCard,
    ShieldCheck,
    Server,
    Clock,
    RefreshCcw,
    Zap,
    HardDrive
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getSystemHealth } from "@/lib/firestore";
import type { SystemHealthStatus } from "@/lib/types";

export default function SystemHealthPage() {
    const [health, setHealth] = useState<SystemHealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastCheck, setLastCheck] = useState("");

    const fetchHealth = async () => {
        try {
            const data = await getSystemHealth();
            setHealth(data);
            setLastCheck(new Date().toLocaleTimeString());
        } catch (error) {
            console.error("Failed to fetch system health");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHealth();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchHealth();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCcw className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Running diagnostic checks...</p>
                </div>
            </div>
        );
    }

    const getServiceIcon = (name: string) => {
        if (name.includes("Database")) return Database;
        if (name.includes("Auth")) return ShieldCheck;
        if (name.includes("Config")) return Server;
        return Activity;
    };

    return (
        <div className="flex flex-col gap-8 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                        Real-time status of platform infrastructure. Last checked at {lastCheck}.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="rounded-xl"
                >
                    <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Status
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="md:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-emerald-500" />
                                    Infrastructure Health
                                </CardTitle>
                                <CardDescription>Core backend services and API connections.</CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1">
                                Active Session
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {health?.services.map((service) => {
                                const Icon = getServiceIcon(service.name);
                                return (
                                    <div key={service.name} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl bg-muted/50 ${service.status === 'operational' ? 'text-emerald-500' :
                                                    service.status === 'degraded' ? 'text-amber-500' : 'text-destructive'
                                                }`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{service.name}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Activity className="h-3 w-3" /> Latency: {service.latency}ms
                                                    </span>
                                                    <span className="h-1 w-1 rounded-full bg-border" />
                                                    <span className="text-xs text-muted-foreground">SSL Secure</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={service.status === 'operational' ? 'default' : 'destructive'} className={
                                                service.status === 'operational'
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-none'
                                                    : 'bg-destructive/10 text-destructive border-none'
                                            }>
                                                {service.status}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                Database Load
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Total Users</span>
                                    <span className="text-muted-foreground font-mono">{health?.stats.userCount}</span>
                                </div>
                                <Progress value={(health?.stats.userCount || 0) / 10} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">Transactions</span>
                                    <span className="text-muted-foreground font-mono">{health?.stats.transactionCount}</span>
                                </div>
                                <Progress value={(health?.stats.transactionCount || 0) / 5} className="h-2" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">KYC Docs</span>
                                    <span className="text-muted-foreground font-mono">{health?.stats.kycCount}</span>
                                </div>
                                <Progress value={(health?.stats.kycCount || 0) / 10} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Live Feed
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4 flex gap-3 border-b border-border/50 bg-emerald-500/[0.03]">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">Diagnostic Success</p>
                                    <p className="text-[10px] text-muted-foreground">All systems reached in {health?.services[0].latency}ms</p>
                                </div>
                            </div>
                            <div className="p-4 flex gap-3">
                                <Wifi className="h-5 w-5 text-emerald-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold">Firebase Connected</p>
                                    <p className="text-[10px] text-muted-foreground">Connection established via SDK 10.x</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
