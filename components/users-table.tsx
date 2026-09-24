"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Shield, ShieldOff, Trash2, UserCog, Eye, Loader2, Check, X, Building } from "lucide-react";
import { toast } from "sonner";
import { updateUserStatus, updateUserRole, deleteUser } from "@/lib/firestore";
import { cn } from "@/lib/utils";
import type { UserProfile, UserRole } from "@/lib/types";

interface UsersTableProps {
  users: UserProfile[];
  onRefresh: () => void;
  currentUserRole: UserRole;
  showRoleActions?: boolean;
  promoteRoleTo?: UserRole;
  onViewDetails?: (user: UserProfile) => void;
  onApprove?: (user: UserProfile) => void;
  onReject?: (user: UserProfile) => void;
  showKycStatus?: boolean;
  showDirectActions?: boolean;
  hideRole?: boolean;
  hideDiscoveryData?: boolean;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium px-2.5 py-0.5 rounded-full capitalize shadow-sm",
        status === "active" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
        status === "disabled" && "border-amber-500/30 bg-amber-500/10 text-amber-600",
        status === "blocked" && "border-red-500/30 bg-red-500/10 text-red-600",
        status === "pending_verification" && "border-blue-500/30 bg-blue-500/10 text-blue-600"
      )}
    >
      {status}
    </Badge>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs font-medium",
        role === "guard" && "bg-primary/10 text-primary",
        role === "hr" && "bg-accent/10 text-accent",
        role === "admin" && "bg-warning/10 text-warning",
        role === "superadmin" && "bg-destructive/10 text-destructive",
        role === "intern" && "bg-cyan-500/10 text-cyan-600"
      )}
    >
      {role === "guard" ? "Security Professional" : role === "superadmin" ? "Super Admin" : role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}

function KYCStatusBadge({ status }: { status: string | undefined }) {
  if (!status) return <Badge variant="outline" className="text-muted-foreground border-muted">Not Started</Badge>;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium px-2.5 py-0.5 rounded-full capitalize shadow-sm",
        status === "approved" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
        status === "pending" && "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
        status === "rejected" && "border-red-200 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
        status === "not_started" && "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
      )}
    >
      {status === "not_started" ? "Not Started" : status.replace('_', ' ')}
    </Badge>
  );
}

