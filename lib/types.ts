export type UserRole = 
  | "guard" 
  | "hr" 
  | "admin" 
  | "superadmin" 
  | "agency" 
  | "intern"
  | "pilot"
  | "educator"
  | "researcher"
  | "learner";

export type UserStatus = "active" | "disabled" | "blocked" | "pending_verification";

export type KYCStatus = "not_started" | "pending" | "approved" | "rejected";

export interface UserProfile {
  uid: string;
  namespace?: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  approvedBy?: string;
  approvedAt?: string;
  companyDetails?: {
    name: string;
    website?: string;
    designation?: string;
    logoUrl?: string;
  };
  kycStatus?: KYCStatus;
  kycId?: string;
  rejectionReason?: string;
  // Discovery fields synced from KYC for efficient filtering
  height?: string;
  weight?: string;
  skills?: string[];
  yearsOfExperience?: string;
  preferredCity?: string;
  availabilityStatus?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  credits?: number;
  pendingCredits?: number;
  guardSubscription?: {
    plan: "basic" | "premium";
    status: "active" | "expired";
    expiresAt: string;
  };
  agencyDetails?: {
    totalCapacity: number;
    specialties?: string[];
    sectors?: { category: string; roles: string[] }[];
    gstNumber?: string;
    psaraLicense?: string;
    incorporationNumber?: string;
    serviceLocations?: { country?: string; state: string; cities: string[] }[];
  };
  agencySubscription?: {
    plan: "standard" | "enterprise";
    status: "active" | "expired";
    expiresAt: string;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  amount: number;
  planName: string;
  type: "credits" | "subscription";
  creditsAdded?: number;
  paymentId?: string;
  paymentMethod?: "paypal" | "qr_manual" | "bank_manual" | "cashfree" | "free_tier";
  status?: "pending" | "completed" | "rejected";
  timestamp: string;
  // Backward Compatibility (for now)
  hrId?: string;
  hrName?: string;
  packName?: string;
}

export interface KYCData {
  uid: string;
  guardId: string;
  guardName: string;
  guardEmail: string;
  status: KYCStatus;
  // Personal Information
  dateOfBirth: string;
  gender: string;
  fatherName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  // Identity Documents
  aadharNumber?: string;
  panNumber?: string;
  voterIdNumber?: string; // Added Voter ID
  drivingLicenseNumber?: string; // Added Driving License
  aadharFrontUrl?: string;
  aadharBackUrl?: string;
  panCardUrl?: string;
  photoUrl?: string;
  // Experience
  previousExperience: string;
  yearsOfExperience: string;
  // preferredLocation/City removed
  skills?: string[]; // Added skills
  resumeUrl?: string; // Added resume URL
  // Physical Attributes
  height?: string;
  weight?: string;
  complexion?: string;
  identifyingFeatures?: string;
  preferredCity?: string; // Added preferred city
  // Professional & Preferences
  availabilityStatus?: "Actively Looking" | "Hired/Unavailable" | "On Leave";
  shiftPreference?: "Day Shift" | "Night Shift" | "Rotational" | "Any";
  certifications?: string[];
  certificationUrls?: string[];
  languages?: string[];
  // Agency-context fields occasionally stored on KYC docs
  totalCapacity?: number;
  sectors?: { category: string; roles: string[] }[];
  // Bank Details - Removed as per requirement
  // Metadata
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  updatedAt?: string;
}

export interface HrKYCData {
  uid: string;
  hrId: string; // Same as uid
  companyName: string;
  registrationNumber: string; // CIN or GST
  website: string;
  address: string;
  logoUrl?: string;
  documents: {
    incorporationCert: string; // URL
    idProof: string; // URL
  };
  status: KYCStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface AgencyKYCData {
  uid: string;
  agencyId: string; // Same as uid
  companyName: string;
  registrationNumber: string; // CIN
  gstNumber: string;
  psaraLicenseNumber: string; // Security Agency License
  email: string; // Contact email
  website?: string;
  address: string;
  logoUrl?: string;
  documents: {
    incorporationCert: string; // URL
    gstCertificate: string; // URL
    psaraLicense: string; // URL
    idProof: string; // URL
  };
  capacity: number; // Stated number of guards
  specialties?: string[]; // Deprecated, use sectors
  sectors?: { category: string; roles: string[] }[];
  serviceLocations: { country?: string; state: string; cities: string[] }[];
  status: KYCStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface DashboardStats {
  totalGuards: number;
  verifiedGuards: number;
  pendingKYC: number;
  approvedKYC: number;
  rejectedKYC: number;
  totalHR: number;
  verifiedHR: number;
  totalAgencies: number;
  verifiedAgencies: number;
  totalAdmins: number;
  activeUsers: number;
  blockedUsers: number;
  pendingAdminCount: number;
  pendingHrCount: number;
  totalPlacements: number;
}

export interface HiringRequest {
  id?: string;
  hrId: string;
  hrName: string;
  hrRole?: string;
  hrEmail: string;
  companyName: string;
  guardId: string;
  guardName: string;
  guardEmail: string;
  status: "pending" | "accepted" | "rejected" | "hired" | "interv_rejected";
  message?: string;
  createdAt: string;
  updatedAt?: string;
  isBulk?: boolean;
  bulkCount?: number;
  agencyId?: string;
  selectedSector?: string;
  selectedRoles?: string[];
  locationPreference?: string;
  chatRoomId?: string;
  escrowAmount?: number;
}
export interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
  features: string[];
}

export interface GuardPlan {
  id: string;
  name: string;
  price: number;
  duration: "month" | "year";
  features: string[];
}

export interface SystemConfig {
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  currency: string;
  globalBanner: {
    message: string;
    active: boolean;
    type: "info" | "warning" | "success";
  };
  packages: Package[];
  guardPlans: GuardPlan[];
  updatedAt: string;
}

export interface SystemHealthStatus {
  services: {
    name: string;
    status: "operational" | "degraded" | "outage";
    latency: number; // in ms
    icon?: string;
  }[];
  stats: {
    userCount: number;
    transactionCount: number;
    kycCount: number;
    lastPing: string;
  };
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: "info" | "success" | "warning";
  link?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface ChatRoom {
  id: string; // The requestId
  hrId: string;
  hrName: string;
  hrRole?: string;
  guardId: string;
  guardName: string;
  agencyId?: string; // Link to the agency providing workforce
  requestId: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  hrUnreadCount?: number;
  guardUnreadCount?: number;
  agencyUnreadCount?: number;
}

export type EmailTemplate = "welcome" | "approval" | "rejection" | "hired" | "acceptance" | "hiring_rejection" | "application_accepted";

export interface Job {
  id?: string;
  hrId: string;
  hrName: string;
  companyName: string;
  title: string;
  description: string;
  location: string;
  salary: string;
  type: string;
  requirements: string[];
  status: "open" | "closed";
  pdfUrl?: string; // Optional PDF job description
  sector?: string;
  role?: string;
  locations?: { country?: string; state: string; cities: string[] }[];
  createdAt: string;
}

export interface JobApplication {
  id?: string;
  jobId: string;
  jobTitle: string;
  hrId: string;
  guardId: string;
  guardName: string;
  guardEmail: string;
  status: "pending" | "reviewed" | "accepted" | "rejected";
  appliedAt: string;
  isAgency?: boolean;
  agencyId?: string;
  agencyName?: string;
}

export interface SystemLog {
  id?: string;
  userId: string;
  email: string;
  action: string;
  details: Record<string, any>;
  role: string;
  timestamp: string; // ISO string for frontend, serverTimestamp for DB
  userAgent: string;
}

// Re-export learn types so data/* files can import from "@/lib/types"
export type {
  BannerCard,
  BannerCategory,
  Course,
  CourseDetail,
  Module,
  PricingTier,
  AccentColor,
  TierPricing,
  Lesson,
  CourseReview,
} from "@/lib/learn/types";
