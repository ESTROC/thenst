"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShieldAlert, History, Filter, Search } from "lucide-react";
import { getSystemLogs } from "@/lib/firestore";
import type { SystemLog } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("all");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getSystemLogs(100);
            setLogs(data);
            setFilteredLogs(data);
        } catch (error) {
            console.error("Error fetching logs:", error);
            toast.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        let result = logs;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(log => 
                log.email.toLowerCase().includes(query) || 
                log.action.toLowerCase().includes(query) ||
                JSON.stringify(log.details).toLowerCase().includes(query)
            );
        }

        if (actionFilter !== "all") {
            result = result.filter(log => log.action.toLowerCase().includes(actionFilter.toLowerCase()));
        }

        setFilteredLogs(result);
    }, [searchQuery, actionFilter, logs]);

    const getActionBadge = (action: string) => {
        const a = action.toUpperCase();
        if (a.includes("LOGIN")) return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">LOGIN</Badge>;
        if (a.includes("SIGNUP")) return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">SIGNUP</Badge>;
        if (a.includes("EMAIL")) return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">EMAIL</Badge>;
        if (a.includes("HIRED")) return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">HIRED</Badge>;
        return <Badge variant="secondary">{a}</Badge>;
    };

    return (
        <RoleGuard allowedRoles={["admin", "superadmin"]}>
            <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <ShieldAlert className="h-8 w-8 text-indigo-600" />
                            Activity Audit Trail
                        </h1>
                        <p className="text-muted-foreground mt-1">Review recent system actions and automated communications.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>

                <Card className="border-border/60 shadow-sm">
                    <CardHeader className="bg-muted/30 pb-6 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search logs..." 
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Filter by Action" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Activities</SelectItem>
                                    <SelectItem value="login">Logins</SelectItem>
                                    <SelectItem value="email">Emails</SelectItem>
                                    <SelectItem value="kyc">KYC Status</SelectItem>
                                    <SelectItem value="hiring">Hiring</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No activities recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLogs.map((log) => {
                                            const safeDate = log.timestamp ? new Date(log.timestamp) : null;
                                            const dateDisplay = (safeDate && !isNaN(safeDate.getTime())) 
                                                ? format(safeDate, "MMM dd, HH:mm")
                                                : "N/A";

                                            return (
                                                <TableRow key={log.id} className="text-sm">
                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {dateDisplay}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{log.email}</TableCell>
                                                    <TableCell>{getActionBadge(log.action)}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                                                        {Object.entries(log.details || {}).map(([k, v]) => `${k}: ${v}`).join(", ")}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </RoleGuard>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
