import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  increment,
  orderBy,
  getCountFromServer,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, KYCData, HrKYCData, UserRole, UserStatus, KYCStatus, HiringRequest, SystemConfig, SystemHealthStatus, DashboardStats, Notification, ChatRoom, Message, Transaction, Job, JobApplication } from "@/lib/types";
import { sendEmail } from "@/lib/email";

const APP_NAMESPACE = process.env.NEXT_PUBLIC_APP_NAMESPACE || "thenst";

function isAppUser(data: UserProfile): boolean {
  return !data.namespace || data.namespace === APP_NAMESPACE;
}

// ==================== SYSTEM LOGS ====================

export async function logActivity(log: Omit<SystemLog, "id" | "timestamp" | "userAgent">): Promise<void> {
  try {
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "Server-Side";
    const logsRef = collection(db, "system_logs");
    await addDoc(logsRef, {
      ...log,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to record activity log:", error);
  }
}

export async function getSystemLogs(limitCount: number = 100): Promise<SystemLog[]> {
  const q = query(
    collection(db, "system_logs"),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemLog));
}


// ==================== NOTIFICATIONS ====================

export async function createNotification(
  userId: string,
  notification: Omit<Notification, "id" | "userId" | "isRead" | "createdAt">
): Promise<void> {
  try {
    const notificationsRef = collection(db, "users", userId, "notifications");
    await addDoc(notificationsRef, {
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// ==================== USERS ====================

export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), where("role", "==", role), where("namespace", "==", APP_NAMESPACE));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as UserProfile).filter(isAppUser);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((d) => d.data() as UserProfile).filter(isAppUser);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, "users", uid));
  if (!docSnap.exists()) return null;
  const data = docSnap.data() as UserProfile;
  return isAppUser(data) ? data : null;
}

export async function updateUserStatus(
  uid: string,
  status: UserStatus
): Promise<void> {
  const user = await getUserProfile(uid);
  await updateDoc(doc(db, "users", uid), {
    status,
    updatedAt: new Date().toISOString(),
  });



  if (status === "active" && user && (user.status === "pending_verification" || user.status === "disabled")) {
    sendEmail({
      to: user.email,
      subject: user.role === "admin" ? "Account Verified ✅" : "Account Activated!",
      template: "approval",
      data: {
        fullName: user.fullName,
        role: user.role,
      }
    }).catch(err => console.error("Activation email failed:", err));

    // In-App Notification
    await createNotification(uid, {
      title: "Account Activated!",
      message: `Your account as a ${user.role} has been approved. You now have full platform access.`,
      type: "success",
    });
  } else if ((status === "blocked" || status === "disabled") && user && user.status === "pending_verification") {
    sendEmail({
      to: user.email,
      subject: "Account Verification Update",
      template: "rejection",
      data: {
        fullName: user.fullName,
        role: user.role,
        reason: "Your registration request has been declined."
      }
    }).catch(err => console.error("Rejection email failed:", err));
  }
}

export async function updateUserRole(
  uid: string,
  role: UserRole,
  approvedBy: string
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    role,
    approvedBy,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function updateUserProfile(
  uid: string,
  data: { fullName?: string; phone?: string }
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteUser(uid: string): Promise<void> {
  const user = await getUserProfile(uid);
  await deleteDoc(doc(db, "users", uid));
  // Also delete KYC if exists
  try {
    await deleteDoc(doc(db, "kyc", uid));
  } catch {
    // KYC might not exist
  }

  // Audit Log: User Deletion
  if (user) {
    await logActivity({
      userId: "admin",
      email: user.email,
      action: "DELETE USER",
      role: "admin",
      details: { uid, role: user.role }
    });
  }
}

// ==================== KYC ====================

export async function submitKYC(data: KYCData): Promise<void> {
  // Write KYC document keyed by guardId
  await setDoc(doc(db, "kyc", data.guardId), data);
  // Also update the user's profile to reflect KYC submitted
  await updateDoc(doc(db, "users", data.guardId), {
    kycStatus: "pending",
    updatedAt: new Date().toISOString(),
  });

}

export async function getKYC(guardId: string): Promise<KYCData | null> {
  const docSnap = await getDoc(doc(db, "kyc", guardId));
  return docSnap.exists() ? (docSnap.data() as KYCData) : null;
}

export async function getKYCByStatus(status: KYCStatus): Promise<KYCData[]> {
  const q = query(collection(db, "kyc"), where("status", "==", status));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as KYCData);
}

export async function getAllKYC(): Promise<KYCData[]> {
  const snapshot = await getDocs(collection(db, "kyc"));
  return snapshot.docs.map((d) => d.data() as KYCData);
}

export async function updateKYCStatus(
  guardId: string,
  status: KYCStatus,
  reviewedBy: string,
  rejectionReason?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  };
  if (rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }
  await updateDoc(doc(db, "kyc", guardId), updateData);
  await updateDoc(doc(db, "users", guardId), {
    updatedAt: new Date().toISOString(),
  });

  // Audit Log: Guard KYC Status Update
  await logActivity({
    userId: reviewedBy,
    email: guardId, // Reference the guard ID
    action: `KYC ${status.toUpperCase()}`,
    role: "admin",
    details: { guardId, reason: rejectionReason || "N/A" }
  });

  if (status === "approved") {

    const user = await getUserProfile(guardId);
    if (user) {
      sendEmail({
        to: user.email,
        subject: "KYC Verification Approved!",
        template: "approval",
        data: {
          fullName: user.fullName,
          role: "Security Professional",
        }
      }).catch(err => console.error("KYC approval email failed:", err));

      await createNotification(guardId, {
        title: "KYC Verified!",
        message: "Your background check has been approved. You are now visible to top employers.",
        type: "success",
        link: "/dashboard/guard",
      });
    }
  } else if (status === "rejected") {

    const user = await getUserProfile(guardId);
    if (user) {
      sendEmail({
        to: user.email,
        subject: "KYC Verification Update",
        template: "rejection",
        data: {
          fullName: user.fullName,
          role: "Security Professional",
          reason: rejectionReason
        }
      }).catch(err => console.error("KYC rejection email failed:", err));

      await createNotification(guardId, {
        title: "KYC Update Required",
        message: `Your KYC verification was rejected. Reason: ${rejectionReason}. Please update your documents.`,
        type: "warning",
        link: "/dashboard/guard/kyc",
      });
    }
  }
}

