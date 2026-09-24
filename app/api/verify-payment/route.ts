import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

async function generateAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("PayPal credentials not found.");
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    const data = await response.json();
    return data.access_token;
}

export async function POST(req: Request) {
    try {
        const { orderID, hrId, hrName, packName, credits, amount } = await req.json();

        if (!orderID || !hrId || !credits) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        // 1. Verify the order with PayPal
        const accessToken = await generateAccessToken();
        const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        const orderData = await response.json();

        if (orderData.status !== "COMPLETED") {
            return NextResponse.json({ error: "Transaction not completed in PayPal" }, { status: 400 });
        }

        // 2. Check if this transaction has already been processed to prevent double-crediting
        const existingTx = await dbAdmin.collection("transactions").where("paymentId", "==", orderID).get();
        if (!existingTx.empty) {
            return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
        }

        // 3. Process the transaction securely using Firebase Admin
        const batch = dbAdmin.batch();

        // Create transaction record
        const txRef = dbAdmin.collection("transactions").doc();
        batch.set(txRef, {
            id: txRef.id,
            userId: hrId,
            userName: hrName,
            userRole: "hr",
            amount,
            planName: packName,
            type: "credits",
            creditsAdded: credits,
            paymentId: orderID,
            paymentMethod: "paypal",
            status: "completed",
            timestamp: new Date().toISOString(),
            // Legacy support
            hrId,
            hrName,
            packName,
        });

        // Increment HR credits
        const userRef = dbAdmin.collection("users").doc(hrId);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
            const currentCredits = userSnap.data()?.credits || 0;
            batch.update(userRef, {
                credits: currentCredits + credits,
                updatedAt: new Date().toISOString(),
            });
        }

        // Create In-App Notification for successfully purchasing credits
        const notifRef = dbAdmin.collection("users").doc(hrId).collection("notifications").doc();
        batch.set(notifRef, {
            id: notifRef.id,
            title: "Credits Purchased Successfully",
            message: `Your account has been credited with ${credits} credits after successful payment of ₹${amount}.`,
            type: "success",
            isRead: false,
            createdAt: new Date().toISOString()
        });

        // Commit all changes atomically
        await batch.commit();

        return NextResponse.json({ success: true, message: "Payment verified and credits added." });

    } catch (error: any) {
        console.error("Payment verification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