export function UsersTable({
  users,
  onRefresh,
  currentUserRole,
  showRoleActions = false,
  promoteRoleTo,
  onViewDetails,
  onApprove,
  onReject,
  showKycStatus = false,
  showDirectActions = false,
  hideRole = false,
  hideDiscoveryData = false,
}: UsersTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<{
    type: "block" | "disable" | "activate" | "delete" | "promote" | "reject";
    user: UserProfile;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  function openDialog(
    type: "block" | "disable" | "activate" | "delete" | "promote" | "reject",
    user: UserProfile
  ) {
    setDialogAction({ type, user });
    setDialogOpen(true);
  }

  async function handleConfirm() {
    if (!dialogAction) return;
    setLoading(true);
    try {
      const { type, user } = dialogAction;
      switch (type) {
        case "block":
          await updateUserStatus(user.uid, "blocked");
          toast.success(`${user.fullName} has been blocked.`);
          break;
        case "disable":
          await updateUserStatus(user.uid, "disabled");
          toast.success(`${user.fullName} has been disabled.`);
          break;
        case "activate":
          await updateUserStatus(user.uid, "active");
          const actionWord = user.status === "pending_verification" ? "approved" : "activated";
          toast.success(`${user.fullName} has been ${actionWord}.`);
          break;
        case "delete":
          await deleteUser(user.uid);
          toast.success(`${user.fullName} has been deleted.`);
          break;
        case "promote":
          if (promoteRoleTo) {
            await updateUserRole(user.uid, promoteRoleTo, "system");
            const actionText = promoteRoleTo === "superadmin" ? "promoted" : "demoted";
            toast.success(`${user.fullName} has been ${actionText} to ${promoteRoleTo}.`);
          }
          break;
        case "reject":
          await updateUserStatus(user.uid, "blocked"); // For now, block rejected admins
          toast.success(`${user.fullName} has been rejected.`);
          break;
      }
      onRefresh();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setLoading(false);
      setDialogOpen(false);
      setDialogAction(null);
    }
  }

  function getDialogText() {
    if (!dialogAction) return { title: "", description: "" };
    const { type, user } = dialogAction;
    switch (type) {
      case "block":
        return {
          title: `Block ${user.fullName}?`,
          description: "This user will not be able to log in until unblocked.",
        };
      case "disable":
        return {
          title: `Disable ${user.fullName}?`,
          description: "This user's account will be disabled.",
        };
      case "activate":
        return {
          title: user.status === "pending_verification" ? `Approve ${user.fullName}?` : `Activate ${user.fullName}?`,
          description: user.status === "pending_verification"
            ? "This will grant the user full Admin access to the platform."
            : "This user will be able to log in again.",
        };
      case "delete":
        return {
          title: `Delete ${user.fullName}?`,
          description: "This action is permanent. All user data will be removed.",
        };
      case "promote":
        const actionTitle = promoteRoleTo === "superadmin" ? "Promote" : "Demote";
        return {
          title: `${actionTitle} ${user.fullName} to ${promoteRoleTo === 'superadmin' ? 'Super Admin' : 'Admin'}?`,
          description: "This will change the user's role and dashboard access.",
        };
      case "reject":
        return {
          title: `Reject Application for ${user.fullName}?`,
          description: "This user will be blocked from accessing the platform.",
        };
      default:
        return { title: "", description: "" };
    }
  }

  const canManage = currentUserRole === "admin" || currentUserRole === "superadmin";

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShieldOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No users found</h3>
        <p className="text-muted-foreground max-w-sm mt-1">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[250px]">
                <span className="ml-2">User</span>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              {!hideRole && <TableHead>Role</TableHead>}
              {hideRole && !hideDiscoveryData && (
                <>
                  <TableHead>Height</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Location</TableHead>
                </>
              )}
              {showKycStatus && <TableHead>KYC Status</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              {(canManage || !!onViewDetails) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid} className="group hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                      <AvatarImage src={user.role === 'hr' ? user.companyDetails?.logoUrl : user.photoUrl} alt={user.fullName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user.role === 'hr' ? <Building className="h-5 w-5" /> : user.fullName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{user.fullName}</span>
                      <span className="text-xs text-muted-foreground md:hidden">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono">{user.phone || "-"}</TableCell>
                {!hideRole && (
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                )}
                {hideRole && !hideDiscoveryData && (
                  <>
                    <TableCell className="text-sm font-medium">{user.height ? `${user.height} ft` : "-"}</TableCell>
                    <TableCell className="text-sm">{user.yearsOfExperience || "0"}y</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.preferredCity || "-"}</TableCell>
                  </>
                )}
                {showKycStatus && (
                  <TableCell>
                    <KYCStatusBadge status={user.kycStatus} />
                  </TableCell>
                )}
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                </TableCell>
                {(canManage || !!onViewDetails) && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {showDirectActions && (user.status === "pending_verification" || (showKycStatus && user.kycStatus === "pending")) && (
                        <div className="flex items-center gap-2 mr-2">
                          {onViewDetails && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onViewDetails(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => onApprove ? onApprove(user) : openDialog("activate", user)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => onReject ? onReject(user) : openDialog("reject", user)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onViewDetails && (
                            <DropdownMenuItem onClick={() => onViewDetails(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {user.status === "pending_verification" && (
                            <DropdownMenuItem onClick={() => openDialog("activate", user)} className="text-emerald-600 focus:text-emerald-600 font-medium">
                              <Shield className="mr-2 h-4 w-4" />
                              Approve Access
                            </DropdownMenuItem>
                          )}
                          {user.status === "disabled" && (
                            <DropdownMenuItem onClick={() => openDialog("activate", user)}>
                              <Shield className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {user.status === "active" && (
                            <DropdownMenuItem onClick={() => openDialog("disable", user)}>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Disable
                            </DropdownMenuItem>
                          )}
                          {user.status !== "blocked" && (
                            <DropdownMenuItem onClick={() => openDialog("block", user)}>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Block
                            </DropdownMenuItem>
                          )}
                          {showRoleActions && promoteRoleTo && user.role !== promoteRoleTo && (
                            <DropdownMenuItem onClick={() => openDialog("promote", user)}>
                              <UserCog className="mr-2 h-4 w-4" />
                              {promoteRoleTo === "superadmin" ? "Promote to Super Admin" : "Demote to Admin"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => openDialog("delete", user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getDialogText().title}</AlertDialogTitle>
            <AlertDialogDescription>{getDialogText().description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