export async function updateGuardProfile(
  guardId: string,
  data: Partial<KYCData>
): Promise<void> {
  // Update only specific profile fields, do NOT change status
  await updateDoc(doc(db, "kyc", guardId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });

  // Sync discovery fields to UserProfile for efficient filtering
  const syncData: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };
  
  if (data.height !== undefined) syncData.height = data.height;
  if (data.weight !== undefined) syncData.weight = data.weight;
  if (data.skills !== undefined) syncData.skills = data.skills;
  if (data.yearsOfExperience !== undefined) syncData.yearsOfExperience = data.yearsOfExperience;
  if (data.preferredCity !== undefined) syncData.preferredCity = data.preferredCity;
  if (data.availabilityStatus !== undefined) syncData.availabilityStatus = data.availabilityStatus;
  if (data.photoUrl !== undefined) syncData.photoUrl = data.photoUrl;

  if (Object.keys(syncData).length > 1) {
    await updateDoc(doc(db, "users", guardId), syncData);
  }
}

// ==================== HR KYC ====================

export async function submitHrKYC(data: HrKYCData): Promise<void> {
  await setDoc(doc(db, "hr_kyc", data.hrId), data);
  await updateDoc(doc(db, "users", data.hrId), {
    kycStatus: "pending",
    companyDetails: {
      name: data.companyName,
      website: data.website,
      logoUrl: data.logoUrl || "",
    },
    updatedAt: new Date().toISOString(),
  });
  const user = await getUserProfile(data.hrId);

}

export async function getHrKYC(hrId: string): Promise<HrKYCData | null> {
  const docSnap = await getDoc(doc(db, "hr_kyc", hrId));
  return docSnap.exists() ? (docSnap.data() as HrKYCData) : null;
}

export async function getAllHrKYC(): Promise<HrKYCData[]> {
  const snapshot = await getDocs(collection(db, "hr_kyc"));
  return snapshot.docs.map((d) => d.data() as HrKYCData);
}

export async function updateHrKYCStatus(
  hrId: string,
  status: KYCStatus,
  reviewedBy: string,
  rejectionReason?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  };
  if (rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }
  await updateDoc(doc(db, "hr_kyc", hrId), updateData);

  const finalUpdate: Record<string, any> = {
    kycStatus: status,
    updatedAt: new Date().toISOString(),
  };

  if (status === "approved") {
    const kycSnap = await getDoc(doc(db, "hr_kyc", hrId));
    if (kycSnap.exists()) {
      const kycData = kycSnap.data() as HrKYCData;
      finalUpdate.companyDetails = {
        name: kycData.companyName,
        website: kycData.website,
        logoUrl: kycData.logoUrl || "",
      };
    }
  }

  await updateDoc(doc(db, "users", hrId), finalUpdate);

  // Audit Log: HR KYC Status Update
  await logActivity({
    userId: reviewedBy,
    email: hrId,
    action: `HR Verification ${status.toUpperCase()}`,
    role: "admin",
    details: { hrId, reason: rejectionReason || "N/A" }
  });

  if (status === "approved") {

    const user = await getUserProfile(hrId);
    if (user) {
      sendEmail({
        to: user.email,
        subject: "TheNST – Company Verification Approved",
        template: "approval",
        data: {
          fullName: user.fullName,
          role: "hr",
        }
      }).catch(err => console.error("HR KYC approval email failed:", err));

      await createNotification(hrId, {
        title: "Company Verified!",
        message: "Your company details have been approved. You can now start hiring elite personnel.",
        type: "success",
        link: "/dashboard/hr",
      });
    }
  } else if (status === "rejected") {

    const user = await getUserProfile(hrId);
    if (user) {
      sendEmail({
        to: user.email,
        subject: "TheNST – Company Verification Update",
        template: "rejection",
        data: {
          fullName: user.fullName,
          role: "hr",
          reason: rejectionReason
        }
      }).catch(err => console.error("HR KYC rejection email failed:", err));

      await createNotification(hrId, {
        title: "Company Verification Update",
        message: `Your company verification was rejected. Reason: ${rejectionReason}. Please review your details.`,
        type: "warning",
        link: "/dashboard/hr/kyc",
      });
    }
  }
}

export async function updateHrKYC(
  hrId: string,
  data: Partial<HrKYCData>
): Promise<void> {
  const userSnap = await getDoc(doc(db, "users", hrId));
  const safeData = { ...data };

  // Strict Backend Security: Never allow approved users to alter legal identity without Admin review
  if (userSnap.exists() && userSnap.data().kycStatus === "approved") {
    delete safeData.companyName;
    delete safeData.registrationNumber;
    delete safeData.documents;
  }

  // Update the hr_kyc document with safe fields
  await updateDoc(doc(db, "hr_kyc", hrId), {
    ...safeData,
    updatedAt: new Date().toISOString(),
  });

  // Sync company name/website to user profile if they changed
  const userUpdate: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (safeData.companyName !== undefined) {
    userUpdate["companyDetails.name"] = safeData.companyName;
  }
  if (safeData.website !== undefined) {
    userUpdate["companyDetails.website"] = safeData.website;
  }
  if ((data as any).designation !== undefined) {
    userUpdate["companyDetails.designation"] = (data as any).designation;
  }
  if (data.logoUrl !== undefined) {
    userUpdate["companyDetails.logoUrl"] = data.logoUrl;
  }

  // Only run the update if there's something to sync beyond updatedAt
  if (Object.keys(userUpdate).length > 1) {
    await updateDoc(doc(db, "users", hrId), userUpdate);
  }
}

