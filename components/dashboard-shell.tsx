"use client";

import React from "react"

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import {
  Shield,
  LayoutDashboard,
  FileText,
  Users,
  UserCog,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Search,
  IndianRupee,
  Building,
  User,
  Settings,
  Activity,
  MessageSquare,
  Clock,
  Briefcase,
  ClipboardList,
  ShieldAlert,
  CalendarCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, or } from "firebase/firestore";
import type { UserRole, ChatRoom } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "guard":
      return [
        { label: "Dashboard", href: "/dashboard/guard", icon: LayoutDashboard },
        { label: "Job Board", href: "/dashboard/guard/jobs", icon: Briefcase },
        { label: "KYC Form", href: "/dashboard/guard/kyc", icon: FileText },
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { label: "Profile", href: "/dashboard/profile", icon: User },
      ];
    case "hr":
      return [
        { label: "Security Professionals", href: "/dashboard/hr", icon: Search },
        { label: "Security Agencies", href: "/dashboard/hr/agencies", icon: Building },
        { label: "Job Board", href: "/dashboard/hr/jobs", icon: Briefcase },
        { label: "Interview Pipeline", href: "/dashboard/hr/pipeline", icon: Clock },
        { label: "Hired Professionals", href: "/dashboard/hr/hired", icon: UserCheck },
        { label: "Company Profile", href: "/dashboard/hr/kyc", icon: Building },
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { label: "Profile", href: "/dashboard/profile", icon: User },
      ];
    case "agency":
      return [
        { label: "Dashboard", href: "/dashboard/agency", icon: LayoutDashboard },
        { label: "Job Board", href: "/dashboard/agency/jobs", icon: Search },
        { label: "My Applications", href: "/dashboard/agency/applications", icon: ClipboardList },
        { label: "Hiring Requests", href: "/dashboard/agency/requests", icon: Briefcase },
        { label: "Agency Profile", href: "/dashboard/agency/kyc", icon: FileText },
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { label: "Profile", href: "/dashboard/profile", icon: User },
      ];
    case "admin":
      return [
        { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
        { label: "Job Postings", href: "/dashboard/admin/jobs", icon: Briefcase },
        { label: "HR Management", href: "/dashboard/admin/hr", icon: UserCog },
        { label: "Security Professionals", href: "/dashboard/admin/guards", icon: Users },
        { label: "Security Agencies", href: "/dashboard/admin/agencies", icon: Building },
        { label: "KYC Applications", href: "/dashboard/admin/applications", icon: FileText },

        { label: "Sales & Revenue", href: "/dashboard/admin/sales", icon: IndianRupee },
        { label: "Audit Logs", href: "/dashboard/admin/logs", icon: ShieldAlert },
        { label: "Profile", href: "/dashboard/profile", icon: User },
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      ];
    case "superadmin":
      return [
        { label: "Dashboard", href: "/dashboard/superadmin", icon: LayoutDashboard },
        { label: "Job Postings", href: "/dashboard/superadmin/jobs", icon: Briefcase },
        { label: "Admins", href: "/dashboard/superadmin/admins", icon: UserCheck },
        { label: "HR Management", href: "/dashboard/superadmin/hr", icon: UserCog },
        { label: "Security Professionals", href: "/dashboard/superadmin/guards", icon: Users },
        { label: "Security Agencies", href: "/dashboard/superadmin/agencies", icon: Building },
        { label: "KYC Applications", href: "/dashboard/superadmin/applications", icon: FileText },
        { label: "Sales & Revenue", href: "/dashboard/superadmin/sales", icon: IndianRupee },
        { label: "System Health", href: "/dashboard/superadmin/health", icon: Activity },
        { label: "System Settings", href: "/dashboard/superadmin/settings", icon: Settings },
        { label: "Audit Logs", href: "/dashboard/superadmin/logs", icon: ShieldAlert },
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { label: "Profile", href: "/dashboard/profile", icon: User },
      ];
    case "intern":
      return [
        { label: "Dashboard", href: "/dashboard/intern", icon: LayoutDashboard },
        { label: "Job Board", href: "/dashboard/intern/jobs", icon: Briefcase },
        { label: "Interview Pipeline", href: "/dashboard/intern/pipeline", icon: CalendarCheck },
        { label: "Security Professionals", href: "/dashboard/intern/guards", icon: Users },
        { label: "Security Agencies", href: "/dashboard/intern/agencies", icon: Building },
        { label: "Hiring History", href: "/dashboard/intern/history", icon: UserCheck },
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { label: "Profile", href: "/dashboard/profile", icon: User },
      ];
    default:
      return [];
  }
}

function getRoleLabel(role: UserRole) {
  switch (role) {
    case "guard":
      return "Security Professional";
    case "hr":
      return "HR Manager";
    case "admin":
      return "Admin";
    case "superadmin":
      return "Super Admin";
    case "agency":
      return "Security Agency";
    case "intern":
      return "Intern";
  }
}

