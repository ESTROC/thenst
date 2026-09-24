export type UserRole = "student" | "msme" | "enterprise" | "admin";

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  auth_provider: "local" | "google";
  created_at: string;
}