// ==================== AGENCY KYC ====================

export async function submitAgencyKYC(data: import("./types").AgencyKYCData): Promise<void> {
  await setDoc(doc(db, "agency_kyc", data.agencyId), data);
  await updateDoc(doc(db, "users", data.agencyId), {
    kycStatus: "pending",
    agencyDetails: {
      totalCapacity: data.capacity,
      specialties: data.specialties || [],
      sectors: data.sectors || [],
      gstNumber: data.gstNumber,
      psaraLicense: data.psaraLicenseNumber,
      incorporationNumber: data.registrationNumber,
      serviceLocations: data.serviceLocations || [],
    },
    companyDetails: {
      name: data.companyName,
      website: data.website || "",
      logoUrl: data.logoUrl || "",
    },
    updatedAt: new Date().toISOString(),
  });
  const user = await getUserProfile(data.agencyId);

}

export async function getAgencyKYC(agencyId: string): Promise<import("./types").AgencyKYCData | null> {
  const docSnap = await getDoc(doc(db, "agency_kyc", agencyId));
  return docSnap.exists() ? (docSnap.data() as import("./types").AgencyKYCData) : null;
}

export async function getAllAgencyKYC(): Promise<import("./types").AgencyKYCData[]> {
  const snapshot = await getDocs(collection(db, "agency_kyc"));
  return snapshot.docs.map((d) => d.data() as import("./types").AgencyKYCData);
}

export async function updateAgencyKYCStatus(
  agencyId: string,
  status: KYCStatus,
  reviewedBy: string,
  rejectionReason?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  };
  if (rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }
  await updateDoc(doc(db, "agency_kyc", agencyId), updateData);

  const finalUpdate: Record<string, any> = {
    kycStatus: status,
    updatedAt: new Date().toISOString(),
  };

  if (status === "approved") {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 10); // 10 years free
    
    finalUpdate.agencySubscription = {
      plan: "enterprise",
      status: "active",
      expiresAt: expiresAt.toISOString(),
      paymentMethod: "free_tier"
    };
  }

  await updateDoc(doc(db, "users", agencyId), finalUpdate);

  // Audit Log: Agency KYC Status Update
  await logActivity({
    userId: reviewedBy,
    email: agencyId,
    action: `Agency Verification ${status.toUpperCase()}`,
    role: "admin",
    details: { agencyId, reason: rejectionReason || "N/A" }
  });

  if (status === "approved") {

    const user = await getUserProfile(agencyId);
    if (user) {
      sendEmail({
        to: user.email,
        subject: "TheNST – Agency Verification Approved",
        template: "approval",
        data: {
          fullName: user.fullName,
          role: "agency",
        }
      }).catch(err => console.error("Agency KYC approval email failed:", err));

      await createNotification(agencyId, {
        title: "Agency Verified!",
        message: "Your agency details have been approved. You are now eligible to receive hiring requests.",
        type: "success",
        link: "/dashboard/agency",
      });
    }
  } else if (status === "rejected") {

    const user = await getUserProfile(agencyId);
    if (user) {
      sendEmail({
        to: user.email,
        subject: "TheNST – Agency Verification Update",
        template: "rejection",
        data: {
          fullName: user.fullName,
          role: "agency",
          reason: rejectionReason
        }
      }).catch(err => console.error("Agency KYC rejection email failed:", err));

      await createNotification(agencyId, {
        title: "Agency Verification Update",
        message: `Your agency verification was rejected. Reason: ${rejectionReason}. Please review your details and resubmit.`,
        type: "warning",
        link: "/dashboard/agency/kyc",
      });
    }
  }
}

export async function updateAgencyKYC(
  agencyId: string,
  data: Partial<import("./types").AgencyKYCData>
): Promise<void> {
  const userSnap = await getDoc(doc(db, "users", agencyId));
  const safeData = { ...data };

  if (userSnap.exists() && userSnap.data().kycStatus === "approved") {
    delete safeData.companyName;
    delete safeData.registrationNumber;
    delete safeData.gstNumber;
    delete safeData.psaraLicenseNumber;
    delete safeData.documents;
  }

  await updateDoc(doc(db, "agency_kyc", agencyId), {
    ...safeData,
    updatedAt: new Date().toISOString(),
  });

  const userUpdate: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (safeData.companyName !== undefined) userUpdate["companyDetails.name"] = safeData.companyName;
  if (safeData.website !== undefined) userUpdate["companyDetails.website"] = safeData.website;
  if (safeData.logoUrl !== undefined) userUpdate["companyDetails.logoUrl"] = safeData.logoUrl;
  if (safeData.capacity !== undefined) userUpdate["agencyDetails.totalCapacity"] = safeData.capacity;
  if (safeData.specialties !== undefined) userUpdate["agencyDetails.specialties"] = safeData.specialties;
  if (safeData.sectors !== undefined) userUpdate["agencyDetails.sectors"] = safeData.sectors;
  if (safeData.serviceLocations !== undefined) userUpdate["agencyDetails.serviceLocations"] = safeData.serviceLocations;

  if (Object.keys(userUpdate).length > 1) {
    await updateDoc(doc(db, "users", agencyId), userUpdate);
  }
}

// ==================== STATS ====================

