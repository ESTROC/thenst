import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Returns the slugs of courses the user is enrolled in.
 * Supports docs with a `userId` field (and `slug` field) as well as docs
 * keyed `${uid}_${slug}`. Returns [] when the collection is empty or missing.
 */
export async function getUserEnrollments(uid: string): Promise<string[]> {
  try {
    const q = query(collection(db, "enrollments"), where("userId", "==", uid));
    const snap = await getDocs(q);
    const slugs = snap.docs
      .map((d) => {
        const data = d.data();
        if (typeof data.slug === "string") return data.slug;
        return d.id.startsWith(`${uid}_`) ? d.id.slice(uid.length + 1) : null;
      })
      .filter((s): s is string => s !== null && s.length > 0);
    return Array.from(new Set(slugs));
  } catch {
    return [];
  }
}
