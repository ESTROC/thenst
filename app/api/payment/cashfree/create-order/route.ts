import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// ---------- CONFIGURATION ----------
const APP_ID = process.env.CASHFREE_APP_ID || process.env.NEXT_PUBLIC_CASHFREE_APP_ID || "";
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY || process.env.NEXT_PUBLIC_CASHFREE_SECRET_KEY || "";

const CASHFREE_API_URL = "https://api.cashfree.com/pg/orders";
// Use your production domain – HTTPS is mandatory
const RETURN_URL = "https://thenst.co/payment-status?order_id={order_id}";

export async function POST(request: Request) {
    console.log("========== Cashfree Create Order ==========");
    console.log("APP_ID (first 6):", APP_ID ? APP_ID.slice(0, 6) + "..." : "EMPTY");

    // Validate credentials
    if (!APP_ID || !SECRET_KEY) {
        console.error("❌ Missing Cashfree credentials");
        return NextResponse.json(
            { error: "Payment service not configured. Please contact support." },
            { status: 500 }
        );
    }

    try {
        let body: any;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const { amount, userId, userName, packId, credits, userEmail, userPhone, userRole } = body || {};
        if (!amount || !userId) {
            return NextResponse.json(
                { error: "Missing required fields: amount, userId" },
                { status: 400 }
            );
        }

        const orderId = `order_${Date.now()}_${userId}`;
        const orderAmount = parseFloat(Number(amount).toFixed(2));

        const cfPayload = {
            order_id: orderId,
            order_amount: orderAmount,
            order_currency: "INR",
            customer_details: {
                customer_id: userId,
                customer_name: userName || "Member",
                customer_email: userEmail || "no-reply@example.com",
                customer_phone: userPhone || "9999999999",
            },
            order_meta: {
                // return_url: RETURN_URL,   // ✅ now HTTPS
            },
            order_note: `${packId || "Credits"} - ${credits || 0} credits`,
        };

        console.log("Sending to Cashfree:", JSON.stringify(cfPayload, null, 2));

        const response = await fetch(CASHFREE_API_URL, {
            method: "POST",
            headers: {
                "x-client-id": APP_ID.trim(),
                "x-client-secret": SECRET_KEY.trim(),
                "x-api-version": "2022-09-01",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(cfPayload),
        });

        const data = await response.json().catch(() => null);
        console.log("Cashfree response status:", response.status);

        if (!response.ok) {
            const errorMsg = data?.message || data?.error || `Cashfree HTTP ${response.status}`;
            console.error("❌ Cashfree API error:", errorMsg);
            return NextResponse.json(
                { error: errorMsg, details: data },
                { status: response.status >= 500 ? 502 : response.status }
            );
        }

        if (data?.payment_session_id) {
            console.log("✅ Payment session created:", data.payment_session_id);
            
            // Log the pending transaction in Firestore
            try {
                const txRef = dbAdmin.collection("transactions").doc();
                await txRef.set({
                    id: txRef.id,
                    userId,
                    userName: userName || "Unknown User",
                    userRole: userRole || "unknown",
                    amount: orderAmount,
                    planName: packId || "Custom Plan",
                    type: credits > 0 ? "credits" : "subscription",
                    creditsAdded: credits || 0,
                    paymentId: data.order_id,
                    paymentMethod: "cashfree",
                    status: "pending",
                    timestamp: new Date().toISOString()
                });
            } catch (dbErr) {
                console.error("Failed to log pending transaction in Firestore:", dbErr);
            }

            return NextResponse.json({
                paymentSessionId: data.payment_session_id,
                orderId: data.order_id,
            });
        }

        console.error("❌ No payment_session_id in Cashfree response");
        return NextResponse.json(
            { error: "No payment session returned from Cashfree" },
            { status: 502 }
        );
    } catch (error: any) {
        console.error("❌ Server error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}