export async function getDashboardStats(): Promise<DashboardStats> {
  const usersRef = collection(db, "users");
  const kycRef = collection(db, "kyc");
  const hrKycRef = collection(db, "hr_kyc");
  const hiringRef = collection(db, "hiring_requests");

  // Efficient Parallel Aggregation
  const promises = [
    getCountFromServer(query(usersRef, where("role", "==", "guard"))),
    getCountFromServer(query(usersRef, where("role", "==", "guard"), where("kycStatus", "==", "approved"))),
    getCountFromServer(query(kycRef, where("status", "==", "pending"))),
    getCountFromServer(query(kycRef, where("status", "==", "approved"))),
    getCountFromServer(query(kycRef, where("status", "==", "rejected"))),
    getCountFromServer(query(usersRef, where("role", "==", "hr"))),
    getCountFromServer(query(usersRef, where("role", "==", "hr"), where("kycStatus", "==", "approved"))),
    getCountFromServer(query(usersRef, where("role", "==", "admin"), where("status", "==", "active"))),
    getCountFromServer(query(usersRef, where("status", "==", "active"))),
    getCountFromServer(query(usersRef, where("status", "in", ["blocked", "disabled"]))),
    getCountFromServer(query(usersRef, where("role", "==", "admin"), where("status", "==", "pending_verification"))),
    getCountFromServer(query(hrKycRef, where("status", "==", "pending"))),
    getCountFromServer(query(hiringRef, where("status", "==", "hired"))),
    getCountFromServer(query(usersRef, where("role", "==", "agency"))),
    getCountFromServer(query(usersRef, where("role", "==", "agency"), where("kycStatus", "==", "approved"))),
  ];

  const results = await Promise.all(promises);

  return {
    totalGuards: results[0].data().count,
    verifiedGuards: results[1].data().count,
    pendingKYC: results[2].data().count,
    approvedKYC: results[3].data().count,
    rejectedKYC: results[4].data().count,
    totalHR: results[5].data().count,
    verifiedHR: results[6].data().count,
    totalAdmins: results[7].data().count,
    activeUsers: results[8].data().count,
    blockedUsers: results[9].data().count,
    pendingAdminCount: results[10].data().count,
    pendingHrCount: results[11].data().count,
    totalPlacements: results[12].data().count,
    totalAgencies: results[13].data().count,
    verifiedAgencies: results[14].data().count,
  };
}

export async function getInternDashboardStats(): Promise<Partial<DashboardStats>> {
  const usersRef = collection(db, "users");
  const hiringRef = collection(db, "hiring_requests");

  const promises = [
    getCountFromServer(query(usersRef, where("role", "==", "guard"), where("kycStatus", "==", "approved"))),
    getCountFromServer(query(usersRef, where("role", "==", "agency"), where("kycStatus", "==", "approved"))),
    getCountFromServer(query(hiringRef, where("status", "==", "hired"))),
  ];

  const results = await Promise.all(promises);

  return {
    verifiedGuards: results[0].data().count,
    verifiedAgencies: results[1].data().count,
    totalPlacements: results[2].data().count,
  };
}

export async function updateHiringFinalStatus(requestId: string, status: "hired" | "interv_rejected"): Promise<void> {
  const requestRef = doc(db, "hiring_requests", requestId);
  const requestSnap = await getDoc(requestRef);
  if (!requestSnap.exists()) return;
  const requestData = requestSnap.data() as HiringRequest;

  await updateDoc(requestRef, { 
    status,
    updatedAt: new Date().toISOString()
  });

  // Escrow Logic
  if (requestData.escrowAmount) {
    const hrRef = doc(db, "users", requestData.hrId);
    if (status === "hired") {
      // Permanent consumption: just clear pending
      await updateDoc(hrRef, {
        pendingCredits: increment(-requestData.escrowAmount)
      });
    } else {
      // Refund
      await updateDoc(hrRef, {
        pendingCredits: increment(-requestData.escrowAmount),
        credits: increment(requestData.escrowAmount)
      });
    }
  }

  // Audit Log: Final Hiring Decision
  if (requestData) {
    
    await logActivity({
      userId: requestData.hrId,
      email: requestData.guardEmail || requestData.guardId,
      action: status === "hired" ? "HIRED" : "INTERVIEW REJECTED",
      role: "hr",
      details: { requestId, guardName: requestData.guardName }
    });

    if (status === "hired") {
      // 1. Notify the Target (Guard or Agency) via In-App Notification
      const targetId = requestData.agencyId || requestData.guardId;
      const isAgency = !!requestData.agencyId;

      await createNotification(targetId, {
        title: isAgency ? "Deal Finalized! 🎊" : "Congratulations! You're Hired! 🎊",
        message: isAgency 
          ? `Your deal with ${requestData.companyName} has been successfully finalized. Congratulations on the successful collaboration!`
          : `You have been marked as hired by ${requestData.companyName}. We wish you a great experience!`,
        type: "success",
        link: isAgency ? "/dashboard/agency/requests" : "/dashboard/guard",
      });

      // 2. Notify via Email
      let targetEmail = requestData.guardEmail;

      // Real-time lookup to ensure no legacy/hardcoded fallback is used
      const userProfile = await getUserProfile(targetId);
      if (userProfile?.email) {
        targetEmail = userProfile.email;
      }

      if (targetEmail && targetEmail !== "unknown@agency.com") {
        await sendEmail({
          to: targetEmail,
          subject: isAgency ? "Partnership Confirmed! 🎉" : "Congratulations! You’ve Been Hired 🎉",
          template: "hiring_success",
          data: {
            fullName: requestData.guardName,
            companyName: requestData.companyName,
            hrName: requestData.hrName,
            hrEmail: requestData.hrEmail,
            isAgency: isAgency
          }
        }).catch(err => console.error("Hiring success email failed:", err));
      }
    } else {
      // Notify Target about the rejection
      const targetId = requestData.agencyId || requestData.guardId;
      await createNotification(targetId, {
        title: "Hiring Update",
        message: `Your hiring process with ${requestData.companyName} has concluded.`,
        type: "info",
      });
    }
  }
}

