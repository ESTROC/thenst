"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, or } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, MessageSquare } from "lucide-react";
import { sendMessage, markChatAsRead } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import type { ChatRoom, Message, HiringRequest } from "@/lib/types";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
function MessagesContent() {
    const { profile } = useAuth();
    const searchParams = useSearchParams();
    const targetChat = searchParams.get('chat'); // Target guardId or roomId
    const targetReq = searchParams.get('req'); // Specific request ID if available

    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [activeRequest, setActiveRequest] = useState<HiringRequest | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscribe to chat rooms
    useEffect(() => {
        if (!profile) return;

        const roomsRef = collection(db, "chat_rooms");
        let unsubscribe1 = () => {};
        let unsubscribe2 = () => {};

        const handleRoomsSnapshot = (roomsList: ChatRoom[][]) => {
            const allRooms = roomsList.flat();
            // remove duplicates
            const uniqueRoomsMap = new Map();
            allRooms.forEach(r => uniqueRoomsMap.set(r.id, r));
            const rooms = Array.from(uniqueRoomsMap.values());
            
            // Sort by updatedAt descending for latest first
            rooms.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            setChatRooms(rooms);

            // Auto-select chat room if targetChat is specified in URL
            if (targetChat && !activeRoom && rooms.length > 0) {
                const targetRoom = rooms.find(r => r.guardId === targetChat || r.id === targetChat);
                if (targetRoom) {
                    setActiveRoom(targetRoom);
                }
            }
        };

        if (profile.role === "agency") {
            let rooms1: ChatRoom[] = [];
            let rooms2: ChatRoom[] = [];
            
            const q1 = query(roomsRef, where("agencyId", "==", profile.uid));
            const q2 = query(roomsRef, where("guardId", "==", profile.uid));

            unsubscribe1 = onSnapshot(q1, (snapshot) => {
                rooms1 = snapshot.docs.map(doc => doc.data() as ChatRoom);
                handleRoomsSnapshot([rooms1, rooms2]);
            }, (error) => {
                if (error.code !== "permission-denied") console.error(error);
            });
            
            unsubscribe2 = onSnapshot(q2, (snapshot) => {
                rooms2 = snapshot.docs.map(doc => doc.data() as ChatRoom);
                handleRoomsSnapshot([rooms1, rooms2]);
            }, (error) => {
                if (error.code !== "permission-denied") console.error(error);
            });
        } else {
            const q = profile.role === "hr" || profile.role === "intern" || profile.role === "superadmin" || profile.role === "admin"
                ? query(roomsRef, where("hrId", "==", profile.uid))
                : query(roomsRef, where("guardId", "==", profile.uid));
                
            unsubscribe1 = onSnapshot(q, (snapshot) => {
                handleRoomsSnapshot([snapshot.docs.map(doc => doc.data() as ChatRoom)]);
            }, (error) => {
                if (error.code !== "permission-denied") console.error(error);
            });
        }

        return () => {
            unsubscribe1();
            unsubscribe2();
        };
    }, [profile, targetChat]);

    // Subscribe to messages in active room
    useEffect(() => {
        if (!activeRoom) return;

        const messagesRef = collection(db, "chat_rooms", activeRoom.id, "messages");
        // Sort by timestamp asc for chat flow
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => doc.data() as Message);
            setMessages(msgs);

            // Mark as read if this room is active
            if (profile && activeRoom) {
                // If admin/superadmin is viewing the chat, only mark as read if they initiated it (are the hrId)
                if (profile.role === "admin" || profile.role === "superadmin") {
                    if (activeRoom.hrId === profile.uid) {
                        markChatAsRead(activeRoom.id, profile.role);
                    }
                } else {
                    markChatAsRead(activeRoom.id, profile.role);
                }
            }
        }, (error) => {
            if (error.code !== "permission-denied") {
                console.error("Messages listener error:", error);
            }
        });

        return () => unsubscribe();
    }, [activeRoom]);

    // Fetch latest request status when room changes
    useEffect(() => {
        if (!activeRoom) {
            setActiveRequest(null);
            return;
        }

        async function fetchRequest() {
            try {
                // If the user is viewing the specific chat room they navigated to, and there is a targetReq, use it.
                // Otherwise, fallback to the chat room's latest requestId.
                const isTargetRoom = activeRoom.id === targetChat || activeRoom.guardId === targetChat;
                const reqIdToFetch = (isTargetRoom && targetReq) ? targetReq : activeRoom.requestId;
                
                const docRef = doc(db, "hiring_requests", reqIdToFetch);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setActiveRequest({ id: snap.id, ...snap.data() } as HiringRequest);
                }
            } catch (err) {
                console.error("Error fetching request:", err);
            }
        }
        fetchRequest();
    }, [activeRoom, targetReq, targetChat]);


    // Auto-scroll
    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [messages]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() || !activeRoom || !profile) return;

        const msgText = newMessage.trim();
        setNewMessage(""); // optimistic clear

        try {
            await sendMessage(activeRoom.id, {
                senderId: profile.uid,
                text: msgText,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error("Failed to send message", err);
        }
    }

    if (!profile) return null;

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-4 pt-4 px-4 overflow-hidden">
            {/* Left Pane - Rooms */}
            <Card className="w-1/3 flex flex-col h-full border-muted bg-card">
                <CardHeader className="py-4 border-b">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" /> In-App Messages
                    </CardTitle>
                    <CardDescription>Select a chat to view messages</CardDescription>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-2">
                        {chatRooms.length === 0 ? (
                            <p className="p-4 text-center text-muted-foreground text-sm">No active chats yet. Chats appear when hiring requests are accepted.</p>
                        ) : (
                            chatRooms.map(room => {
                                const isSelected = activeRoom?.id === room.id;
                                const otherPartyName = profile.role === "guard" || profile.role === "agency" ? room.hrName : room.guardName;

                                return (
                                    <button
                                        key={room.id}
                                        type="button"
                                        onClick={() => setActiveRoom(room)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 border",
                                            isSelected ? "bg-primary/10 border-primary/20" : "hover:bg-muted bg-background border-transparent"
                                        )}
                                    >
                                        <div className="h-10 w-10 rounded-full bg-muted-foreground/10 flex items-center justify-center shrink-0">
                                            <User className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="overflow-hidden flex-1">
                                            <div className="flex justify-between items-center gap-2">
                                                <p className="font-semibold text-sm truncate">{otherPartyName}</p>
                                                {profile.role === "guard" && room.guardUnreadCount ? (
                                                    <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px]">
                                                        {room.guardUnreadCount}
                                                    </Badge>
                                                ) : profile.role === "hr" && room.hrUnreadCount ? (
                                                    <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px]">
                                                        {room.hrUnreadCount}
                                                    </Badge>
                                                ) : profile.role === "agency" && ((room.agencyUnreadCount || 0) + (room.guardUnreadCount || 0)) > 0 ? (
                                                    <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px]">
                                                        {(room.agencyUnreadCount || 0) + (room.guardUnreadCount || 0)}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{room.lastMessage || "New Chat Room created"}</p>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* Right Pane - Chat */}
            <Card className="w-2/3 flex flex-col h-full border-muted bg-card">
                {activeRoom ? (
                    <>
                        <CardHeader className="py-4 border-b bg-muted/30">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span>
                                    {profile.role === "guard" || profile.role === "agency" 
                                        ? (activeRoom.companyName || activeRoom.hrName) 
                                        : activeRoom.guardName}
                                </span>

                                {activeRequest?.status === "hired" && (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1 py-1">
                                        <CheckCircle2 className="h-3 w-3" /> Deal Done
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {profile.role === "guard" || profile.role === "agency" 
                                    ? (() => {
                                        const roleStr = activeRoom.hrRole === "superadmin" ? "System SuperAdmin" 
                                                      : activeRoom.hrRole === "admin" ? "System Admin"
                                                      : activeRoom.hrRole === "hr" ? "HR Representative"
                                                      : activeRoom.hrName.includes("SuperAdmin") ? "System SuperAdmin" 
                                                      : activeRoom.hrName.includes("Admin") ? "System Admin" 
                                                      : "HR Representative";
                                        return activeRoom.companyName ? `${activeRoom.hrName} • ${roleStr}` : roleStr;
                                      })()
                                    : (activeRoom.guardId === "BULK" || activeRoom.guardId === activeRoom.agencyId ? "Security Agency" : "Security Professional")}
                            </CardDescription>
                        </CardHeader>
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4 flex flex-col">
                                {messages.length === 0 && (
                                    <div className="h-full flex items-center justify-center py-10">
                                        <p className="text-muted-foreground text-sm">Say hello! Direct messaging is now unlocked.</p>
                                    </div>
                                )}
                                {messages.map((msg) => {
                                    const isMe = msg.senderId === profile.uid;
                                    return (
                                        <div key={msg.id} className={cn("flex max-w-[75%] flex-col", isMe ? "self-end items-end" : "self-start items-start")}>
                                            <div className={cn(
                                                "px-4 py-2 rounded-2xl",
                                                isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                                            )}>
                                                <p className="text-sm">{msg.text}</p>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t bg-background">
                            <form onSubmit={handleSend} className="flex gap-2 relative">
                                <Input
                                    placeholder="Type your message..."
                                    className="pr-12 rounded-full"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-1 top-1 bottom-1 h-8 w-8 rounded-full"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                        <p>Select a chat room to start messaging</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center p-4">Loading messages...</div>}>
            <MessagesContent />
        </Suspense>
    );
}
