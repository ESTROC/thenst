import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { requestId, newStatus, agencyId } = await req.json();

        if (!requestId || !newStatus || !agencyId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const requestRef = dbAdmin.collection("hiring_requests").doc(requestId);
        const requestSnap = await requestRef.get();

        if (!requestSnap.exists) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const requestData = requestSnap.data()!;

        // Security check: ensure the agency updating the request is the actual agency assigned
        if (requestData.agencyId !== agencyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const batch = dbAdmin.batch();

        // 1. Update the request status
        batch.update(requestRef, { 
            status: newStatus,
            updatedAt: new Date().toISOString()
        });

        // 2. Escrow logic for rejection
        if (newStatus === "rejected" && requestData.escrowAmount) {
            const hrRef = dbAdmin.collection("users").doc(requestData.hrId);
            const hrSnap = await hrRef.get();
            
            if (hrSnap.exists) {
                const hrData = hrSnap.data()!;
                const currentPending = hrData.pendingCredits || 0;
                const currentCredits = hrData.credits || 0;
                
                batch.update(hrRef, {
                    pendingCredits: Math.max(0, currentPending - requestData.escrowAmount),
                    credits: currentCredits + requestData.escrowAmount
                });
            }
        }

        await batch.commit();

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("API Error updating request status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