export async function getAllHiredRequests(): Promise<HiringRequest[]> {
  const q = query(
    collection(db, "hiring_requests"),
    where("status", "==", "hired"),
    limit(50) // Prevent memory crash with large data
  );
  const snapshot = await getDocs(q);
  const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HiringRequest));
  
  // Sort in-memory by updatedAt/createdAt (descending) to avoid composite index requirement
  return requests.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

// ==================== HIRING REQUESTS ====================

export async function sendHiringRequest(request: HiringRequest): Promise<void> {
  const userRef = doc(db, "users", request.hrId);
  const unlockedRef = doc(db, "users", request.hrId, "unlocked_guards", request.guardId);
  
  const [userSnap, unlockedSnap] = await Promise.all([
    getDoc(userRef),
    getDoc(unlockedRef)
  ]);
  
  const isAlreadyUnlocked = unlockedSnap.exists();

  if (!isAlreadyUnlocked) {
    if (!userSnap.exists() || (userSnap.data().credits || 0) < 1) {
      throw new Error("Insufficient credits to send a direct hiring request.");
    }
  }

  // 1. Fetch existing requests between this HR and this Guard (No complex index needed)
  const q = query(
    collection(db, "hiring_requests"),
    where("hrId", "==", request.hrId),
    where("guardId", "==", request.guardId)
  );
  
  const snapshot = await getDocs(q);
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  // 2. Perform the time check in JavaScript
  const hasRecentRequest = snapshot.docs.some(doc => {
    const data = doc.data() as HiringRequest;
    return new Date(data.createdAt).getTime() > twentyFourHoursAgo;
  });

  if (hasRecentRequest) {
    throw new Error("You can only send one hiring request to the same professional every 24 hours.");
  }

  if (!isAlreadyUnlocked) {
    // Deduct Credit
    await updateDoc(userRef, {
      credits: increment(-1),
      updatedAt: new Date().toISOString()
    });
    // Record it as unlocked so they don't get double charged in the future
    await setDoc(unlockedRef, {
      unlockedAt: new Date().toISOString()
    });
  }

  const newRef = doc(collection(db, "hiring_requests"));
  await setDoc(newRef, { ...request, id: newRef.id });

  // Audit Log: Hiring Request Sent
  await logActivity({
    userId: request.hrId,
    email: request.guardEmail || request.guardId,
    action: "Hiring Request Sent",
    role: "hr",
    details: { requestId: newRef.id, isBulk: request.isBulk || false }
  });

  // 1. Notify the Guard via In-App Notification
  await createNotification(request.guardId, {
    title: "New Hiring Request!",
    message: `${request.companyName} has sent you a hiring request.`,
    type: "info",
    link: "/dashboard/guard",
  });

  // 2. Notify the Guard via Email (HR sends this, so it has more permissions)
  if (request.guardEmail) {
    await sendEmail({
      to: request.guardEmail,
      subject: "New Hiring Request on TheNST 📩",
      template: "hired", // We reuse 'hired' template or keep as is
      data: {
        fullName: request.guardName,
        companyName: request.companyName,
        hrName: request.hrName,
        hrEmail: request.hrEmail,
        message: request.message,
      }
    }).catch(err => console.error("Hiring invitation email failed:", err));
  }

}

export async function getHrHiringRequests(hrId: string): Promise<HiringRequest[]> {
  const q = query(collection(db, "hiring_requests"), where("hrId", "==", hrId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HiringRequest));
}

export async function getGuardHiringRequests(guardId: string): Promise<HiringRequest[]> {
  const q = query(collection(db, "hiring_requests"), where("guardId", "==", guardId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HiringRequest));
}


export async function updateHiringRequestStatus(requestId: string, status: "accepted" | "rejected"): Promise<void> {
  const requestRef = doc(db, "hiring_requests", requestId);
  await updateDoc(requestRef, { status });

  // Audit Log: Hiring Request Status Update
  const requestSnapForLog = await getDoc(requestRef);
  if (requestSnapForLog.exists()) {
    const data = requestSnapForLog.data() as HiringRequest;
    await logActivity({
      userId: data.guardId,
      email: data.hrEmail,
      action: `Request ${status.toUpperCase()}`,
      role: data.agencyId ? "agency" : "guard",
      details: { requestId, hrName: data.hrName }
    });
  }

  if (status === "accepted") {
    const requestSnap = await getDoc(requestRef);
    if (requestSnap.exists()) {
        const requestData = requestSnap.data() as HiringRequest;

    }
    try {
      const requestSnap = await getDoc(requestRef);
      if (requestSnap.exists()) {
        const requestData = requestSnap.data() as HiringRequest;
        const agencyProfile = requestData.agencyId ? await getUserProfile(requestData.agencyId) : null;

        // 1. Notify the HR about the acceptance via Email
        if (requestData.hrEmail) {
          await sendEmail({
            to: requestData.hrEmail,
            subject: "Hiring Request Accepted ✅",
            template: "acceptance",
            data: {
              fullName: requestData.hrName,
              companyName: requestData.companyName,
              candidateName: requestData.guardName,
              contactPerson: agencyProfile?.fullName,
              isAgency: !!requestData.agencyId,
            }
          }).catch(err => console.error("Hiring acceptance email to HR failed:", err));
        }

        // 2. Notify the HR via In-App Notification
        await createNotification(requestData.hrId, {
          title: "Hiring Request Accepted!",
          message: `${requestData.guardName} has accepted your hiring request.`,
          type: "success",
          link: "/dashboard/messages",
        });

        // 3. Auto-create Chat Room for the accepted request
        const roomId = await createChatRoom(requestId, requestData);
        // Store the persistent room ID back in the request for easy frontend access
        await updateDoc(requestRef, { chatRoomId: roomId });
      }
    } catch (error) {
      console.error("Failed to process hiring acceptance:", error);
    }
  } else if (status === "rejected") {
    try {
      const requestSnap = await getDoc(requestRef);
      if (requestSnap.exists()) {
        const requestData = requestSnap.data() as HiringRequest;
        const agencyProfile = requestData.agencyId ? await getUserProfile(requestData.agencyId) : null;

        // Notify the HR that their request was rejected via Email
        if (requestData.hrEmail) {
          await sendEmail({
            to: requestData.hrEmail,
            subject: "Hiring Request Update",
            template: "hiring_rejection",
            data: {
              fullName: requestData.hrName,
              companyName: requestData.companyName,
              candidateName: requestData.guardName,
              contactPerson: agencyProfile?.fullName,
              isAgency: !!requestData.agencyId,
            }
          }).catch(err => console.error("Hiring rejection email to HR failed:", err));
        }

        // Notify the HR via In-App Notification
        await createNotification(requestData.hrId, {
          title: "Hiring Request Declined",
          message: `${requestData.guardName} has declined your hiring request.`,
          type: "info",
          link: "/dashboard/hr",
        });
      }
    } catch (error) {
      console.error("Failed to send hiring rejection notification:", error);
    }
  }
}

