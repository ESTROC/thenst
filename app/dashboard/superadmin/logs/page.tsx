"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShieldAlert, History, Filter, Search, Download } from "lucide-react";
import { getSystemLogs } from "@/lib/firestore";
import type { SystemLog } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getSystemLogs(200);
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

        if (roleFilter !== "all") {
            result = result.filter(log => log.role.toLowerCase() === roleFilter.toLowerCase());
        }

        setFilteredLogs(result);
    }, [searchQuery, actionFilter, roleFilter, logs]);

    const getActionBadge = (action: string) => {
        const a = action.toUpperCase();
        if (a.includes("LOGIN")) return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">LOGIN</Badge>;
        if (a.includes("SIGNUP")) return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">SIGNUP</Badge>;
        if (a.includes("EMAIL")) return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">EMAIL</Badge>;
        if (a.includes("HIRED")) return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">HIRED</Badge>;
        if (a.includes("DELETE")) return <Badge variant="destructive">DELETE</Badge>;
        if (a.includes("REJECT")) return <Badge variant="destructive">REJECTED</Badge>;
        return <Badge variant="secondary">{a}</Badge>;
    };

    const exportLogs = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Timestamp,User,Role,Action,Details\n"
            + filteredLogs.map(log => `${log.timestamp},${log.email},${log.role},${log.action},"${JSON.stringify(log.details).replace(/"/g, '""')}"`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_logs_${format(new Date(), "yyyy-MM-dd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <RoleGuard allowedRoles={["superadmin"]}>
            <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <ShieldAlert className="h-8 w-8 text-primary" />
                            System Audit Logs
                        </h1>
                        <p className="text-muted-foreground mt-1">Track every login, email, and administrative action across the platform.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportLogs} disabled={filteredLogs.length === 0}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by user email, action, or details..." 
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Action Type" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="login">Logins</SelectItem>
                                    <SelectItem value="signup">Signups</SelectItem>
                                    <SelectItem value="email">Emails Sent</SelectItem>
                                    <SelectItem value="kyc">KYC Updates</SelectItem>
                                    <SelectItem value="hiring">Hiring Activity</SelectItem>
                                    <SelectItem value="delete">Deletions</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger>
                                    <div className="flex items-center gap-2">
                                        <History className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="User Role" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="superadmin">SuperAdmin</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="hr">HR Manager</SelectItem>
                                    <SelectItem value="agency">Agency</SelectItem>
                                    <SelectItem value="guard">Security Professional</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[180px]">Timestamp</TableHead>
                                        <TableHead>User / Target</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead className="max-w-[300px]">Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                                <p className="mt-2 text-sm text-muted-foreground">Loading audit trail...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center">
                                                <History className="h-8 w-8 mx-auto text-muted-foreground opacity-20" />
                                                <p className="mt-2 text-sm text-muted-foreground">No logs found matching your filters.</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLogs.map((log) => {
                                            const safeDate = log.timestamp ? new Date(log.timestamp) : null;
                                            const dateDisplay = (safeDate && !isNaN(safeDate.getTime())) 
                                                ? format(safeDate, "MMM dd, HH:mm:ss")
                                                : "N/A";

                                            return (
                                                <TableRow key={log.id} className="group hover:bg-muted/30 transition-colors">
                                                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                                                        {dateDisplay}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-sm">
                                                        {log.email}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight">
                                                            {log.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getActionBadge(log.action)}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        <div className="max-w-[400px] truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:break-all">
                                                            {Object.entries(log.details || {}).map(([key, val]) => (
                                                                <span key={key} className="inline-block mr-2">
                                                                    <span className="font-semibold text-foreground/70">{key}:</span> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                </span>
                                                            ))}
                                                        </div>
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