function getRoleBadgeColor(role: UserRole) {
  switch (role) {
    case "guard":
      return "bg-emerald-500/10 text-emerald-600";
    case "hr":
      return "bg-blue-500/10 text-blue-600";
    case "admin":
      return "bg-indigo-500/10 text-indigo-600";
    case "superadmin":
      return "bg-red-500/10 text-red-600";
    case "agency":
      return "bg-amber-500/10 text-amber-600";
    case "intern":
      return "bg-cyan-500/10 text-cyan-600";
  }
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    // 1. Listen for Unread Messages (HR, Guard, Agency, Admin, SuperAdmin)
    if (profile.role) {
      const roomsRef = collection(db, "chat_rooms");
      let unsubscribeMessages1 = () => {};
      let unsubscribeMessages2 = () => {};

      const handleRoomsSnapshot = (roomsList: ChatRoom[][]) => {
         const allRooms = roomsList.flat();
         const uniqueRoomsMap = new Map();
         allRooms.forEach(r => uniqueRoomsMap.set(r.id, r));
         const rooms = Array.from(uniqueRoomsMap.values());
         
         const total = rooms.reduce((sum, room) => {
           const count = (profile.role === "hr" || profile.role === "admin" || profile.role === "superadmin")
             ? (room.hrUnreadCount || 0) 
             : profile.role === "agency"
               ? ((room.agencyUnreadCount || 0) + (room.guardUnreadCount || 0))
               : (room.guardUnreadCount || 0);
           return sum + count;
         }, 0);
         setTotalUnread(total);
      };

      if (profile.role === "agency") {
         let rooms1: ChatRoom[] = [];
         let rooms2: ChatRoom[] = [];
         
         const q1 = query(roomsRef, where("agencyId", "==", profile.uid));
         const q2 = query(roomsRef, where("guardId", "==", profile.uid));

         unsubscribeMessages1 = onSnapshot(q1, (snapshot) => {
            rooms1 = snapshot.docs.map(doc => doc.data() as ChatRoom);
            handleRoomsSnapshot([rooms1, rooms2]);
         }, (error) => {
            if (error.code !== "permission-denied") console.error("Messages listener error:", error);
         });
         
         unsubscribeMessages2 = onSnapshot(q2, (snapshot) => {
            rooms2 = snapshot.docs.map(doc => doc.data() as ChatRoom);
            handleRoomsSnapshot([rooms1, rooms2]);
         }, (error) => {
            if (error.code !== "permission-denied") console.error("Messages listener error:", error);
         });
      } else {
         const q = (profile.role === "hr" || profile.role === "admin" || profile.role === "superadmin")
           ? query(roomsRef, where("hrId", "==", profile.uid)) 
           : query(roomsRef, where("guardId", "==", profile.uid));
           
         unsubscribeMessages1 = onSnapshot(q, (snapshot) => {
            handleRoomsSnapshot([snapshot.docs.map(doc => doc.data() as ChatRoom)]);
         }, (error) => {
            if (error.code !== "permission-denied") console.error("Messages listener error:", error);
         });
      }

      // 2. Listen for Pending Job Applications (HR Only)
      let unsubscribeApps = () => {};
      if (profile.role === "hr") {
        const appsRef = collection(db, "job_applications");
        const qApps = query(
          appsRef, 
          where("hrId", "==", profile.uid),
          where("status", "==", "pending")
        );
        unsubscribeApps = onSnapshot(qApps, (snapshot) => {
          setPendingApplicationsCount(snapshot.size);
        }, (error) => {
          if (error.code !== "permission-denied") {
            console.error("Job apps listener error:", error);
          }
        });
      }

      return () => {
        unsubscribeMessages1();
        unsubscribeMessages2();
        unsubscribeApps();
      };
    }
  }, [profile]);

  if (!profile) return null;

  const navItems = getNavItems(profile.role);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fbff] text-foreground font-sans selection:bg-primary/20">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-white transition-transform duration-300 lg:translate-x-0 border-r border-white/5 shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wider text-white">TheNST</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 mb-4">
          <p className="truncate text-sm font-bold text-white">
            {profile.fullName}
          </p>
          <p className="truncate text-[11px] text-white/50 font-medium mb-3">{profile.email}</p>
          <span
            className={cn(
              "inline-block rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/90 border border-white/10"
            )}
          >
            {getRoleLabel(profile.role)}
          </span>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-none px-6 py-4 text-[13px] font-medium transition-all duration-300 relative",
                    isActive
                      ? "bg-[#161d3f] text-blue-400 border-l-[4px] border-blue-500"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-blue-500" : "text-white/40 group-hover:text-white")} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.label === "Messages" && totalUnread > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] flex items-center justify-center px-1.5 text-[10px] bg-red-500 rounded-full shadow-lg border-0">
                      {totalUnread}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64 relative bg-[#f8fbff]">

        {/* Top Bar - Solid White as per screenshot */}
        <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-foreground lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-black text-[#010b26] tracking-tight">
              {pathname === "/dashboard/hr" ? "Security Professionals" : (navItems.find((i) => i.href === pathname)?.label || "Dashboard")}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <Badge variant="outline" className="hidden md:inline-flex px-4 py-1.5 bg-[#eff4ff] border-transparent text-[#4f46e5] font-black uppercase text-[10px] tracking-widest rounded-full">
              {getRoleLabel(profile.role)}
            </Badge>
            <NotificationBell userId={profile.uid} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-[#64748b] hover:text-[#010b26] transition-colors gap-2 font-bold text-sm px-2 sm:px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 lg:px-6 lg:pt-6 pb-8 relative z-10">{children}</main>
      </div>
    </div>
  );
}