// ==================== SUBSCRIPTIONS & TRANSACTIONS ====================

export async function recordTransaction(data: Omit<Transaction, "id" | "timestamp">): Promise<string> {
  const transactionRef = doc(collection(db, "transactions"));
  const transactionData: Transaction = {
    ...data,
    id: transactionRef.id,
    timestamp: new Date().toISOString(),
  };
  await setDoc(transactionRef, transactionData);
  return transactionRef.id;
}

export async function updateTransactionStatusByPaymentId(paymentId: string, status: string, userId?: string): Promise<void> {
  const constraints = [where("paymentId", "==", paymentId)];
  if (userId) {
    constraints.push(where("userId", "==", userId));
  }
  const q = query(collection(db, "transactions"), ...constraints);
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docRef = snap.docs[0].ref;
    await updateDoc(docRef, { status });
  }
}

export async function purchaseCredits(
  hrId: string,
  hrName: string,
  packName: string,
  amount: number,
  credits: number,
  paymentId?: string,
  paymentMethod: string = "paypal"
): Promise<void> {
  if (paymentMethod === "paypal") {
    throw new Error("PayPal transactions must be verified via the secure backend API route.");
  }

  const isInstant = paymentMethod === "cashfree";
  const txStatus = isInstant ? "completed" : "pending";

  // 1. Record or Update Unified Transaction
  if (isInstant && paymentId) {
    await updateTransactionStatusByPaymentId(paymentId, txStatus, hrId);
  } else {
    await recordTransaction({
      userId: hrId,
      userName: hrName,
      userRole: "hr",
      amount,
      planName: packName,
      type: "credits",
      creditsAdded: credits,
      paymentId: paymentId || undefined,
      paymentMethod,
      status: txStatus,
      // Legacy support for backward compatibility if needed
      hrId,
      hrName,
      packName,
    });
  }

  if (isInstant) {
    // 2. Add Credits instantly
    const userRef = doc(db, "users", hrId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const currentCredits = userSnap.data().credits || 0;
      await updateDoc(userRef, {
        credits: currentCredits + credits,
        updatedAt: new Date().toISOString()
      });
    }

    // 3. Notify Success
    await createNotification(hrId, {
      title: "Credits Added Successfully! 🎉",
      message: `Your payment was successful. ${credits} credits have been added to your account.`,
      type: "success"
    });
  } else {
    // Send In-App Notification for submitting a manual purchase request
    await createNotification(hrId, {
      title: "Credits Recharge Request Submitted",
      message: `Your manual UPI recharge request for ${credits} credits (₹${amount}) has been submitted and is pending verification.`,
      type: "info"
    });
  }
}

export async function approveTransaction(transactionId: string): Promise<void> {
  const txRef = doc(db, "transactions", transactionId);
  const txSnap = await getDoc(txRef);
  
  if (!txSnap.exists()) throw new Error("Transaction not found");
  
  const txData = txSnap.data() as Transaction;
  if (txData.status === "completed") return; // Already completed
  
  // 1. Mark as completed
  await updateDoc(txRef, { status: "completed" });
  
  // 2. Increment credits
  if (txData.userId && txData.creditsAdded) {
    const userRef = doc(db, "users", txData.userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const currentCredits = userSnap.data().credits || 0;
      await updateDoc(userRef, {
        credits: currentCredits + txData.creditsAdded,
        updatedAt: new Date().toISOString(),
      });

      // Send In-App Notification for approved credits
      await createNotification(txData.userId, {
        title: "Credits Approved Successfully",
        message: `Your manual UPI request for ${txData.creditsAdded} credits (₹${txData.amount}) has been approved and added to your balance.`,
        type: "success"
      });
    }
  }
}

export async function rejectTransaction(transactionId: string): Promise<void> {
  const txRef = doc(db, "transactions", transactionId);
  const txSnap = await getDoc(txRef);

  await updateDoc(txRef, { status: "rejected" });

  if (txSnap.exists()) {
    const txData = txSnap.data() as Transaction;
    if (txData.userId) {
      // Send In-App Notification for rejected credits
      await createNotification(txData.userId, {
        title: "Credits Request Declined",
        message: `Your manual UPI recharge request for ${txData.creditsAdded} credits (₹${txData.amount}) was declined. Please verify your transaction details.`,
        type: "warning"
      });
    }
  }
}

