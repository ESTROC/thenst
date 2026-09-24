import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type EmailTemplate = "welcome" | "approval" | "rejection" | "hired" | "acceptance" | "hiring_rejection" | "hiring_success" | "application_received" | "application_accepted";

interface SendEmailParams {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: {
    fullName: string;
    role?: string;
    companyName?: string;
    hrName?: string;
    hrEmail?: string;
    message?: string;
    reason?: string;
    [key: string]: any;
  };
}

/**
 * Centrally managed email utility.
 * Sends data to the secure backend endpoint `/api/send-email` which handles
 * the actual integration with the Brevo API.
 */
export async function sendEmail(params: SendEmailParams) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok) {
      console.warn("Email delivery note (API):", result.error || "Email not dispatched");
      return false;
    }

    console.log(`Email '${params.subject}' successfully sent to ${params.to}`);
    
    // Audit Log: Email Sent
    const { logActivity } = await import("./firestore");
    await logActivity({
      userId: "system",
      email: params.to,
      action: "Email Sent",
      role: "system",
      details: { subject: params.subject, template: params.template }
    });

    return true;
  } catch (error) {
    console.warn("Email delivery note (network):", error);
    return false;
  }
}
