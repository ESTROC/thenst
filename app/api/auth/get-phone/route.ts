import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/get-phone
 * Body: { email: string }
 *
 * Returns the E.164 phone number stored on the Firestore user document for
 * the given email address. Used by the forgot-password OTP flow to know which
 * number to send the verification code to.
 *
 * Does NOT expose the full profile — only the phone field.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid email" },
        { status: 400 }
      );
    }

    const snapshot = await dbAdmin
      .collection("users")
      .where("email", "==", email.toLowerCase().trim())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ phone: null });
    }

    const data = snapshot.docs[0].data();
    const phone: string = data.phone || "";

    if (!phone) {
      return NextResponse.json({ phone: null });
    }

    return NextResponse.json({ phone });
  } catch (error) {
    console.error("get-phone API error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