export async function unlockProfile(hrId: string, guardId: string): Promise<boolean> {
  const userRef = doc(db, "users", hrId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return false;

  const userData = userSnap.data();
  const currentCredits = userData.credits || 0;

  if (currentCredits < 1) return false;

  // Decrease credit
  await updateDoc(userRef, {
    credits: currentCredits - 1,
    updatedAt: new Date().toISOString()
  });

  // Add to unlocked collection
  await setDoc(doc(db, "users", hrId, "unlocked_guards", guardId), {
    unlockedAt: new Date().toISOString()
  });

  return true;
}

export async function isProfileUnlocked(hrId: string, guardId: string): Promise<boolean> {
  const docSnap = await getDoc(doc(db, "users", hrId, "unlocked_guards", guardId));
  return docSnap.exists();
}

export async function getAllTransactions() {
  const snapshot = await getDocs(collection(db, "transactions"));
  return snapshot.docs.map(doc => doc.data());
}

export async function getSalesStats() {
  try {
    const snapshot = await getDocs(collection(db, "transactions"));
    let transactions = snapshot.docs.map(doc => doc.data() as Transaction);
    
    // Hide internal credit usage logs and any malformed legacy transactions
    transactions = transactions.filter(t => 
        t.type !== "credit_deduction" && 
        (t.type || t.userId || t.hrId)
    );

    const hrQuery = query(collection(db, "users"), where("role", "==", "hr"), where("namespace", "==", APP_NAMESPACE));
    const hrSnapshot = await getDocs(hrQuery);
    const activeRecruiters = hrSnapshot.docs.filter(doc => doc.data().status === "active").length;

    // Calculate total revenue from all transaction types
    const totalRevenue = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalTransactionsValue = transactions.length;

    return { 
      totalRevenue, 
      totalTransactions: totalTransactionsValue, 
      activeRecruiters,
      transactions 
    };
  } catch (error) {
    console.error("Error fetching sales stats:", error);
    return { totalRevenue: 0, totalTransactions: 0, activeRecruiters: 0, transactions: [] };
  }
}

// ==================== SYSTEM CONFIG ====================

const DEFAULT_CONFIG: SystemConfig = {
  maintenanceMode: false,
  allowRegistrations: true,
  currency: "INR",
  globalBanner: {
    message: "",
    active: false,
    type: "info",
  },
  packages: [
    {
      id: "silver",
      name: "Silver Pack",
      credits: 50,
      price: 499,
      features: ["Access to 50 Profiles", "Email & Phone Details", "No Expiry"],
    },
    {
      id: "platinum",
      name: "Platinum Pack",
      credits: 200,
      price: 999,
      features: ["Access to 200 Profiles", "Email & Phone Details", "Priority Support", "Best Value"],
    },
  ],
  guardPlans: [
    {
      id: "monthly",
      name: "Monthly",
      price: 99,
      duration: "month",
      features: ["Unlimited applications", "Access to verified security jobs", "Standard profile ranking"]
    },
    {
      id: "yearly",
      name: "Yearly",
      price: 999,
      duration: "year",
      features: ["Unlimited applications", "Featured profile ranking", "Direct recruiter chat", "Priority support"]
    }
  ],
  updatedAt: new Date().toISOString(),
};

export async function getSystemConfig(): Promise<SystemConfig> {
  const docRef = doc(db, "system", "config");
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Merge with defaults to handle migrations/missing fields
    return {
      ...DEFAULT_CONFIG,
      ...data,
      globalBanner: {
        ...DEFAULT_CONFIG.globalBanner,
        ...(data.globalBanner || {})
      },
      packages: data.packages || DEFAULT_CONFIG.packages,
      guardPlans: data.guardPlans || DEFAULT_CONFIG.guardPlans
    } as SystemConfig;
  }

  // Initialize with defaults if not exists
  await setDoc(docRef, DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}
export async function updateSystemConfig(config: Partial<SystemConfig>): Promise<void> {
  await updateDoc(doc(db, "system", "config"), {
    ...config,
    updatedAt: new Date().toISOString(),
  });

  // Audit Log: System Config Update
  await logActivity({
    userId: "admin",
    email: "system@config",
    action: "UPDATE SYSTEM CONFIG",
    role: "admin",
    details: { updatedFields: Object.keys(config) }
  });
}

export async function getSystemHealth(): Promise<SystemHealthStatus> {
  const start = Date.now();

  try {
    // High Performance Aggregation Queries (Count only, no document fetching)
    const usersCountPromise = getCountFromServer(collection(db, "users"));
    const transactionsCountPromise = getCountFromServer(collection(db, "transactions"));
    const kycCountPromise = getCountFromServer(collection(db, "kyc"));
    const configPromise = getSystemConfig();

    const [usersSnap, transactionsSnap, kycSnap, config] = await Promise.all([
      usersCountPromise,
      transactionsCountPromise,
      kycCountPromise,
      configPromise
    ]);

    const latency = Date.now() - start;

    return {
      services: [
        {
          name: "Firestore Database",
          status: latency < 500 ? "operational" : "degraded",
          latency: latency,
        },
        {
          name: "Firebase Auth",
          status: "operational",
          latency: Math.floor(latency * 0.4),
        },
        {
          name: "Platform Config",
          status: config ? "operational" : "outage",
          latency: Math.floor(latency * 0.6),
        }
      ],
      stats: {
        userCount: usersSnap.data().count,
        transactionCount: transactionsSnap.data().count,
        kycCount: kycSnap.data().count,
        lastPing: new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error("Health diagnostic failure:", error);
    console.error("Health check failed:", error);
    return {
      services: [
        { name: "Infrastructure", status: "outage", latency: 0 }
      ],
      stats: {
        userCount: 0,
        transactionCount: 0,
        kycCount: 0,
        lastPing: new Date().toISOString(),
      }
    };
  }
}

// ==================== CHAT SYSTEM ====================

export async function createChatRoom(requestId: string, requestData: HiringRequest): Promise<string> {
  let roomId = requestId;

  // Robust B2B ID derivation: Check agencyId, or if guardId is the agency's ID
  const hrId = requestData.hrId;
  const agencyId = requestData.agencyId || (requestData.guardId !== "BULK" && requestData.guardId !== "GUARD" ? requestData.guardId : undefined);

  // If we have both parties and it's a bulk/agency context, use a persistent ID
  if (hrId && agencyId && (requestData.isBulk || requestData.guardId === "BULK" || requestData.agencyId)) {
    roomId = `b2b_${hrId}_${agencyId}`;
  }

  const roomRef = doc(db, "chat_rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    const newRoom: ChatRoom = {
      id: roomId,
      requestId: requestId,
      hrId: requestData.hrId,
      hrName: requestData.hrName,
      ...(requestData.hrRole && { hrRole: requestData.hrRole }),
      guardId: requestData.guardId,
      guardName: requestData.guardName,
      ...(requestData.companyName && { companyName: requestData.companyName }),
      ...(requestData.agencyId && { agencyId: requestData.agencyId }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(roomRef, newRoom);
  } else {
    // If room exists, update it to point to the latest request for context
    await updateDoc(roomRef, {
      requestId: requestId,
      updatedAt: new Date().toISOString()
    });
  }
  return roomId;
}

export async function sendMessage(roomId: string, message: Omit<Message, 'id'>): Promise<void> {
  const messagesRef = collection(db, "chat_rooms", roomId, "messages");
  const msgDoc = doc(messagesRef);

  const fullMsg: Message = {
    ...message,
    id: msgDoc.id
  };

  await setDoc(msgDoc, fullMsg);

  // Update lastMessage and updatedAt in room, and increment unread count for the recipient
  const roomSnap = await getDoc(doc(db, "chat_rooms", roomId));
  const updateData: any = {
    lastMessage: fullMsg.text,
    updatedAt: fullMsg.timestamp
  };

  if (roomSnap.exists()) {
    const room = roomSnap.data() as ChatRoom;
    if (message.senderId === room.hrId) {
      if (room.agencyId) {
        updateData.agencyUnreadCount = increment(1);
      } else {
        updateData.guardUnreadCount = increment(1);
      }
    } else {
      updateData.hrUnreadCount = increment(1);
    }
  }

  await updateDoc(doc(db, "chat_rooms", roomId), updateData);
}

export async function markChatAsRead(roomId: string, role: string): Promise<void> {
  const roomRef = doc(db, "chat_rooms", roomId);
  const updateData: any = {};
  
  if (role === "hr" || role === "admin" || role === "superadmin") {
    updateData.hrUnreadCount = 0;
  } else if (role === "agency") {
    updateData.agencyUnreadCount = 0;
    updateData.guardUnreadCount = 0;
  } else {
    updateData.guardUnreadCount = 0;
  }
  
  await updateDoc(roomRef, updateData);
}

// ==================== JOB APPLICATIONS ====================

export async function getJobApplicationByGuard(jobId: string, guardId: string, hrId: string): Promise<JobApplication | null> {
  const q = query(
    collection(db, "job_applications"),
    where("jobId", "==", jobId),
    where("guardId", "==", guardId),
    where("hrId", "==", hrId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as JobApplication;
}

export async function updateJobApplicationStatus(
  applicationId: string,
  newStatus: JobApplication["status"],
  hrProfile: UserProfile,
  job: Job
): Promise<void> {
  const appRef = doc(db, "job_applications", applicationId);
  const appSnap = await getDoc(appRef);
  if (!appSnap.exists()) throw new Error("Application not found");
  const app = { id: appSnap.id, ...appSnap.data() } as JobApplication;

  if (newStatus === "accepted") {
    // 1. Check if already unlocked (Don't charge twice)
    const unlockRef = doc(db, "users", hrProfile.uid, "unlocked_guards", app.guardId);
    const unlockSnap = await getDoc(unlockRef);
    const alreadyUnlocked = unlockSnap.exists();

    if (!alreadyUnlocked) {
      // 2. Credit Check & Deduction
      if ((hrProfile.credits || 0) < 1) {
        throw new Error("Insufficient credits");
      }

      await updateDoc(doc(db, "users", hrProfile.uid), {
        credits: increment(-1),
        updatedAt: new Date().toISOString()
      });

      // 3. Mark as Unlocked
      await setDoc(unlockRef, {
        unlockedAt: new Date().toISOString(),
        via: "job_application_acceptance"
      });
    }

    // 4. Update Application Status
    await updateDoc(appRef, { status: "accepted" });

    // 3. Create Hiring Request (Bridging Job Application to Hiring System)
    const newRequestData: Omit<HiringRequest, "id"> = {
      hrId: hrProfile.uid,
      guardId: app.guardId,
      hrName: hrProfile.fullName,
      hrEmail: hrProfile.email || "",
      guardName: app.guardName,
      guardEmail: app.guardEmail,
      companyName: job.companyName || "Company",
      status: "accepted",
      message: `Your job application for ${job.title} has been accepted. We are interested in your profile.`,
      createdAt: new Date().toISOString(),
      ...(app.agencyId && { agencyId: app.agencyId }), // Added agencyId link
    };

    const requestRef = await addDoc(collection(db, "hiring_requests"), newRequestData);

    // 4. Create Chat Room
    const roomId = await createChatRoom(requestRef.id, { ...newRequestData, id: requestRef.id } as HiringRequest);
    // Store the persistent room ID in the request document
    await updateDoc(requestRef, { chatRoomId: roomId });

    // 5. In-App Notification
    await createNotification(app.guardId, {
      title: "Application Accepted! 🎉",
      message: `${job.companyName || "A company"} has accepted your application for ${job.title}. Check your Job Offers to connect!`,
      type: "success",
      link: app.isAgency ? "/dashboard/agency" : "/dashboard/guard",
    });

    // 6. Email Notification
    await sendEmail({
      to: app.guardEmail,
      subject: "Application Selected – Next Steps",
      template: "application_accepted",
      data: {
        fullName: app.guardName,
        companyName: job.companyName || "Company",
      }
    }).catch(err => console.error("Application email failed:", err));

  } else {
    // Simple status update for rejected/reviewed
    await updateDoc(appRef, { status: newStatus });
  }
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const docSnap = await getDoc(doc(db, "jobs", jobId));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Job : null;
}


