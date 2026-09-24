"use client";
 
import { useEffect, useState, useCallback } from "react";
import { UsersTable } from "@/components/users-table";
import { getAllUsers } from "@/lib/firestore";
import type { UserProfile } from "@/lib/types";
 
export default function SuperAdminAdminsPage() {
  const [pendingVerifications, setPendingVerifications] = useState<UserProfile[]>([]);
  const [verifiedAdmins, setVerifiedAdmins] = useState<UserProfile[]>([]);
  const [verifiedInterns, setVerifiedInterns] = useState<UserProfile[]>([]);
  const [superAdmins, setSuperAdmins] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
 
  const fetchUsers = useCallback(async () => {
    try {
      const allUsers = await getAllUsers();
      const adminUsers = allUsers.filter((u) => u.role === "admin");
      const superUsers = allUsers.filter((u) => u.role === "superadmin");
      const internUsers = allUsers.filter((u) => u.role === "intern");
 
      setPendingVerifications(allUsers.filter(u => (u.role === "admin" || u.role === "intern") && u.status === "pending_verification"));
      setVerifiedAdmins(adminUsers.filter(u => u.status !== "pending_verification"));
      setVerifiedInterns(internUsers.filter(u => u.status !== "pending_verification"));
      setSuperAdmins(superUsers);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
 
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading admin & intern management...</p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Platform Access Management</h2>
        <p className="text-muted-foreground">
          Review pending requests and manage the administrative and intern hierarchy.
        </p>
      </div>
 
      {pendingVerifications.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-blue-500 rounded-full" />
            <h3 className="text-lg font-bold text-foreground">Pending Verifications ({pendingVerifications.length})</h3>
          </div>
          <div className="rounded-2xl border-2 border-blue-500/20 bg-blue-500/[0.02] overflow-hidden">
            <UsersTable
              users={pendingVerifications}
              onRefresh={fetchUsers}
              currentUserRole="superadmin"
              showDirectActions
            />
          </div>
        </div>
      )}
 
      {superAdmins.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-purple-600 rounded-full" />
            <h3 className="text-lg font-bold text-foreground">Platform Superadmins ({superAdmins.length})</h3>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-purple-50/10 overflow-hidden">
            <UsersTable
              users={superAdmins}
              onRefresh={fetchUsers}
              currentUserRole="superadmin"
              showRoleActions
              promoteRoleTo="admin" // Option to demote to regular admin
            />
          </div>
        </div>
      )}
 
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-primary rounded-full" />
          <h3 className="text-lg font-bold text-foreground">Verified Administrators ({verifiedAdmins.length})</h3>
        </div>
        <UsersTable
          users={verifiedAdmins}
          onRefresh={fetchUsers}
          currentUserRole="superadmin"
          showRoleActions
          promoteRoleTo="superadmin"
        />
      </div>
 
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-cyan-500 rounded-full" />
          <h3 className="text-lg font-bold text-foreground">Verified Interns ({verifiedInterns.length})</h3>
        </div>
        <UsersTable
          users={verifiedInterns}
          onRefresh={fetchUsers}
          currentUserRole="superadmin"
          showRoleActions
          promoteRoleTo="admin"
        />
      </div>
    </div>
  );
}
