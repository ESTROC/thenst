import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CourseDetail } from "@/lib/learn/types";
import { UserRole } from "@/lib/learn/auth-types";
import { isMasterAdmin } from "@/lib/learn/master-admin";

/** A course document as stored in Firestore (doc id = slug for new courses). */
export type CourseDoc = Omit<CourseDetail, "id">;

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
}

export async function checkAdminRole(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const role = snap.data()?.role;
    return snap.exists() && (role === "admin" || role === "superadmin");
  } catch {
    return false;
  }
}

export const isAdmin = checkAdminRole;

export async function getAdminCounts(): Promise<{ courses: number; users: number }> {
  const [courses, users] = await Promise.all([
    getCountFromServer(collection(db, "courses")),
    getCountFromServer(collection(db, "users")),
  ]);
  return { courses: courses.data().count, users: users.data().count };
}

export async function getAdmins(): Promise<AdminUser[]> {
  const snap = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      full_name: typeof data.full_name === "string" ? data.full_name : "",
      email: typeof data.email === "string" ? data.email : "",
      role: "admin" as const,
    };
  });
}

/** Grants admin to an existing account. Throws if no account matches the email. */
export async function promoteToAdmin(email: string): Promise<void> {
  const value = email.trim();
  if (!value) throw new Error("Enter an email address.");
  let snap = await getDocs(query(collection(db, "users"), where("email", "==", value)));
  if (snap.empty && value !== value.toLowerCase()) {
    snap = await getDocs(query(collection(db, "users"), where("email", "==", value.toLowerCase())));
  }
  if (snap.empty) {
    throw new Error("No account found with that email. The user must sign up first.");
  }
  const target = snap.docs[0];
  if (target.data().role === "admin") throw new Error("That user is already an admin.");
  await updateDoc(target.ref, { role: "admin" });
}

export async function demoteAdmin(uid: string): Promise<void> {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists() && isMasterAdmin(snap.data().email)) {
    throw new Error("Master admin cannot be removed.");
  }
  await updateDoc(doc(db, "users", uid), { role: "student" });
}

/** Creates courses/{slug}. Throws if the slug is already taken. */
export async function createCourse(data: CourseDoc): Promise<void> {
  const ref = doc(db, "courses", data.slug);
  const [byId, bySlug] = await Promise.all([
    getDoc(ref),
    getDocs(query(collection(db, "courses"), where("slug", "==", data.slug))),
  ]);
  if (byId.exists() || !bySlug.empty) {
    throw new Error("A course with that slug already exists.");
  }
  await setDoc(ref, { tierPricing: { students: 0, msmes: 0, enterprise: 0 }, ...data });
}

/** Updates the course whose slug field matches (older docs may not be keyed by slug). */
export async function updateCourse(slug: string, data: Partial<CourseDoc>): Promise<void> {
  const snap = await getDocs(query(collection(db, "courses"), where("slug", "==", slug)));
  if (snap.empty) throw new Error("Course not found.");
  await updateDoc(snap.docs[0].ref, data);
}
