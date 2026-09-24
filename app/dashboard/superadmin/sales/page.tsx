"use client";

import { useEffect, useState } from "react";
import { getSalesStats, approveTransaction, rejectTransaction } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Users, PieChart, BarChart3 } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SuperadminSalesPage() {
    const [stats, setStats] = useState<{
        totalRevenue: number;
        totalTransactions: number;
        transactions: Transaction[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const { loading: authLoading } = useAuth();

    const fetchStats = async () => {
        if (authLoading) return;

        try {
            const data = await getSalesStats();
            // Sort by timestamp desc
            data.transactions.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setStats(data as any);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [authLoading]);

    async function handleApprove(id: string) {
        try {
            await approveTransaction(id);
            toast.success("Transaction approved and credits added.");
            fetchStats();
        } catch (error) {
            toast.error("Failed to approve transaction.");
        }
    }

    async function handleReject(id: string) {
        try {
            await rejectTransaction(id);
            toast.success("Transaction rejected.");
            fetchStats();
        } catch (error) {
            toast.error("Failed to reject transaction.");
        }
    }

    if (loading) return <div className="p-8">Loading platform sales data...</div>;

    const processChartData = (transactions: Transaction[] | undefined) => {
        if (!transactions || transactions.length === 0) return [];
        
        // Group by date string
        const grouped = transactions.reduce((acc, t) => {
            const dateStr = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!acc[dateStr]) acc[dateStr] = 0;
            acc[dateStr] += Number(t.amount) || 0;
            return acc;
        }, {} as Record<string, number>);

        // Convert to array and reverse to show chronological order
        return Object.entries(grouped)
            .map(([date, amount]) => ({ date, amount }))
            .reverse();
    };

    const chartData = processChartData(stats?.transactions);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Platform Sales & Revenue</h2>
                <p className="text-muted-foreground">Global overview of all subscription sales and transactions.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="relative overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-primary/10 blur-2xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (INR)</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">₹</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="text-green-600 font-medium">+12.5%</span> from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-purple-500/10 blur-2xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">{stats?.totalTransactions || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Successful payments across platform
                        </p>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-orange-500/10 blur-2xl" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Transacting Users</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                            {Array.from(new Set(stats?.transactions.map(t => t.userId || t.hrId))).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            HRs & Security Professionals contributing to revenue
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Chart */}
            <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Platform Revenue Trend
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Daily transaction volume overview</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {chartData.length > 0 ? (
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                        tickFormatter={(value) => `₹${value}`}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [`₹${(value || 0).toLocaleString()}`, 'Revenue']}
                                    />
                                    <Bar 
                                        dataKey="amount" 
                                        fill="hsl(var(--primary))" 
                                        radius={[4, 4, 0, 0]} 
                                        maxBarSize={50}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl mt-4">
                            <p className="text-muted-foreground font-medium">Not enough data to display chart</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Global Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>User / Role</TableHead>
                                <TableHead>Payment ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Plan / Package</TableHead>
                                <TableHead>Method & Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats?.transactions.map((t) => (
                                <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">
                                        {new Date(t.timestamp).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-foreground">{t.userName || t.hrName || "Unknown User"}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge 
                                                    variant="secondary" 
                                                    className={cn(
                                                        "text-[10px] px-1.5 py-0 h-4 uppercase font-bold",
                                                        (t.userRole === "hr" || !t.userRole) ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                    )}
                                                >
                                                    {t.userRole === "guard" ? "Security Professional" : (t.userRole ? t.userRole.toUpperCase() : "HR")}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground italic">ID: {(t.userId || t.hrId || "").slice(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-xs font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground break-all max-w-[200px]">
                                                {t.paymentId || "N/A"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize text-[11px] border-primary/20 bg-background">
                                            {t.type || (t.creditsAdded ? "credits" : "subscription")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{t.planName || t.packName || "Standard Package"}</span>
                                            {t.creditsAdded && <span className="text-[10px] text-muted-foreground">+{t.creditsAdded} Credits</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 items-start">
                                            <Badge 
                                                variant="secondary" 
                                                className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm",
                                                    t.paymentMethod === "qr_manual" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                                )}
                                            >
                                                {t.paymentMethod === "qr_manual" ? "Manual UPI" : "PayPal / Card"}
                                            </Badge>
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] uppercase tracking-wider",
                                                t.status === "pending" ? "border-amber-500 text-amber-500" :
                                                t.status === "rejected" ? "border-red-500 text-red-500" : "border-emerald-500 text-emerald-500"
                                            )}>
                                                {t.status || "completed"}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-black text-foreground">
                                        <span className="text-xs font-normal text-muted-foreground mr-1">
                                            INR
                                        </span>
                                        ₹{(Number(t.amount) || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {t.status === "pending" && (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => handleApprove(t.id)}>
                                                    Approve
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 text-xs border-red-500 text-red-600 hover:bg-red-50" onClick={() => handleReject(t.id)}>
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {stats?.transactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-40 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <PieChart className="h-10 w-10 opacity-10" />
                                            <p className="font-medium">No transactions found across the platform.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
