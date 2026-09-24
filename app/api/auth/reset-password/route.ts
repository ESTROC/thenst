import { NextResponse } from "next/server";
import { admin, dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/reset-password
 * Body: { email: string; newPassword: string }
 *
 * Server-side password reset using the Firebase Admin SDK.
 * This endpoint is called ONLY after the client has successfully verified
 * the phone OTP (confirmed via Firebase Phone Auth on the client side).
 *
 * The Admin SDK can update a password without requiring the old one, which
 * is exactly what we need for an OTP-gated forgot-password flow.
 *
 * Security notes:
 * – Requires the account to exist in Firestore (double-check).
 * – Validates minimum password length server-side.
 * – Does NOT store or log the new password.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing email" },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing new password" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Verify the account exists in Firestore before touching Firebase Auth
    const snapshot = await dbAdmin
      .collection("users")
      .where("email", "==", email.toLowerCase().trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: "No account found with this email." },
        { status: 404 }
      );
    }

    // Resolve the Firebase Auth UID via the Admin SDK
    const authUser = await admin.auth().getUserByEmail(email.toLowerCase().trim());

    // Update the password using the Admin SDK (no old password required)
    await admin.auth().updateUser(authUser.uid, { password: newPassword });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("reset-password API error:", error);

    if (error?.code === "auth/user-not-found") {
      return NextResponse.json(
        { success: false, error: "No account found with this email." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Password reset failed." },
      { status: 500 }
    );
  }
}
