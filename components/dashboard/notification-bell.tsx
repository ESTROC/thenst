"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import type { Notification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
    userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (!userId) return;

        const q = query(
            collection(db, "users", userId, "notifications"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs: Notification[] = [];
            let unread = 0;
            snapshot.forEach((doc) => {
                const data = doc.data() as Notification;
                notifs.push({ ...data, id: doc.id });
                if (!data.isRead) unread++;
            });
            setNotifications(notifs);
            setUnreadCount(unread);
        }, (error) => {
            if (error.code !== "permission-denied") {
                console.error("Notifications listener error:", error);
            }
        });

        return () => unsubscribe();
    }, [userId]);

    const markAsRead = async (notificationId: string) => {
        if (!userId) return;
        try {
            await updateDoc(doc(db, "users", userId, "notifications", notificationId), {
                isRead: true,
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!userId || unreadCount === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.isRead).forEach(n => {
                if (n.id) {
                    const ref = doc(db, "users", userId, "notifications", n.id);
                    batch.update(ref, { isRead: true });
                }
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        if (!userId) return;
        try {
            await deleteDoc(doc(db, "users", userId, "notifications", notificationId));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead && notification.id) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => { if (open && unreadCount > 0) markAllAsRead(); }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex justify-center items-center p-0 rounded-full text-[10px] animate-in zoom-in"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-[85vh] overflow-hidden flex flex-col">
                <DropdownMenuLabel className="flex items-center justify-between p-4">
                    <span className="font-semibold text-lg">Notifications</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                            <Check className="mr-2 h-3.5 w-3.5" />
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />

                <div className="overflow-y-auto flex-1 p-0">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <Bell className="h-6 w-6 text-primary/40" />
                            </div>
                            <p className="text-sm font-medium">No notifications yet</p>
                            <p className="text-xs text-muted-foreground mt-1">We'll let you know when something important happens.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-accent focus:text-accent-foreground border-b border-border/50 rounded-none last:border-0",
                                        !notification.isRead && "bg-primary/[0.03]"
                                    )}
                                >
                                    <div className="flex items-start justify-between w-full gap-2">
                                        <div className="flex items-center gap-2">
                                            {!notification.isRead && (
                                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                            )}
                                            <span className={cn(
                                                "font-semibold text-sm",
                                                notification.type === "success" && "text-emerald-600 dark:text-emerald-400",
                                                notification.type === "warning" && "text-amber-600 dark:text-amber-400",
                                                notification.type === "info" && "text-blue-600 dark:text-blue-400"
                                            )}>
                                                {notification.title}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => deleteNotification(e, notification.id!)}
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive -mr-2 -mt-1"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <p className="text-sm text-foreground/80 line-clamp-2 mt-0.5 ml-4">
                                        {notification.message}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground mt-1 ml-4">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
