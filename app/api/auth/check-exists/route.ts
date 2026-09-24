import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, phone } = await req.json();

    if (email) {
      const emailQuery = await dbAdmin
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();
      
      if (!emailQuery.empty) {
        return NextResponse.json({ exists: true, type: "email" });
      }
    }

    if (phone) {
      const phoneQuery = await dbAdmin
        .collection("users")
        .where("phone", "==", phone)
        .limit(1)
        .get();

      if (!phoneQuery.empty) {
        return NextResponse.json({ 
          exists: true, 
          type: "phone", 
          email: phoneQuery.docs[0].data().email 
        });
      }
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("Auth check API error:", error);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
