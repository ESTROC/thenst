import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAILS = Object.entries(process.env)
  .filter(([key]) => key.startsWith('SUPER_ADMIN_EMAIL_'))
  .map(([, value]) => value)
  .filter(Boolean) as string[];

const DEFAULT_SUPER_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DEFAULT_SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.some(
      (e) => e.toLowerCase() === email.toLowerCase()
    );
    const isDefaultPassword = password === DEFAULT_SUPER_ADMIN_PASSWORD;
    return NextResponse.json({ isSuperAdmin: isSuperAdmin && (password ? isDefaultPassword : true) });
  } catch {
    return NextResponse.json({ isSuperAdmin: false }, { status: 400 });
  }
}
