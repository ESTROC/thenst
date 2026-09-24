/**
 * Hardcoded master admins. These accounts are always granted the admin role on
 * login and cannot be removed through the admin panel.
 *
 * This array is the single source of truth — add future master admins by adding
 * their email here (and nowhere else).
 */
export const MASTER_ADMIN_EMAILS = ["harshvardhanyadav2087@gmail.com"];

export function isMasterAdmin(email?: string): boolean {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
